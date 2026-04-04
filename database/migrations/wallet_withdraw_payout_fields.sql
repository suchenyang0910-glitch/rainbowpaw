ALTER TABLE wallet.withdraw_requests
  ADD COLUMN IF NOT EXISTS payout_txid VARCHAR(64);

ALTER TABLE wallet.withdraw_requests
  ADD COLUMN IF NOT EXISTS payout_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON wallet.withdraw_requests(status);
