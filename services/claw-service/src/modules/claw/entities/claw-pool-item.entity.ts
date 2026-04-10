import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'claw', name: 'claw_pool_items' })
export class ClawPoolItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  item_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  pool_id: string;

  @Column({ type: 'varchar', length: 32 }) // 'product', 'points', 'service', 'empty'
  reward_type: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reference_id: string | null; // e.g., product_id or service_id

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  weight: number; // Probability weight

  @Column({ type: 'int', default: 100 })
  stock: number; // Remaining items in the pool

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  recycle_value: string | null; // How many points the user gets if they recycle it

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
