ALTER TABLE crm.followups
  ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_followups_dedupe_key
  ON crm.followups(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

