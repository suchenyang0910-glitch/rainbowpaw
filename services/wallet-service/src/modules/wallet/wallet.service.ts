import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { EarnDto } from './dto/earn.dto';
import { RecycleDto } from './dto/recycle.dto';
import { SpendDto } from './dto/spend.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletLogEntity } from './entities/wallet-log.entity';
import { WithdrawRequestEntity } from './entities/withdraw-request.entity';
import { BusinessSettingEntity } from './entities/business-setting.entity';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(WalletLogEntity)
    private readonly logRepo: Repository<WalletLogEntity>,
    @InjectRepository(WithdrawRequestEntity)
    private readonly withdrawRepo: Repository<WithdrawRequestEntity>,
    @InjectRepository(IdempotencyKeyEntity)
    private readonly idemRepo: Repository<IdempotencyKeyEntity>,
    @InjectRepository(BusinessSettingEntity)
    private readonly settingRepo: Repository<BusinessSettingEntity>,
  ) {}

  private toCents(v: string | number | null | undefined): number {
    const s = String(v ?? '0').trim();
    if (!s) return 0;
    const neg = s.startsWith('-');
    const t = neg ? s.slice(1) : s;
    const parts = t.split('.');
    const i = parts[0] ? Number(parts[0]) : 0;
    const f = (parts[1] || '').padEnd(2, '0').slice(0, 2);
    const cents = i * 100 + Number(f || '0');
    return neg ? -cents : cents;
  }

  private centsToStr(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  private async ensureWallet(globalUserId: string, manager = this.walletRepo.manager, useLock = false): Promise<WalletEntity> {
    const repo = manager.getRepository(WalletEntity);
    let qb = repo.createQueryBuilder('w').where('w.global_user_id = :globalUserId', { globalUserId });
    
    if (useLock) {
      qb = qb.setLock('pessimistic_write');
    }
    
    let w = await qb.getOne();
    if (w) return w;

    w = repo.create({
      global_user_id: globalUserId,
      points_total: '0',
      points_locked: '0',
      points_cashable: '0',
      wallet_cash: '0',
      total_earned: '0',
      total_spent: '0',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return repo.save(w);
  }

  private newWithdrawNo() {
    return `wd_${randomBytes(10).toString('hex')}`;
  }

  private async withIdempotency<T>(opts: {
    idemKey: string;
    endpoint: string;
    globalUserId?: string;
    run: () => Promise<T>;
  }): Promise<T> {
    const key = String(opts.idemKey || '').trim();
    if (!key) throw new BadRequestException('missing x-idempotency-key');

    const existing = await this.idemRepo.findOne({ where: { idem_key: key } });
    if (existing) {
      if (existing.endpoint !== opts.endpoint) {
        throw new BadRequestException('idempotency key already used for different endpoint');
      }
      return (existing.response_json as T) || ({} as T);
    }

    const result = await opts.run();
    await this.idemRepo.save(
      this.idemRepo.create({
        idem_key: key,
        endpoint: opts.endpoint,
        global_user_id: opts.globalUserId || null,
        response_json: result as any,
        created_at: new Date(),
      }),
    );
    return result;
  }

  async getWallet(globalUserId: string) {
    if (!globalUserId) throw new NotFoundException('global_user_id required');
    const w = await this.ensureWallet(globalUserId);
    const points_total = Number(w.points_total || 0);
    const points_locked = Number(w.points_locked || 0);
    const points_cashable = Number(w.points_cashable || 0);
    return {
      global_user_id: w.global_user_id,
      total_points: points_total,
      locked_points: points_locked,
      cashable_points: points_cashable,
      points_total,
      points_locked,
      points_cashable,
      wallet_cash: Number(w.wallet_cash || 0),
    };
  }

  async getLogs(globalUserId: string, page = 1, pageSize = 20) {
    const take = Math.min(200, Math.max(1, Number(pageSize || 20)));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const list = await this.logRepo.find({
      where: { global_user_id: globalUserId },
      order: { created_at: 'DESC' },
      take,
      skip,
    });

    return {
      logs: list.map((l) => ({
        id: l.id,
        type: l.biz_type,
        biz_type: l.biz_type,
        status: l.status || 'posted',
        asset_type: l.asset_type,
        change_direction: l.change_direction,
        amount: Number(l.amount || 0),
        balance_before: Number(l.balance_before || 0),
        balance_after: Number(l.balance_after || 0),
        ref_type: l.ref_type,
        ref_id: l.ref_id,
        remark: l.remark,
        created_at: l.created_at,
      })),
      page: Math.max(1, Number(page || 1)),
      pageSize: take,
    };
  }

  async earn(dto: EarnDto, idemKey: string) {
    return this.withIdempotency({
      idemKey,
      endpoint: 'POST /wallet/earn',
      globalUserId: dto.global_user_id,
      run: async () => {
        return this.dataSource.transaction(async (manager) => {
          const walletRepo = manager.getRepository(WalletEntity);
          const logRepo = manager.getRepository(WalletLogEntity);

          const w = await this.ensureWallet(dto.global_user_id, manager, true);
          let locked = this.toCents(w.points_locked);
          let cashable = this.toCents(w.points_cashable);
          let cash = this.toCents(w.wallet_cash);

          for (const c of dto.changes) {
            const asset = String(c.asset_type || '').trim();
            const amt = this.toCents(c.amount);
            if (amt <= 0) throw new BadRequestException('amount must be positive');

            if (asset === 'points_locked') {
              const before = locked;
              locked += amt;
              await logRepo.save(
                logRepo.create({
                  global_user_id: w.global_user_id,
                  biz_type: dto.biz_type,
                  status: 'succeeded',
                  asset_type: 'points_locked',
                  change_direction: 'in',
                  amount: this.centsToStr(amt),
                  balance_before: this.centsToStr(before),
                  balance_after: this.centsToStr(locked),
                  ref_type: dto.ref_type || null,
                  ref_id: dto.ref_id || null,
                  remark: dto.remark || null,
                  created_at: new Date(),
                }),
              );
            } else if (asset === 'points_cashable') {
              const before = cashable;
              cashable += amt;
              await logRepo.save(
                logRepo.create({
                  global_user_id: w.global_user_id,
                  biz_type: dto.biz_type,
                  status: 'succeeded',
                  asset_type: 'points_cashable',
                  change_direction: 'in',
                  amount: this.centsToStr(amt),
                  balance_before: this.centsToStr(before),
                  balance_after: this.centsToStr(cashable),
                  ref_type: dto.ref_type || null,
                  ref_id: dto.ref_id || null,
                  remark: dto.remark || null,
                  created_at: new Date(),
                }),
              );
            } else if (asset === 'wallet_cash') {
              const before = cash;
              cash += amt;
              await logRepo.save(
                logRepo.create({
                  global_user_id: w.global_user_id,
                  biz_type: dto.biz_type,
                  status: 'succeeded',
                  asset_type: 'wallet_cash',
                  change_direction: 'in',
                  amount: this.centsToStr(amt),
                  balance_before: this.centsToStr(before),
                  balance_after: this.centsToStr(cash),
                  ref_type: dto.ref_type || null,
                  ref_id: dto.ref_id || null,
                  remark: dto.remark || null,
                  created_at: new Date(),
                }),
              );
            } else {
              throw new BadRequestException('invalid asset_type');
            }
          }

          const total = locked + cashable;
          w.points_locked = this.centsToStr(locked);
          w.points_cashable = this.centsToStr(cashable);
          w.points_total = this.centsToStr(total);
          w.wallet_cash = this.centsToStr(cash);
          w.total_earned = this.centsToStr(this.toCents(w.total_earned) + dto.changes.reduce((s, x) => s + (String(x.asset_type) === 'wallet_cash' ? 0 : this.toCents(x.amount)), 0));
          w.updated_at = new Date();
          await walletRepo.save(w);

          return {
            wallet: {
              global_user_id: w.global_user_id,
              total_points: Number(w.points_total || 0),
              locked_points: Number(w.points_locked || 0),
              cashable_points: Number(w.points_cashable || 0),
              points_total: Number(w.points_total || 0),
              points_locked: Number(w.points_locked || 0),
              points_cashable: Number(w.points_cashable || 0),
              wallet_cash: Number(w.wallet_cash || 0),
            },
          };
        });
      },
    });
  }

  async spend(dto: SpendDto, idemKey: string) {
    return this.withIdempotency({
      idemKey,
      endpoint: 'POST /wallet/spend',
      globalUserId: dto.global_user_id,
      run: async () => {
        return this.dataSource.transaction(async (manager) => {
          const walletRepo = manager.getRepository(WalletEntity);
          const logRepo = manager.getRepository(WalletLogEntity);

          const w = await this.ensureWallet(dto.global_user_id, manager, true);
          const need = this.toCents(dto.spend_amount);
          if (need <= 0) throw new BadRequestException('spend_amount must be positive');

          let locked = this.toCents(w.points_locked);
          let cashable = this.toCents(w.points_cashable);
          const total = locked + cashable;
          if (total < need) throw new BadRequestException('insufficient points');

          let left = need;
          let lockedOut = 0;
          let cashableOut = 0;

          const useLocked = Math.min(locked, left);
          if (useLocked > 0) {
            const before = locked;
            locked -= useLocked;
            left -= useLocked;
            lockedOut = useLocked;
            await logRepo.save(
              logRepo.create({
                global_user_id: w.global_user_id,
                biz_type: dto.biz_type,
                status: 'succeeded',
                asset_type: 'points_locked',
                change_direction: 'out',
                amount: this.centsToStr(useLocked),
                balance_before: this.centsToStr(before),
                balance_after: this.centsToStr(locked),
                ref_type: dto.ref_type || null,
                ref_id: dto.ref_id || null,
                remark: dto.remark || null,
                created_at: new Date(),
              }),
            );
          }

          if (left > 0) {
            const before = cashable;
            cashable -= left;
            cashableOut = left;
            await logRepo.save(
              logRepo.create({
                global_user_id: w.global_user_id,
                biz_type: dto.biz_type,
                status: 'succeeded',
                asset_type: 'points_cashable',
                change_direction: 'out',
                amount: this.centsToStr(left),
                balance_before: this.centsToStr(before),
                balance_after: this.centsToStr(cashable),
                ref_type: dto.ref_type || null,
                ref_id: dto.ref_id || null,
                remark: dto.remark || null,
                created_at: new Date(),
              }),
            );
          }

          w.points_locked = this.centsToStr(locked);
          w.points_cashable = this.centsToStr(cashable);
          w.points_total = this.centsToStr(locked + cashable);
          w.total_spent = this.centsToStr(this.toCents(w.total_spent) + need);
          w.updated_at = new Date();
          await walletRepo.save(w);

          return {
            spent: Number(this.centsToStr(need)),
            breakdown: {
              points_locked: Number(this.centsToStr(lockedOut)),
              points_cashable: Number(this.centsToStr(cashableOut)),
            },
            wallet: {
              global_user_id: w.global_user_id,
              total_points: Number(w.points_total || 0),
              locked_points: Number(w.points_locked || 0),
              cashable_points: Number(w.points_cashable || 0),
              points_total: Number(w.points_total || 0),
              points_locked: Number(w.points_locked || 0),
              points_cashable: Number(w.points_cashable || 0),
              wallet_cash: Number(w.wallet_cash || 0),
            },
          };
        });
      },
    });
  }

  async recycle(dto: RecycleDto, idemKey: string) {
    return this.withIdempotency({
      idemKey,
      endpoint: 'POST /wallet/recycle',
      globalUserId: dto.global_user_id,
      run: async () => {
        const lockedRatio = Number(dto.split_rule?.locked_ratio);
        const cashableRatio = Number(dto.split_rule?.cashable_ratio);
        if (!Number.isFinite(lockedRatio) || !Number.isFinite(cashableRatio)) {
          throw new BadRequestException('invalid split_rule');
        }
        const sum = Math.round((lockedRatio + cashableRatio) * 1000) / 1000;
        if (sum !== 1) throw new BadRequestException('split_rule ratios must sum to 1');

        const recycleCents = this.toCents(dto.recycle_amount);
        if (recycleCents <= 0) throw new BadRequestException('recycle_amount must be positive');

        const lockedAdd = Math.round(recycleCents * lockedRatio);
        const cashableAdd = recycleCents - lockedAdd;

        const result = await this.earn(
          {
            global_user_id: dto.global_user_id,
            biz_type: dto.biz_type,
            changes: [
              { asset_type: 'points_locked', amount: Number(this.centsToStr(lockedAdd)) },
              { asset_type: 'points_cashable', amount: Number(this.centsToStr(cashableAdd)) },
            ],
            ref_type: dto.ref_type,
            ref_id: dto.ref_id,
            remark: 'recycle',
          } as any,
          `recycle:${idemKey}`,
        );

        return {
          points_locked_added: Number(this.centsToStr(lockedAdd)),
          points_cashable_added: Number(this.centsToStr(cashableAdd)),
          wallet: (result as any).wallet,
        };
      },
    });
  }

  async getBusinessSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value || defaultValue;
  }

  async withdraw(dto: WithdrawDto, idemKey: string) {
    return this.withIdempotency({
      idemKey,
      endpoint: 'POST /wallet/withdraw',
      globalUserId: dto.global_user_id,
      run: async () => {
        const points = this.toCents(dto.points_cashable_amount);
        const minWithdrawPoints = Number(await this.getBusinessSetting('MIN_WITHDRAW_POINTS', '20')) * 100;
        const withdrawFeePercent = Number(await this.getBusinessSetting('WITHDRAW_FEE_PERCENT', '0.05'));
        const pointToUsdRatio = Number(await this.getBusinessSetting('POINT_TO_USD_RATIO', '0.5'));

        if (points < minWithdrawPoints) {
          throw new BadRequestException(`minimum withdraw is ${minWithdrawPoints / 100} points`);
        }

        return this.dataSource.transaction(async (manager) => {
          const walletRepo = manager.getRepository(WalletEntity);
          const logRepo = manager.getRepository(WalletLogEntity);
          const withdrawRepo = manager.getRepository(WithdrawRequestEntity);

          const w = await this.ensureWallet(dto.global_user_id, manager, true);
          const cashable = this.toCents(w.points_cashable);
          if (cashable < points) throw new BadRequestException('insufficient cashable points');

          const usdCents = Math.floor(points * pointToUsdRatio);
          const feeCents = Math.round(usdCents * withdrawFeePercent);
          const actualUsdCents = usdCents - feeCents;

          const beforeCashable = cashable;
          const afterCashable = cashable - points;
          await logRepo.save(
            logRepo.create({
              global_user_id: w.global_user_id,
              biz_type: 'withdraw_apply',
              status: 'pending',
              asset_type: 'points_cashable',
              change_direction: 'out',
              amount: this.centsToStr(points),
              balance_before: this.centsToStr(beforeCashable),
              balance_after: this.centsToStr(afterCashable),
              ref_type: 'withdraw',
              ref_id: null,
              remark: null,
              created_at: new Date(),
            }),
          );

          const beforeCash = this.toCents(w.wallet_cash);
          const afterCash = beforeCash + actualUsdCents;
          await logRepo.save(
            logRepo.create({
              global_user_id: w.global_user_id,
              biz_type: 'withdraw_apply',
              status: 'pending',
              asset_type: 'wallet_cash',
              change_direction: 'in',
              amount: this.centsToStr(actualUsdCents),
              balance_before: this.centsToStr(beforeCash),
              balance_after: this.centsToStr(afterCash),
              ref_type: 'withdraw',
              ref_id: null,
              remark: null,
              created_at: new Date(),
            }),
          );

          w.points_cashable = this.centsToStr(afterCashable);
          w.points_total = this.centsToStr(this.toCents(w.points_locked) + afterCashable);
          w.wallet_cash = this.centsToStr(afterCash);
          w.updated_at = new Date();
          await walletRepo.save(w);

          const reqNo = this.newWithdrawNo();
          await withdrawRepo.save(
            withdrawRepo.create({
              global_user_id: w.global_user_id,
              request_no: reqNo,
              points_cashable_amount: this.centsToStr(points),
              cash_amount: this.centsToStr(usdCents),
              fee_amount: this.centsToStr(feeCents),
              actual_cash_amount: this.centsToStr(actualUsdCents),
              method: dto.method,
              account_info: dto.account_info || null,
              status: 'pending',
              reviewed_by: null,
              reviewed_at: null,
              remark: null,
              created_at: new Date(),
              updated_at: new Date(),
            }),
          );

          return {
            request_no: reqNo,
            cash_amount: Number(this.centsToStr(usdCents)),
            fee_amount: Number(this.centsToStr(feeCents)),
            actual_cash_amount: Number(this.centsToStr(actualUsdCents)),
            status: 'pending',
          };
        });
      },
    });
  }

  async adminApproveWithdrawRequest(id: number, reviewer: string) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawRepo = manager.getRepository(WithdrawRequestEntity);
      const req = await withdrawRepo.findOne({ where: { id: String(id) } as any });
      if (!req) throw new BadRequestException('not found');
      if (req.status !== 'pending') throw new BadRequestException('only pending can be approved');
      req.status = 'approved';
      req.reviewed_by = reviewer;
      req.reviewed_at = new Date();
      req.updated_at = new Date();
      await withdrawRepo.save(req);
      return { id, status: req.status };
    });
  }

  async adminRejectWithdrawRequest(id: number, reviewer: string, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawRepo = manager.getRepository(WithdrawRequestEntity);
      const walletRepo = manager.getRepository(WalletEntity);
      const logRepo = manager.getRepository(WalletLogEntity);
      const req = await withdrawRepo.findOne({ where: { id: String(id) } as any });
      if (!req) throw new BadRequestException('not found');
      if (req.status !== 'pending') throw new BadRequestException('only pending can be rejected');

      const w = await this.ensureWallet(req.global_user_id, manager);
      const points = this.toCents(req.points_cashable_amount);
      const actualUsd = this.toCents(req.actual_cash_amount);

      const beforeCashable = this.toCents(w.points_cashable);
      const afterCashable = beforeCashable + points;
      await logRepo.save(
        logRepo.create({
          global_user_id: w.global_user_id,
          biz_type: 'withdraw_reject',
          status: 'succeeded',
          asset_type: 'points_cashable',
          change_direction: 'in',
          amount: this.centsToStr(points),
          balance_before: this.centsToStr(beforeCashable),
          balance_after: this.centsToStr(afterCashable),
          ref_type: 'withdraw',
          ref_id: req.request_no,
          remark: remark || null,
          created_at: new Date(),
        }),
      );

      const beforeCash = this.toCents(w.wallet_cash);
      if (beforeCash < actualUsd) throw new BadRequestException('wallet_cash insufficient for revert');
      const afterCash = beforeCash - actualUsd;
      await logRepo.save(
        logRepo.create({
          global_user_id: w.global_user_id,
          biz_type: 'withdraw_reject',
          status: 'succeeded',
          asset_type: 'wallet_cash',
          change_direction: 'out',
          amount: this.centsToStr(actualUsd),
          balance_before: this.centsToStr(beforeCash),
          balance_after: this.centsToStr(afterCash),
          ref_type: 'withdraw',
          ref_id: req.request_no,
          remark: remark || null,
          created_at: new Date(),
        }),
      );

      w.points_cashable = this.centsToStr(afterCashable);
      w.points_total = this.centsToStr(this.toCents(w.points_locked) + afterCashable);
      w.wallet_cash = this.centsToStr(afterCash);
      w.updated_at = new Date();
      await walletRepo.save(w);

      req.status = 'rejected';
      req.reviewed_by = reviewer;
      req.reviewed_at = new Date();
      req.remark = remark || req.remark;
      req.updated_at = new Date();
      await withdrawRepo.save(req);
      return { id, status: req.status };
    });
  }

  async adminMarkWithdrawPaid(id: number, reviewer: string, payoutTxid?: string, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawRepo = manager.getRepository(WithdrawRequestEntity);
      const walletRepo = manager.getRepository(WalletEntity);
      const logRepo = manager.getRepository(WalletLogEntity);
      const req = await withdrawRepo.findOne({ where: { id: String(id) } as any });
      if (!req) throw new BadRequestException('not found');
      if (req.status !== 'approved') throw new BadRequestException('only approved can be marked paid');

      const w = await this.ensureWallet(req.global_user_id, manager);
      const actualUsd = this.toCents(req.actual_cash_amount);
      const beforeCash = this.toCents(w.wallet_cash);
      if (beforeCash < actualUsd) throw new BadRequestException('wallet_cash insufficient');
      const afterCash = beforeCash - actualUsd;

      await logRepo.save(
        logRepo.create({
          global_user_id: w.global_user_id,
          biz_type: 'withdraw_paid',
          status: 'succeeded',
          asset_type: 'wallet_cash',
          change_direction: 'out',
          amount: this.centsToStr(actualUsd),
          balance_before: this.centsToStr(beforeCash),
          balance_after: this.centsToStr(afterCash),
          ref_type: 'withdraw',
          ref_id: req.request_no,
          remark: remark || null,
          created_at: new Date(),
        }),
      );

      w.wallet_cash = this.centsToStr(afterCash);
      w.updated_at = new Date();
      await walletRepo.save(w);

      req.status = 'paid';
      req.payout_txid = payoutTxid || null;
      req.payout_at = new Date();
      req.reviewed_by = reviewer;
      req.reviewed_at = new Date();
      req.remark = remark || req.remark;
      req.updated_at = new Date();
      await withdrawRepo.save(req);
      return { id, status: req.status };
    });
  }
}
