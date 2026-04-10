import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'identity', name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  global_user_id: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  pet_type: string | null;

  @Column({ type: 'int', nullable: true })
  pet_age: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  pet_age_stage: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  pet_weight_kg: string | null;

  @Column({ type: 'boolean', default: false })
  elder_pet_flag: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  health_issues: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
