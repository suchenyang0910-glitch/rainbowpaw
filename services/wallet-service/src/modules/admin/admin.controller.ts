import { BadRequestException, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { success } from '../../common/utils/response';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletLogEntity } from '../wallet/entities/wallet-log.entity';
import { WithdrawRequestEntity } from '../wallet/entities/withdraw-request.entity';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
    @InjectRepository(WalletLogEntity)
    private readonly logsRepo: Repository<WalletLogEntity>,
    @InjectRepository(WithdrawRequestEntity)
    private readonly withdrawRepo: Repository<WithdrawRequestEntity>,
  ) {}

  @Get('wallet/overview')
  async walletOverview() {
    const row = await this.walletsRepo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.points_locked), 0)', 'points_locked')
      .addSelect('COALESCE(SUM(w.points_cashable), 0)', 'points_cashable')
      .addSelect('COALESCE(SUM(w.wallet_cash), 0)', 'wallet_cash')
      .addSelect('COALESCE(SUM(w.total_earned), 0)', 'total_earned')
      .addSelect('COALESCE(SUM(w.total_spent), 0)', 'total_spent')
      .getRawOne();

    return success({
      points_locked: Number(row?.points_locked || 0),
      points_cashable: Number(row?.points_cashable || 0),
      wallet_cash: Number(row?.wallet_cash || 0),
      total_earned: Number(row?.total_earned || 0),
      total_spent: Number(row?.total_spent || 0),
    });
  }

  @Get('wallet/logs')
  async walletLogs(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('globalUserId') globalUserId?: string,
    @Query('bizType') bizType?: string,
    @Query('assetType') assetType?: string,
    @Query('refId') refId?: string,
  ) {
    const page = Math.max(1, Number(current || 1));
    const size = Math.min(200, Math.max(1, Number(pageSize || 20)));
    const gu = String(globalUserId || '').trim();
    const bt = String(bizType || '').trim();
    const at = String(assetType || '').trim();
    const rid = String(refId || '').trim();

    const qb = this.logsRepo.createQueryBuilder('l');
    if (gu) qb.andWhere('l.global_user_id = :gu', { gu });
    if (bt) qb.andWhere('l.biz_type = :bt', { bt });
    if (at) qb.andWhere('l.asset_type = :at', { at });
    if (rid) qb.andWhere('l.ref_id = :rid', { rid });
    qb.orderBy('l.created_at', 'DESC');
    qb.skip((page - 1) * size).take(size);

    const [rows, total] = await qb.getManyAndCount();
    return success({
      items: rows.map((r) => ({
        id: Number(r.id),
        global_user_id: r.global_user_id,
        biz_type: r.biz_type,
        asset_type: r.asset_type,
        change_direction: r.change_direction,
        amount: Number(r.amount || 0),
        balance_before: Number(r.balance_before || 0),
        balance_after: Number(r.balance_after || 0),
        ref_type: r.ref_type,
        ref_id: r.ref_id,
        remark: r.remark,
        created_at: r.created_at ? r.created_at.toISOString() : null,
      })),
      total,
      current: page,
      pageSize: size,
    });
  }

  @Get('withdraw-requests')
  async withdrawRequests(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('globalUserId') globalUserId?: string,
  ) {
    const page = Math.max(1, Number(current || 1));
    const size = Math.min(200, Math.max(1, Number(pageSize || 20)));
    const st = String(status || '').trim();
    const gu = String(globalUserId || '').trim();

    const qb = this.withdrawRepo.createQueryBuilder('w');
    if (st) qb.andWhere('w.status = :st', { st });
    if (gu) qb.andWhere('w.global_user_id = :gu', { gu });
    qb.orderBy('w.created_at', 'DESC');
    qb.skip((page - 1) * size).take(size);

    const [rows, total] = await qb.getManyAndCount();
    return success({
      items: rows.map((r) => ({
        id: Number(r.id),
        request_no: r.request_no,
        global_user_id: r.global_user_id,
        points_cashable_amount: Number(r.points_cashable_amount || 0),
        cash_amount: Number(r.cash_amount || 0),
        status: r.status,
        created_at: r.created_at ? r.created_at.toISOString() : null,
      })),
      total,
      current: page,
      pageSize: size,
    });
  }

  @Post('withdraw-requests/:id/approve')
  async approveWithdraw(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new BadRequestException('invalid id');
    await this.withdrawRepo.update({ id: String(numId) }, { status: 'approved', reviewed_by: 'admin', reviewed_at: new Date() });
    return success({ id: numId, status: 'approved' });
  }

  @Post('withdraw-requests/:id/reject')
  async rejectWithdraw(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new BadRequestException('invalid id');
    await this.withdrawRepo.update({ id: String(numId) }, { status: 'rejected', reviewed_by: 'admin', reviewed_at: new Date() });
    return success({ id: numId, status: 'rejected' });
  }
}

