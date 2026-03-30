-- ops/admin minimal operational modules: campaigns, groupbuy, distribution, rewards, blacklist

CREATE SCHEMA IF NOT EXISTS ops;

CREATE TABLE IF NOT EXISTS ops.activity_configs (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  scope_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_activity_configs_type_status ON ops.activity_configs(type, status);
CREATE INDEX IF NOT EXISTS idx_ops_activity_configs_time ON ops.activity_configs(start_at, end_at);

CREATE TABLE IF NOT EXISTS ops.groupbuy_campaigns (
  id BIGSERIAL PRIMARY KEY,
  activity_config_id BIGINT,
  name TEXT NOT NULL,
  group_size INT NOT NULL,
  valid_minutes INT NOT NULL,
  stock INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_groupbuy_campaigns_cfg ON ops.groupbuy_campaigns(activity_config_id);
CREATE INDEX IF NOT EXISTS idx_ops_groupbuy_campaigns_status ON ops.groupbuy_campaigns(status);

CREATE TABLE IF NOT EXISTS ops.distribution_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  level_count INT NOT NULL,
  commission_json JSONB NOT NULL,
  settle_cycle VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_distribution_rules_status ON ops.distribution_rules(status);

CREATE TABLE IF NOT EXISTS ops.distributors (
  id BIGSERIAL PRIMARY KEY,
  subject_type VARCHAR(16) NOT NULL,
  subject_id VARCHAR(128) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ops_distributors_subject ON ops.distributors(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_ops_distributors_status ON ops.distributors(status);

CREATE TABLE IF NOT EXISTS ops.reward_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  reward_type VARCHAR(16) NOT NULL,
  reward_value NUMERIC(12,2) NOT NULL,
  trigger_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  budget_cap NUMERIC(12,2),
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_reward_rules_status ON ops.reward_rules(status);

CREATE TABLE IF NOT EXISTS ops.reward_grants (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT,
  subject_type VARCHAR(16) NOT NULL,
  subject_id VARCHAR(128) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_reward_grants_rule_id ON ops.reward_grants(rule_id);
CREATE INDEX IF NOT EXISTS idx_ops_reward_grants_subject ON ops.reward_grants(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_ops_reward_grants_status ON ops.reward_grants(status);

CREATE TABLE IF NOT EXISTS ops.blacklist_entries (
  id BIGSERIAL PRIMARY KEY,
  subject_type VARCHAR(16) NOT NULL,
  subject_id VARCHAR(128) NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_blacklist_lookup ON ops.blacklist_entries(subject_type, subject_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_blacklist_status ON ops.blacklist_entries(status);

CREATE TABLE IF NOT EXISTS ops.admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor VARCHAR(128) NOT NULL,
  module VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64),
  target_id VARCHAR(64),
  reason TEXT,
  request_json JSONB,
  result_json JSONB,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_admin_audit_logs_created_at ON ops.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_admin_audit_logs_module_action ON ops.admin_audit_logs(module, action);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops.activity_configs WHERE name = '默认活动配置') THEN
    INSERT INTO ops.activity_configs(type, name, start_at, end_at, scope_json, status, version)
    VALUES ('other', '默认活动配置', now() - interval '1 day', now() + interval '30 day', '{}'::jsonb, 'active', 1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ops.distribution_rules WHERE name = '默认分销规则') THEN
    INSERT INTO ops.distribution_rules(name, level_count, commission_json, settle_cycle, status)
    VALUES ('默认分销规则', 2, '{"level1":0.05,"level2":0.02}'::jsonb, 'weekly', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ops.reward_rules WHERE name = '默认奖励策略') THEN
    INSERT INTO ops.reward_rules(name, reward_type, reward_value, trigger_json, budget_cap, status)
    VALUES ('默认奖励策略', 'cash', 1.00, '{}'::jsonb, NULL, 'active');
  END IF;
END $$;

