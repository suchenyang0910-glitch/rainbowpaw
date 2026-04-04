ALTER TABLE bridge.bridge_events
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bridge_events_idempotency_key
  ON bridge.bridge_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

