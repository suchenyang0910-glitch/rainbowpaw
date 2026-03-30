# AI 中枢（/admin/ai/*）页面设计说明（桌面优先）

## 全局设计规范（适用于所有页面）
### Layout
- 框架：顶部导航（Top Nav）+ 左侧二级导航（Side Nav）+ 主内容区（Content）。
- 布局：CSS Grid 为主（`grid-template-columns: 240px 1fr`），卡片区域用 Flex/Grid 混合。
- 间距：8px 基准（8/16/24/32）；内容最大宽度 1200px，超出居中。
- 响应式：
  - Desktop ≥ 1024：侧边栏常驻；表格完整列。
  - Tablet 768–1023：侧边栏可折叠；表格可横向滚动。
  - Mobile < 768：本产品非主要目标，仅保证可浏览（侧边栏抽屉）。

### Meta Information
- 默认 Title：`AI 中枢 - 管理后台`
- 默认 Description：`配置与发布 NVIDIA build 优先的 AI 能力，并纳入 OpenClaw 闭环管理。`
- Open Graph：
  - `og:title` 同 Title
  - `og:description` 同 Description
  - `og:type=website`

### Global Styles
- 背景：`#0B1220`（深色底）/ 内容卡片：`#111B2E`
- 主色（Primary）：`#4F8CFF`；危险（Danger）：`#FF4D4F`；成功（Success）：`#2ECC71`
- 字体：系统字体栈；标题 20/16/14；正文 14；辅助 12
- 按钮：
  - Primary：蓝底白字；hover 加深 8%；disabled 40% 透明
  - Secondary：描边；hover 背景半透明
- 链接：同主色；hover 下划线
- 表格：表头固定；行 hover 高亮；状态用 Badge（active/disabled/failed 等）

### 通用交互与状态
- 所有“发布/回滚/密钥更新”操作必须二次确认（Confirm Modal）并显示影响范围。
- 异步请求统一使用 Toast：成功/失败；失败必须展示可复制错误码与 request_id（若有）。
- 页面顶部保留“当前环境（dev/staging/prod）”选择器（若与 OpenClaw 强绑定，则在 OpenClaw 页内也显示）。

### 权限与职责（前端展示规则）
- 菜单：由 `menu.ai` 控制是否显示 AI 中枢入口。
- 页面：
  - `/admin/ai/ops` 需要 `page.aiOps.list`
  - `/admin/ai/growth` 需要 `page.aiGrowth.list`
  - `/admin/ai/risk` 需要 `page.aiRisk.list`
- 按钮：
  - 生成建议：`button.aiOps.generate`
  - 发布建议：`button.aiOps.publish`
  - 执行冒烟：`button.aiOps.runSmoke`
  - 生成风控摘要：`button.aiRisk.summarize`

---

## 1) 登录页（/login）
### Layout
- 居中单列布局：`max-width: 420px` 卡片。
- 背景使用全屏渐变或品牌插画（可选），但不影响可读性。

### Page Structure
1. 顶部：产品名 `AI 中枢` + 副标题（简短说明）。
2. 登录卡片：邮箱、密码、登录按钮。
3. 底部：帮助信息（联系管理员、忘记密码说明）。

### Sections & Components
- 表单
  - Input：Email（自动聚焦）、Password（支持显示/隐藏）
  - 校验：必填、邮箱格式；错误提示在字段下方
- CTA
  - 登录按钮：loading 状态；失败提示（不泄露敏感信息）
- 安全
  - 重试限制提示：连续失败后显示“请稍后再试”

---

## 2) AI 中枢总览页（/admin/ai）
### Layout
- 主区域：上方 KPI 卡片 3–4 个（Grid 四列），下方两列布局（左：最近变更；右：快捷操作/告警）。

### Page Structure
1. 顶部标题区：页面标题 + 当前登录用户/角色 + 环境指示。
2. 健康总览：
   - NVIDIA build 推理可用性
   - OpenClaw 控制面可用性
   - 最近冒烟测试（结果/耗时/时间）
3. 快捷操作：三到四个按钮卡片。
4. 最近变更（审计摘要）：列表/时间线。

