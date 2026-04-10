import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'risk', name: 'risk_alerts' })
export class RiskAlertEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  alert_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 64 })
  rule_id: string;

  @Column({ type: 'int' })
  risk_score: number;

  @Column({ type: 'varchar', length: 128 })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  context_data: Record<string, any> | null;

  @Column({ type: 'varchar', length: 16, default: 'new' }) // new, acknowledged, resolved, ignored
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
