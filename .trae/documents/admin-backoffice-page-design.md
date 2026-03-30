# 管理后台页面设计说明（Desktop-first）

## Global Styles
- Layout：整体采用“顶部栏 + 左侧菜单 + 右侧内容区”的后台经典布局；内容区使用 12 列栅格 + Card 分组。
- Design tokens：
  - 背景：#F5F7FA（页面），#FFFFFF（卡片）
  - 主色：#1677FF；危险：#FF4D4F；成功：#52C41A；警告：#FAAD14
  - 字体：14px 基准；标题 16/20/24；等宽用于 ID/Hash
  - 组件：表格密度默认 middle；按钮 hover 提升亮度 5%；危险操作必须二次确认弹窗
- 权限态：
  - 菜单：无 menu 权限则不展示
  - 页面：无 page 权限则路由守卫跳转“无权限”占位
  - 按钮：无 button 权限则按钮隐藏或 disabled（按产品策略统一）

## Meta Information（全局）
- title 模板：{当前页面名} - 管理后台
- description：内部运营管理系统
- OpenGraph：og:title 同 title；og:type=website

## 页面：登录页（/login）
- Page Structure：居中登录卡片 + 简要系统说明
- Sections & Components：
  - Logo/系统名
  - “使用统一账号登录”主按钮（跳转 identity SSO）
  - 错误提示区（登录失败、回调异常、会话过期）

## 页面：主框架壳（/）
- Layout：Flex（左侧固定宽 240px；右侧自适应）；内容区可滚动
- Sections & Components：
  - Topbar：当前用户信息、退出、环境标识、全局搜索（可选）
  - Sidebar：基于菜单树渲染；支持折叠；当前路由高亮
  - Content：面包屑 + 页面标题 + 右侧操作区（按钮）

## 页面：工作台（/dashboard）
- Page Structure：上方指标卡片（4~6 个）+ 下方两列（最近操作/告警与快捷入口）
- Components：
  - 指标卡：金额/单量/失败率/待审核数（来自聚合接口）
  - 快捷入口：仅渲染你有权限的页面入口
  - 最近操作：审计摘要列表，可跳到审计页过滤

## 页面：权限与菜单管理（/rbac/*）
- 通用结构：左侧 Tab（用户/角色/资源点）+ 右侧表格 + 抽屉表单
- 用户（/rbac/users）：用户表格（identity_user_id、姓名、状态、角色）+ “绑定角色”按钮
- 角色（/rbac/roles）：角色表格 + “分配权限”抽屉（菜单树/页面列表/按钮列表三级选择）
- 资源点（/rbac/resources）：资源点表格（type/code/name/route/parent/sort）+ 批量导入导出

## 页面：业务控制台（/console/*）
- 通用结构：筛选区（Form）+ 结果区（Table）+ 右侧详情抽屉（JSON/字段视图切换）
- Identity（/console/identity）：查询用户/会话；高危按钮（吊销/刷新）置于详情抽屉
- Wallet（/console/wallet）：流水/余额；写操作按钮（调账/冻结/解冻）必须：权限校验 + 二次确认 + 结果回执
- Bridge（/console/bridge）：桥接单状态时间线；“重试/补偿”按钮带原因输入框
- Report（/console/report）：报表条件选择；生成任务列表；“导出”显示进度与失败重试
- Risk（/console/risk）：待审列表（队列）+ 批量审批；“通过/拒绝”强制填写备注

## 页面：审计与系统设置（/audit、/settings）
- 审计（/audit）：时间范围 + 操作人 + action 搜索；表格支持导出；点击行看请求/响应摘要
- 设置（/settings）：配置项分组卡片（只对 SA 可见）；服务健康状态列表（identity/wallet/bridge/report/risk）
