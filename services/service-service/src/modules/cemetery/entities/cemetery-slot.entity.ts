import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'service', name: 'cemetery_slots' })
export class CemeterySlotEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  slot_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  zone_id: string;

  @Column({ type: 'varchar', length: 32 })
  slot_number: string; // e.g., A-01

  @Column({ type: 'varchar', length: 16, default: 'available' }) // available, reserved, occupied, maintenance
  status: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  current_occupant_user_id: string | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  memorial_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lease_start_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lease_end_date: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
