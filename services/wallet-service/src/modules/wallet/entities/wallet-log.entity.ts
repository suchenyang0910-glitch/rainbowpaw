import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'wallet', name: 'wallet_logs' })
export class WalletLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 32 })
  biz_type: string;

  @Column({ type: 'varchar', length: 32 })
  asset_type: string;

  @Column({ type: 'varchar', length: 16 })
  change_direction: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  balance_before: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  balance_after: string;

  @Index()
  @Column({ type: 'varchar', length: 32, nullable: true })
  ref_type: string | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  ref_id: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

