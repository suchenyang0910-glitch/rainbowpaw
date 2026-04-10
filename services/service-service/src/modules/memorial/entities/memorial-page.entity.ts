import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'service', name: 'memorial_pages' })
export class MemorialPageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  memorial_id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  global_user_id: string;

  @Column({ type: 'varchar', length: 128 })
  pet_name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  pet_type: string | null;

  @Column({ type: 'timestamp', nullable: true })
  born_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  passed_away_date: Date | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gallery: string[] | null;

  @Column({ type: 'int', default: 0 })
  candles_lit: number;

  @Column({ type: 'varchar', length: 16, default: 'active' }) // active, hidden
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
