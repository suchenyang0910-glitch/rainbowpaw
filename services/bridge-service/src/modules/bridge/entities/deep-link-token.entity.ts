import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'bridge', name: 'deep_link_tokens' })
export class DeepLinkTokenEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 128, unique: true })
  token: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 32 })
  from_bot: string;

  @Column({ type: 'varchar', length: 32 })
  to_bot: string;

  @Column({ type: 'varchar', length: 32 })
  scene: string;

  @Column({ type: 'jsonb', nullable: true })
  extra_data: Record<string, any> | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

