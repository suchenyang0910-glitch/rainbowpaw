import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'bridge', name: 'bridge_events' })
export class BridgeEventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  event_name: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 32 })
  source_bot: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  source_user_id: string | null;

  @Column({ type: 'bigint', nullable: true })
  telegram_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  event_data: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

