import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'wallet', name: 'withdraw_requests' })
export class WithdrawRequestEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  request_no: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  points_cashable_amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  cash_amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  fee_amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  actual_cash_amount: string;

  @Column({ type: 'varchar', length: 32 })
  method: string;

  @Column({ type: 'jsonb', nullable: true })
  account_info: Record<string, any> | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  payout_txid: string | null;

  @Column({ type: 'timestamp', nullable: true })
  payout_at: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
