import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { RiskRuleEntity } from './entities/risk-rule.entity';
import { RiskAlertEntity } from './entities/risk-alert.entity';
import { FrozenUserEntity } from './entities/frozen-user.entity';

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
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async reportActivity(dto: { global_user_id: string; activity_type: string; metadata: any }) {
    // In a real system, this would evaluate against risk_rules asynchronously.
    // For now, let's just do a mock evaluation.
    const rules = await this.ruleRepo.find({ where: { is_active: true, category: dto.activity_type } });
    
    let totalRiskScore = 0;
    const triggeredRules: RiskRuleEntity[] = [];

    for (const rule of rules) {
      // Mock logic: trigger if metadata matches condition key
      if (rule.condition && Object.keys(rule.condition).some(k => dto.metadata[k] >= rule.condition[k])) {
        totalRiskScore += rule.score_weight;
        triggeredRules.push(rule);
      }
    }

    if (triggeredRules.length > 0) {
      const alertIds = [];
      for (const rule of triggeredRules) {
        const alertId = this.generateId('alt');
        await this.alertRepo.save(this.alertRepo.create({
          alert_id: alertId,
          global_user_id: dto.global_user_id,
          rule_id: rule.rule_id,
          risk_score: rule.score_weight,
          reason: `Triggered rule: ${rule.name}`,
          context_data: dto.metadata,
          status: 'new',
          created_at: new Date(),
          updated_at: new Date(),
        }));
        alertIds.push(alertId);
      }

      // Auto-freeze logic
      if (totalRiskScore >= 50) {
        await this.freezeUser(dto.global_user_id, 'Auto-frozen due to high risk score', alertIds[0], 'system');
      }

      return { status: 'alerted', triggered_rules: triggeredRules.length, auto_frozen: totalRiskScore >= 50 };
    }

    return { status: 'safe' };
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
