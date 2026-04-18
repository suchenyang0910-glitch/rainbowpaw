ALTER TABLE wallet.wallets
  ADD COLUMN IF NOT EXISTS wallet_usdt NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE wallet.wallet_logs
  ALTER COLUMN amount TYPE NUMERIC(18,6) USING amount::numeric,
  ALTER COLUMN balance_before TYPE NUMERIC(18,6) USING balance_before::numeric,
  ALTER COLUMN balance_after TYPE NUMERIC(18,6) USING balance_after::numeric;

