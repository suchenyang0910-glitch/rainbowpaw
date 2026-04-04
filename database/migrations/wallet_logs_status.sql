ALTER TABLE wallet.wallet_logs
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'posted';

UPDATE wallet.wallet_logs
  SET status = 'posted'
  WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_wallet_logs_status ON wallet.wallet_logs(status);
