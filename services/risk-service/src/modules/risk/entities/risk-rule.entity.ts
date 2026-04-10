import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'risk', name: 'risk_rules' })
export class RiskRuleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  rule_id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32 }) // 'claw_anomaly', 'withdraw_anomaly', 'activity_anomaly'
  category: string;

  @Column({ type: 'jsonb' })
  condition: Record<string, any>; // Thresholds and limits

  @Column({ type: 'int', default: 10 }) // The risk score this rule contributes if triggered
  score_weight: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
