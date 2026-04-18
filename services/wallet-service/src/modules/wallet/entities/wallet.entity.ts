import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'wallet', name: 'wallets' })
export class WalletEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64, unique: true })
  global_user_id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  points_total: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  points_locked: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  points_cashable: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  wallet_cash: string;

  @Column({ type: 'numeric', precision: 18, scale: 6, default: 0 })
  wallet_usdt: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_earned: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_spent: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
