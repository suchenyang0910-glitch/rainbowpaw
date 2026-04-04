import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'identity', name: 'global_users' })
export class GlobalUserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64, unique: true })
  global_user_id: string;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  telegram_id: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  first_source: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  primary_bot: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  pet_type: string | null;

  @Column({ type: 'int', nullable: true })
  pet_age: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  spend_total: string;

  @Column({ type: 'varchar', length: 16, default: 'low' })
  spend_level: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  activity_score: string;

  @Column({ type: 'timestamp', nullable: true })
  last_active_at: Date | null;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
