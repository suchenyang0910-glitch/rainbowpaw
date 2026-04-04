import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'orders', name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  order_id: string;

  @Index({ unique: true, where: "idempotency_key IS NOT NULL AND idempotency_key <> ''" })
  @Column({ type: 'varchar', length: 128, nullable: true })
  idempotency_key: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  type: string;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  status: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'income' })
  flow: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 8, default: 'points' })
  currency: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  user_id: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

