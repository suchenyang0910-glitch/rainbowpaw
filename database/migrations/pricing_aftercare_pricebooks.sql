CREATE SCHEMA IF NOT EXISTS pricing;

CREATE TABLE IF NOT EXISTS pricing.aftercare_pricebooks (
  id BIGSERIAL PRIMARY KEY,
  country VARCHAR(8) NOT NULL,
  city VARCHAR(64) NOT NULL,
  package_code VARCHAR(32) NOT NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'USD',
  base_price_cents INT NOT NULL DEFAULT 0,
  pickup_fee_cents INT NOT NULL DEFAULT 0,
  weight_fee_rules JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country, city, package_code)
);

CREATE INDEX IF NOT EXISTS idx_aftercare_pricebooks_country_city ON pricing.aftercare_pricebooks(country, city);

