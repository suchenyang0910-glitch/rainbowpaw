import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'identity', name: 'user_tags' })
export class UserTagEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 64 })
  tag_key: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  tag_value: string | null;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 1 })
  score: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

