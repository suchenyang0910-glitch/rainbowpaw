CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS orders.orders (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  idempotency_key VARCHAR(128),
  type VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  flow VARCHAR(16) NOT NULL DEFAULT 'income',
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'points',
  user_id VARCHAR(64) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders.orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders.orders(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
  ON orders.orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';
