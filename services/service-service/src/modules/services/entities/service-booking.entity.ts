import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'service', name: 'service_bookings' })
export class ServiceBookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  booking_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  service_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  order_id: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string; // pending, confirmed, processing, completed, cancelled

  @Column({ type: 'timestamp', nullable: true })
  scheduled_time: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  contact_info: Record<string, any> | null; // phone, address, etc.

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
