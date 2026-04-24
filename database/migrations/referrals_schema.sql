CREATE SCHEMA IF NOT EXISTS ops;

CREATE TABLE IF NOT EXISTS ops.referral_codes (
  id BIGSERIAL PRIMARY KEY,
  referral_code VARCHAR(64) NOT NULL UNIQUE,
  global_user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_global_user_id ON ops.referral_codes(global_user_id);

CREATE TABLE IF NOT EXISTS ops.user_referrals (
  id BIGSERIAL PRIMARY KEY,
  inviter_global_user_id VARCHAR(64) NOT NULL,
  invitee_global_user_id VARCHAR(64) NOT NULL UNIQUE,
  source_bot VARCHAR(32) NOT NULL DEFAULT 'claw_bot',
  status VARCHAR(16) NOT NULL DEFAULT 'started',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rewarded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_inviter ON ops.user_referrals(inviter_global_user_id);

