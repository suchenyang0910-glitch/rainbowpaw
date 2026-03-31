# 官网三语（KH/中文/英文）页面设计说明（Desktop-first）

## 全局设计（适用于所有页面）

### Layout
- 桌面端优先：内容容器建议 `max-width: 1200px`，左右留白自适应。
- 布局方式：Header（固定高度）+ Main（分区块纵向堆叠）+ Footer；主内容区以 CSS Grid/Flex 混合实现。
- 响应式：
  - ≥1200px：三栏/双栏布局可用（如内容 + 侧栏）。
  - 768–1199px：收敛为双栏或单栏，导航保持横向。
  - <768px：导航折叠为汉堡菜单，语言切换保留可见入口。

### Meta Information（规则）
- `title`：`{页面标题} | {品牌名}`（按语言输出）。
- `description`：每语言独立维护，避免机器直译导致语义不通。
- Open Graph：
  - `og:title/og:description/og:url` 按语言输出。
  - `og:locale` 与 `og:locale:alternate` 输出三语关系。
- `link[rel=alternate][hreflang]`：必须包含 km/zh-CN/en 的互链。
- `link[rel=canonical]`：默认指向当前语言 URL。

### Global Styles（设计令牌建议）
- 颜色：
  - Background: `#FFFFFF`
  - Text primary: `#111827`
  - Text secondary: `#6B7280`
  - Primary brand: `#2563EB`
  - Border: `#E5E7EB`
- 字体：
  - 英文/中文：系统字体栈 + 站点品牌字体（如有）。
  - KH：必须指定支持高质量高棉文字形的字体（例如通过 CSS `font-family` 为 km 单独配置优先级），避免回退导致行高异常。
- 排版比例：
  - H1 40/48，H2 32/40，H3 24/32，Body 16/24，Small 14/20（可按品牌调节）。
- 交互：
  - Button Primary：默认品牌色，hover 加深 8–12%，disabled 降低透明度。
  - Link：默认品牌色，下划线 hover 出现或加深。

### 关键交互状态（全局）
- 语言切换：切换时保持当前页面语义不变（同 slug/同内容）；切换后 header 中当前语言高亮。
- 缺失文案：线上模式不暴露 key；开发/预发可显示可识别的占位提示（如“缺少 km 翻译”）。

---

## 页面 1：首页（多语言版）

### Page Structure
- 顶部：Header（Logo + 主导航 + 语言切换）
- 主体：Hero 区 + 核心卖点区块 + 内容入口区块（如关于/产品/新闻入口）
- 底部：Footer（版权/联系信息/社媒）

### Sections & Components
1. Header
   - Logo（点击回到当前语言首页 `/:locale`）。
   - 主导航：最多 5–7 项，文本来自 `common.nav.*`。
   - 语言切换控件（右侧）：
     - 形式：下拉选择或三段式 segmented control（推荐下拉，节省空间）。
     - 文案：显示语言本名（例如：ខ្មែរ / 中文 / English）。
     - 行为：
       - 点击切换后立刻跳转到目标语言 URL；
       - 写入语言偏好 Cookie；
       - 保持当前路径与锚点（如存在）。
2. Hero
   - H1 标题、简介、主 CTA（文案 key：`home.hero.*`）。
   - 支持三语长度差异：
     - 中文/英文通常更短，KH 可能更长；容器需允许 2–3 行折行。
3. 核心卖点区块
   - 卡片网格（Desktop: 3 列；Tablet: 2 列；Mobile: 1 列）。
   - 每卡：标题 + 1–2 行说明。
4. 内容入口区块
   - 入口按钮/卡片指向通用内容页（例如 `/:locale/about`）。
   - 入口名称与描述同样走 i18n key，确保一致。
5. Footer
   - 联系方式、版权、社媒链接文案统一放到 `common.footer.*`。

---

## 页面 2：通用内容页（多语言版）

### Page Structure
- 顶部 Header 同首页
- 主体：面包屑（可选）+ 页面标题 + 内容区块（可配置）
- 底部 Footer 同首页

### Sections & Components
1. 内容头部
   - H1（来自页面级内容，如 about 的标题）。
   - 可选：更新时间/作者（如你有新闻详情需求）。
2. 内容区块渲染器（核心）
   - 以“区块”为单位渲染：标题/段落/列表/图片/CTA。
   - 同一页面在三语下使用同一结构定义：
     - 结构（区块类型与顺序）尽量一致；
     - 文案 value 根据 locale 变化。
3. SEO 输出
   - 该页的 title/description/OG/hreflang/canonical 必须按 locale 输出。
4. 语言切换体验
   - 切换时保持当前内容页不变（例如 about 在三语间来回切换）。
   - 若某语言不存在该页面：
     - 线上：回退到默认语言版本并提示（轻提示，不打断阅读）；
     - 或返回对应语言首页（由产品策略决定，需在实现中固定一种）。

---

## 组件级文案维护建议（落到设计可执行）
- 所有可复用组件（Header/Footer/Button/表单提示）只读 `common` 命名空间。
- 页面专属文案只读 `home` 或 `pages` 命名空间。
- 设计稿标注：在每个文本节点旁标注 i18n key（例如 `home.hero.title`），避免开发自行命名导致混乱。
- 对 KH 字体与行高做专门验收：
  - 标题行高是否过挤/过松；
  - 标点与数字混排是否溢出；
  - 语言切换控件中 KH 文本是否被截断。