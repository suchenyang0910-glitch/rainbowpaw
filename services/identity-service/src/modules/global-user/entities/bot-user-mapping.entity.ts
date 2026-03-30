import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'identity', name: 'bot_user_mapping' })
export class BotUserMappingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  source_bot: string;

  @Column({ type: 'varchar', length: 64 })
  source_user_id: string;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  telegram_id: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

