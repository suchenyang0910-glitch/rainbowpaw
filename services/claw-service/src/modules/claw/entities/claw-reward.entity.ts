import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'claw', name: 'claw_rewards' })
export class ClawRewardEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  reward_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  play_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  pool_item_id: string;

  @Column({ type: 'varchar', length: 32 }) // 'product', 'points', 'service', 'empty'
  reward_type: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reference_id: string | null;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  recycle_value: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  order_id: string | null; // If they checked out to an order

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
