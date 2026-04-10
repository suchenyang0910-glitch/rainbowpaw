import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'risk', name: 'frozen_users' })
export class FrozenUserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  global_user_id: string;

  @Column({ type: 'varchar', length: 128 })
  reason: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  related_alert_id: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  frozen_by: string | null; // admin_id

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  frozen_at: Date;

  @Column({ type: 'varchar', length: 16, default: 'active' }) // active, lifted
  status: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  unfrozen_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  unfrozen_at: Date | null;
}
