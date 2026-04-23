import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'risk', name: 'risk_activity_logs' })
export class RiskActivityEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  activity_type: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  device_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Index()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

