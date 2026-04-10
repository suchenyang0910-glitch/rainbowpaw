import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'orders', name: 'order_status_logs' })
export class OrderStatusLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  order_id: string;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  status: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  remark: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