### Sections & Components
- HealthCard
  - 状态 Badge（OK/Warn/Down）
  - 关键指标（最近一次响应时间/错误率，若无则隐藏）
  - “查看详情”跳转到对应页面
- QuickActions
  - “更新密钥”“连接测试”“发布到 OpenClaw”“执行冒烟测试”
- AuditSummary
  - 列：时间、操作者、动作、对象、结果
  - 点击行进入详情抽屉（仅展示摘要与差异文本）

---

## 3) 模型与路由配置页（/admin/ai/models）
### Layout
- 采用 Tab + 表格：上方 Tabs（提供方/模型清单/路由策略/连接测试）。
- 主体为 DataTable（支持筛选、排序）。

### Page Structure
- Tabs
  1. 提供方
  2. 模型清单
  3. 路由策略（优先 NVIDIA build）
  4. 连接测试

### Sections & Components
#### 3.1 提供方 Tab
- ProviderTable
  - 行包含：name、type（默认 nvidia_build）、is_preferred、status、updated_at
  - 操作：编辑（除 type 外）、启用/禁用
- SecretPanel（侧边抽屉）
  - 仅对“超级管理员/AI 运维”可见
  - 字段：secret_name、secret_ref（引用值）、轮换时间
  - 不展示明文；提供“复制引用”“更新引用”

#### 3.2 模型清单 Tab
- ModelTable
  - 列：display_name、model_key、capability_tags、context_length、status
  - 操作：启用/禁用

#### 3.3 路由策略 Tab
- RoutePolicyEditor（表单 + 可视化列表）
  - 首选开关：默认开启“prefer_nvidia_build”且不可删除 NVIDIA 作为 priority=1（可调整备选）
  - 字段：timeout_ms、retry_count、circuit_breaker_error_rate
  - RouteTargets：按 priority 列表（拖拽排序可选；最小实现为上下移动）
  - 保存前校验：至少 1 个启用目标；priority 唯一

#### 3.4 连接测试 Tab
- ConnectionTestRunner
  - 选择：provider + model + route_policy（可选其一）
  - 输入：最小 prompt（默认值提供）
  - 输出：响应预览、耗时、错误码、request_id（可复制）

---

## 4) OpenClaw 部署与任务页（/admin/ai/openclaw）
### Layout
- 左侧为环境选择与概要，右侧为“发布/任务/日志/冒烟测试”四块可切换区域（Tabs）。

### Page Structure
1. 顶部：OpenClaw 环境选择器（dev/staging/prod）+ 连接状态。
2. Tabs：
   - 环境
   - 发布与回滚
   - 任务
   - 日志与观测
   - 冒烟测试

### Sections & Components
#### 4.1 环境 Tab
- EnvConfigCard
  - 展示 base_url、auth_type、status
  - 操作：连通性检查（即时显示结果）
  - 编辑：base_url、auth_ref（引用值）

#### 4.2 发布与回滚 Tab
- ReleaseTimeline
  - 列表：version、change_summary、status、created_at
  - 操作：发布当前配置、查看差异、回滚到该版本
- DiffDrawer
  - 展示本次发布与上次版本的差异摘要（文本/JSON）
- ConfirmModal（强制）
  - 展示影响环境、版本号、回滚风险提示

#### 4.3 任务 Tab
- JobLauncher
  - 选择任务模板（最小实现：下拉选择）
  - 参数表单（JSON textarea 最小实现）
  - 操作：启动/停止/重试
- JobRunTable
  - 列：job_type、status、external_run_id、created_at
  - 行操作：查看日志（跳转到“日志与观测”并带过滤条件）

#### 4.4 日志与观测 Tab
- LogFilterBar
  - 过滤：时间范围、status、job_id、release_version
- LogViewer
  - 行式日志（支持复制）
  - 错误高亮；关键字段（provider、model、latency）用 tag 标注

#### 4.5 冒烟测试 Tab
- SmokeTestPanel
  - 输入：选择用例集（默认标准集）、EXPECT_VERSION（自动带入当前发布）
  - 操作：执行冒烟测试
- SmokeTestResult
  - 展示：总体 PASS/FAIL、耗时、失败项列表（每项给出建议动作：重试/检查密钥/回滚）
  - “关联到发布版本”：自动写入并在发布页可见
