import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'store', name: 'inventory_logs' })
export class InventoryLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  product_id: string;

  @Column({ type: 'int' })
  change_amount: number;

  @Column({ type: 'int' })
  balance_before: number;

  @Column({ type: 'int' })
  balance_after: number;

  @Column({ type: 'varchar', length: 32 })
  reason: string; // e.g., 'purchase', 'restock', 'refund'

  @Column({ type: 'varchar', length: 64, nullable: true })
  reference_id: string | null; // e.g., order_id

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
