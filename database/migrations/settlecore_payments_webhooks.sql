CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.settlecore_partner_orders (
  id BIGSERIAL PRIMARY KEY,
  display_id VARCHAR(64) NOT NULL UNIQUE,
  product_code VARCHAR(32) NOT NULL,
  bundle INT,
  global_user_id VARCHAR(64),
  telegram_id BIGINT,
  partner_order_id VARCHAR(128) NOT NULL UNIQUE,
  payment_order_id BIGINT,
  expected_webhook_idem_key VARCHAR(128),
  amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'USDT',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  raw_create_response JSONB,
  raw_settled_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settlecore_partner_orders_global_user_id
  ON payments.settlecore_partner_orders(global_user_id);
CREATE INDEX IF NOT EXISTS idx_settlecore_partner_orders_payment_order_id
  ON payments.settlecore_partner_orders(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_settlecore_partner_orders_partner_order_id
  ON payments.settlecore_partner_orders(partner_order_id);

CREATE TABLE IF NOT EXISTS payments.settlecore_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  partner_code VARCHAR(64),
  signature VARCHAR(256),
  raw_body TEXT,
  verified_at TIMESTAMP,
  processed_at TIMESTAMP,
  status VARCHAR(16) NOT NULL DEFAULT 'received',
  error TEXT,
  ack_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  ack_attempts INT NOT NULL DEFAULT 0,
  ack_last_error TEXT,
  ack_next_retry_at TIMESTAMP,
  acked_at TIMESTAMP,
  tx_hash VARCHAR(128),
  payment_order_id BIGINT,
  partner_order_id VARCHAR(128),
  telegram_id BIGINT,
  global_user_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlecore_webhook_event
  ON payments.settlecore_webhook_events(event_type, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_settlecore_webhook_events_status
  ON payments.settlecore_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_settlecore_webhook_events_ack_next_retry_at
  ON payments.settlecore_webhook_events(ack_next_retry_at);

