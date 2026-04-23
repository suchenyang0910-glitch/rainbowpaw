import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { RiskRuleEntity } from './entities/risk-rule.entity';
import { RiskAlertEntity } from './entities/risk-alert.entity';
import { FrozenUserEntity } from './entities/frozen-user.entity';
import { RiskActivityEntity } from './entities/risk-activity.entity';

@Injectable()
export class RiskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RiskRuleEntity)
    private readonly ruleRepo: Repository<RiskRuleEntity>,
    @InjectRepository(RiskAlertEntity)
    private readonly alertRepo: Repository<RiskAlertEntity>,
    @InjectRepository(FrozenUserEntity)
    private readonly frozenUserRepo: Repository<FrozenUserEntity>,
    @InjectRepository(RiskActivityEntity)
    private readonly activityRepo: Repository<RiskActivityEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  private autoFreezeScore() {
    const v = Number(process.env.RISK_AUTO_FREEZE_SCORE || 50);
    return Number.isFinite(v) && v > 0 ? v : 50;
  }

  private parseMeta(dto: { metadata: any }) {
    const m = dto?.metadata && typeof dto.metadata === 'object' ? dto.metadata : {};
    const ip = m.ip != null ? String(m.ip).trim() : '';
    const deviceId = m.device_id != null ? String(m.device_id).trim() : m.deviceId != null ? String(m.deviceId).trim() : '';
    const rewardType = m.reward_type != null ? String(m.reward_type).trim() : '';
    const isWin = m.is_win != null ? Boolean(m.is_win) : Boolean(rewardType && rewardType !== 'none');
    return { ip: ip || null, device_id: deviceId || null, reward_type: rewardType || null, is_win: isWin };
  }

  private async countDistinctUsersBy(dim: 'ip' | 'device_id', value: string, windowMinutes: number) {
    const mins = Math.max(1, Number(windowMinutes || 60));
    const field = dim === 'ip' ? 'ip' : 'device_id';
    const sql = `
      SELECT COUNT(DISTINCT global_user_id) AS n
      FROM risk.risk_activity_logs
      WHERE ${field} = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 minute')
    `;
    const r = await this.dataSource.query(sql, [value, mins]);
    const n = r && r[0] && r[0].n != null ? Number(r[0].n) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  private async winRate(globalUserId: string, windowMinutes: number) {
    const mins = Math.max(1, Number(windowMinutes || 60));
    const sql = `
      SELECT
        COUNT(1) AS plays,
        SUM(CASE WHEN (metadata->>'is_win')::boolean IS TRUE THEN 1 ELSE 0 END) AS wins
      FROM risk.risk_activity_logs
      WHERE global_user_id = $1
        AND activity_type = 'claw_play'
        AND created_at >= NOW() - ($2 * INTERVAL '1 minute')
    `;
    const r = await this.dataSource.query(sql, [globalUserId, mins]);
    const plays = r && r[0] && r[0].plays != null ? Number(r[0].plays) : 0;
    const wins = r && r[0] && r[0].wins != null ? Number(r[0].wins) : 0;
    const p = Number.isFinite(plays) ? plays : 0;
    const w = Number.isFinite(wins) ? wins : 0;
    return { plays: p, wins: w, rate: p > 0 ? w / p : 0 };
  }

  async reportActivity(dto: { global_user_id: string; activity_type: string; metadata: any }) {
    const globalUserId = String(dto?.global_user_id || '').trim();
    const activityType = String(dto?.activity_type || '').trim();
    if (!globalUserId || !activityType)
      throw new BadRequestException('global_user_id/activity_type required');

    const meta = this.parseMeta(dto);
    await this.activityRepo.save(
      this.activityRepo.create({
        global_user_id: globalUserId,
        activity_type: activityType,
        ip: meta.ip,
        device_id: meta.device_id,
        metadata: { ...(dto.metadata && typeof dto.metadata === 'object' ? dto.metadata : {}), is_win: meta.is_win },
        created_at: new Date(),
      }),
    );

    const rules = await this.ruleRepo.find({
      where: [
        { is_active: true, category: activityType },
        { is_active: true, category: 'all' },
      ],
    });

    let totalRiskScore = 0;
    const triggered: RiskRuleEntity[] = [];

    for (const rule of rules) {
      const c: any = rule.condition && typeof rule.condition === 'object' ? rule.condition : {};
      const type = String(c.type || '').trim();
      if (type === 'ip_distinct_users') {
        if (!meta.ip) continue;
        const n = await this.countDistinctUsersBy('ip', meta.ip, Number(c.window_minutes || 1440));
        if (n >= Number(c.distinct_users || 5)) {
          totalRiskScore += rule.score_weight;
          triggered.push(rule);
        }
        continue;
      }
      if (type === 'device_distinct_users') {
        if (!meta.device_id) continue;
        const n = await this.countDistinctUsersBy('device_id', meta.device_id, Number(c.window_minutes || 1440));
        if (n >= Number(c.distinct_users || 3)) {
          totalRiskScore += rule.score_weight;
          triggered.push(rule);
        }
        continue;
      }
      if (type === 'win_rate') {
        const w = await this.winRate(globalUserId, Number(c.window_minutes || 60));
        const minPlays = Number(c.min_plays || 10);
        const maxRate = Number(c.max_win_rate || 0.8);
        if (w.plays >= minPlays && w.rate >= maxRate) {
          totalRiskScore += rule.score_weight;
          triggered.push(rule);
        }
        continue;
      }

      if (c && Object.keys(c).some((k) => Number(dto.metadata?.[k]) >= Number(c[k]))) {
        totalRiskScore += rule.score_weight;
        triggered.push(rule);
      }
    }

    if (!triggered.length) return { status: 'safe' };

    const alertIds: string[] = [];
    for (const rule of triggered) {
      const alertId = this.generateId('alt');
      await this.alertRepo.save(
        this.alertRepo.create({
          alert_id: alertId,
          global_user_id: globalUserId,
          rule_id: rule.rule_id,
          risk_score: rule.score_weight,
          reason: rule.name,
          context_data: dto.metadata && typeof dto.metadata === 'object' ? dto.metadata : null,
          status: 'new',
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );
      alertIds.push(alertId);
    }

    const frozen = totalRiskScore >= this.autoFreezeScore();
    if (frozen) {
      await this.freezeUser(globalUserId, 'Auto-frozen due to high risk score', alertIds[0], 'system');
    }

    return {
      status: 'alerted',
      triggered_rules: triggered.length,
      total_risk_score: totalRiskScore,
      auto_frozen: frozen,
    };
  }

  async getAlerts(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.alertRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async updateAlertStatus(alertId: string, status: string) {
    const alert = await this.alertRepo.findOne({ where: { alert_id: alertId } });
    if (!alert) throw new NotFoundException('Alert not found');

    alert.status = status;
    alert.updated_at = new Date();
    return this.alertRepo.save(alert);
  }

  async freezeUser(globalUserId: string, reason: string, relatedAlertId?: string, frozenBy?: string) {
    const existing = await this.frozenUserRepo.findOne({ where: { global_user_id: globalUserId, status: 'active' } });
    if (existing) throw new BadRequestException('User is already frozen');

    const frozen = this.frozenUserRepo.create({
      global_user_id: globalUserId,
      reason,
      related_alert_id: relatedAlertId || null,
      frozen_by: frozenBy || null,
      status: 'active',
      frozen_at: new Date(),
    });

    return this.frozenUserRepo.save(frozen);
  }

  async unfreezeUser(globalUserId: string, unfrozenReason: string) {
    const frozen = await this.frozenUserRepo.findOne({ where: { global_user_id: globalUserId, status: 'active' } });
    if (!frozen) throw new NotFoundException('No active freeze record found for user');

    frozen.status = 'lifted';
    frozen.unfrozen_reason = unfrozenReason;
    frozen.unfrozen_at = new Date();
    
    return this.frozenUserRepo.save(frozen);
  }

  async checkUserStatus(globalUserId: string) {
    const frozen = await this.frozenUserRepo.findOne({ where: { global_user_id: globalUserId, status: 'active' } });
    return {
      global_user_id: globalUserId,
      is_frozen: !!frozen,
      freeze_reason: frozen ? frozen.reason : null,
      frozen_at: frozen ? frozen.frozen_at : null,
    };
  }
}
