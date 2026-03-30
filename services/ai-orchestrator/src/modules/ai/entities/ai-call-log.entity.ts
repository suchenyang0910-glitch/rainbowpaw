import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'ai', name: 'call_logs' })
export class AiCallLogEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  global_user_id!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  role!: string;

  @Column({ type: 'varchar', length: 128 })
  model!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  provider_base_url!: string | null;

  @Column({ type: 'int', nullable: true })
  prompt_tokens!: number | null;

  @Column({ type: 'int', nullable: true })
  completion_tokens!: number | null;

  @Column({ type: 'int', nullable: true })
  total_tokens!: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true })
  cost_usd!: string | null;

  @Column({ type: 'int', nullable: true })
  latency_ms!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  request_json!: any | null;

  @Column({ type: 'jsonb', nullable: true })
  response_json!: any | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  status!: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

