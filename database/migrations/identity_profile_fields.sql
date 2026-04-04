ALTER TABLE identity.global_users
  ADD COLUMN IF NOT EXISTS pet_age INT;

ALTER TABLE identity.global_users
  ADD COLUMN IF NOT EXISTS activity_score NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_global_users_pet_age ON identity.global_users(pet_age);
