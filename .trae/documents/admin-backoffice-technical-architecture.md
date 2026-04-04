## 1.Architecture design
```mermaid
graph TD
  U["User Browser"] --> F["React Admin Frontend"]
  F --> B["BFF Backend API"]
  B --> ID["identity service"]
  B --> WA["wallet service"]
  B --> BR["bridge service"]
  B --> OR["order service"]
  B --> RE["report service"]
  B --> RI["risk service"]
  B --> DB["PostgreSQL (RBAC & Audit)"]

  subgraph "Frontend Layer"
    F
  end
  subgraph "Backend Layer"
    B
  end
  subgraph "Internal Services"
    ID
    WA
    BR
    OR
    RE
    RI
  end
  subgraph "Data Layer"
    DB
  end
```

## 2.Technology Description
- Frontend: React@18 + TypeScript + vite + Ant Design（后台组件库）
- Backend: Node.js + NestJS（BFF 聚合层）
- Database: PostgreSQL（存 RBAC/菜单/审计；不承载核心业务数据）

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| /login | identity SSO 登录与回跳 |
| / | 主框架（顶部栏+侧边栏+内容区），根据权限生成菜单 |
| /dashboard | 指标概览与快捷入口 |
| /rbac/users | 用户与角色绑定 |
| /rbac/roles | 角色维护与分配权限点 |
| /rbac/resources | 菜单/路由/按钮权限点维护 |
| /console/identity | identity 查询与必要操作 |
| /console/wallet | wallet 查询与资金类操作 |
| /console/bridge | bridge 单据查询与重试/补偿 |
| /console/order | 订单查询、订单详情展示（对齐报表筛选字段） |
| /console/report | 报表任务生成、状态查询、下载/导出（字段与 order 对齐） |
| /console/risk | 风控命中队列与审批 |
| /audit | 审计日志检索与导出 |
| /settings | 系统配置与服务健康 |

## 4.API definitions (If it includes backend services)
### 4.1 Shared TypeScript types
```ts
export type RoleKey = 'SA' | 'OPS' | 'FIN' | 'RISK' | 'VIEW'
export type ResourceType = 'menu' | 'page' | 'button'
export interface Resource {
  id: string
  type: ResourceType
  code: string // e.g. wallet.adjust
  name: string
  route?: string // for page
  parentCode?: string // for menu tree
}
export interface MeResponse {
  userId: string
  displayName: string
  roles: RoleKey[]
  resources: Array<Pick<Resource,'type'|'code'|'route'>>
}
export type ISODateTimeString = string

export interface OrderSummary {
  orderId: string
  bizTime: ISODateTimeString // 订单业务时间（用于报表口径）
  status: string
  amount: string // decimal as string
  currency: string
  customerId?: string
}

export interface OrderDetail extends OrderSummary {
  items?: Array<{ skuId: string; name: string; qty: number; unitPrice: string }>
  raw?: Record<string, unknown> // 详情抽屉 JSON 视图
}

export interface ReportTask {
  taskId: string
  reportType: string
  status: 'pending' | 'running' | 'success' | 'failed'
  params: {
    orderId?: string
    bizTimeFrom?: ISODateTimeString
    bizTimeTo?: ISODateTimeString
  }
  fileName?: string
  fileUrl?: string
  errorMessage?: string
  createdAt: ISODateTimeString
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  target?: string
  requestId: string
  success: boolean
  createdAt: string
}
```

### 4.2 Core API（BFF）
- 获取当前用户与权限（用于菜单/路由/按钮渲染）
  - GET /api/me
- RBAC 管理
  - GET /api/rbac/users
  - PATCH /api/rbac/users/:id/roles
  - CRUD /api/rbac/roles
  - CRUD /api/rbac/resources
- 业务聚合（对接六类服务；BFF 负责鉴权、签名/头部拼装、审计落库、错误码统一）
  - POST /api/console/wallet/adjust
  - POST /api/console/wallet/freeze
  - POST /api/console/bridge/retry
  - GET /api/console/orders
  - GET /api/console/orders/:orderId
  - POST /api/console/report/tasks
  - GET /api/console/report/tasks
  - GET /api/console/report/tasks/:taskId/download
  - POST /api/console/risk/decision

### 4.3 字段对齐（前端页面 vs 服务返回）

Order 页面（order-service）核心字段对齐：
| 前端字段（UI） | TypeScript 字段 | order-service 字段（建议） | 说明 |
|---|---|---|---|
| 订单号 | orderId | order_id | 全局唯一订单标识 |
| 业务时间 | bizTime | biz_time | 报表统计口径优先使用 |
| 状态 | status | status | 统一枚举字符串（由服务定义） |
| 金额 | amount | amount | decimal 建议以 string 传输避免精度问题 |
| 币种 | currency | currency | ISO 货币码 |

Report 页面（report-service）任务字段对齐：
| 前端字段（UI） | TypeScript 字段 | report-service 字段（建议） | 说明 |
|---|---|---|---|
| 任务ID | taskId | task_id | 用于查询/下载 |
| 报表类型 | reportType | report_type | 如 daily/settlement 等（由服务定义） |
| 任务状态 | status | status | pending/running/success/failed |
| 筛选参数 | params | params | 需支持 orderId、bizTimeFrom、bizTimeTo |
| 下载地址 | fileUrl | file_url | success 时返回；或由 download 接口返回 |
| 失败原因 | errorMessage | error_message | failed 时用于展示与排障 |

## 6.Data model(if applicable)
### 6.1 Data model definition
```mermaid
erDiagram
  ADMIN_USER ||--o{ USER_ROLE : has
  ROLE ||--o{ USER_ROLE : includes
  ROLE ||--o{ ROLE_RESOURCE : grants
  RESOURCE ||--o{ ROLE_RESOURCE : bound
  ADMIN_USER ||--o{ AUDIT_LOG : writes

  ADMIN_USER {
    uuid id
    string identity_user_id
    string display_name
    string status
    datetime created_at
  }
  ROLE {
    uuid id
    string key
    string name
    datetime created_at
  }
  RESOURCE {
    uuid id
    string type
    string code
    string name
    string route
    string parent_code
    int sort
  }
  USER_ROLE {
    uuid id
    uuid user_id
    uuid role_id
  }
  ROLE_RESOURCE {
    uuid id
    uuid role_id
    uuid resource_id
  }
  AUDIT_LOG {
    uuid id
    uuid user_id
    string action
    string target
    string request_id
    bool success
    datetime created_at
  }
```

### 6.2 Data Definition Language
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- menu/page/button
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  route TEXT,
  parent_code TEXT,
  sort INT DEFAULT 0
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL
);

CREATE TABLE role_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,
  resource_id UUID NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  request_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- minimal grants example
GRANT SELECT ON admin_users,roles,resources,user_roles,role_resources,audit_logs TO anon;
GRANT ALL PRIVILEGES ON admin_users,roles,resources,user_roles,role_resources,audit_logs TO authenticated;
```
