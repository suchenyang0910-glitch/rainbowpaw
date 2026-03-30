import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'wallet', name: 'idempotency_keys' })
export class IdempotencyKeyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  idem_key: string;

  @Column({ type: 'varchar', length: 128 })
  endpoint: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  global_user_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  response_json: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

