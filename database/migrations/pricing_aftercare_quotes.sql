CREATE TABLE IF NOT EXISTS pricing.aftercare_quotes (
  id BIGSERIAL PRIMARY KEY,
  lead_id VARCHAR(32),
  country VARCHAR(8) NOT NULL,
  city VARCHAR(64) NOT NULL,
  package_code VARCHAR(32) NOT NULL,
  weight_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'USD',
  base_price_cents INT NOT NULL DEFAULT 0,
  pickup_fee_cents INT NOT NULL DEFAULT 0,
  weight_fee_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  note TEXT,
  public_token VARCHAR(48) UNIQUE,
  sent_at TIMESTAMP,
  decided_at TIMESTAMP,
  decision_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aftercare_quotes_lead_id ON pricing.aftercare_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_aftercare_quotes_status ON pricing.aftercare_quotes(status);

