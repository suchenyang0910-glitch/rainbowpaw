import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'claw', name: 'claw_plays' })
export class ClawPlayEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  play_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  pool_id: string;

  @Column({ type: 'int' })
  cost_points: number;

  @Column({ type: 'varchar', length: 32, default: 'completed' }) // completed, recycled, ordered
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  idempotency_key: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
