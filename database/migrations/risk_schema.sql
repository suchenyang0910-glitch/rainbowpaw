CREATE SCHEMA IF NOT EXISTS risk;

CREATE TABLE IF NOT EXISTS risk.risk_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_id VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(255),
  category VARCHAR(32) NOT NULL,
  condition JSONB NOT NULL,
  score_weight INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk.risk_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_id VARCHAR(64) NOT NULL UNIQUE,
  global_user_id VARCHAR(64) NOT NULL,
  rule_id VARCHAR(64) NOT NULL,
  risk_score INT NOT NULL,
  reason VARCHAR(128) NOT NULL,
  context_data JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_alerts_global_user_id ON risk.risk_alerts(global_user_id);

CREATE TABLE IF NOT EXISTS risk.frozen_users (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL UNIQUE,
  reason VARCHAR(128) NOT NULL,
  related_alert_id VARCHAR(64),
  frozen_by VARCHAR(64),
  frozen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  unfrozen_reason VARCHAR(128),
  unfrozen_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk.risk_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL,
  activity_type VARCHAR(64) NOT NULL,
  ip VARCHAR(64),
  device_id VARCHAR(128),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_activity_logs_type_time ON risk.risk_activity_logs(activity_type, created_at);
CREATE INDEX IF NOT EXISTS idx_risk_activity_logs_ip_time ON risk.risk_activity_logs(ip, created_at);
CREATE INDEX IF NOT EXISTS idx_risk_activity_logs_device_time ON risk.risk_activity_logs(device_id, created_at);

INSERT INTO risk.risk_rules (rule_id, name, description, category, condition, score_weight, is_active)
VALUES
  (
    'ip_distinct_users_24h',
    '同 IP 多账号',
    '24 小时内同一 IP 出现过多不同用户',
    'claw_play',
    '{"type":"ip_distinct_users","window_minutes":1440,"distinct_users":5}',
    30,
    TRUE
  ),
  (
    'device_distinct_users_24h',
    '同设备多账号',
    '24 小时内同一设备出现过多不同用户',
    'claw_play',
    '{"type":"device_distinct_users","window_minutes":1440,"distinct_users":3}',
    30,
    TRUE
  ),
  (
    'claw_win_rate_1h',
    '异常中奖率',
    '1 小时内中奖率过高且达到最小局数',
    'claw_play',
    '{"type":"win_rate","window_minutes":60,"min_plays":10,"max_win_rate":0.8}',
    25,
    TRUE
  )
ON CONFLICT (rule_id) DO NOTHING;

