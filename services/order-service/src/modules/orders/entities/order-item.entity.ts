import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'orders', name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  order_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  product_id: string | null;

  @Column({ type: 'varchar', length: 128 })
  item_name: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unit_price: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_price: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
