import { PageContainer } from '@ant-design/pro-components'
import { Card, Col, Row, Statistic, Alert } from 'antd'
import { useCustom } from '@refinedev/core'

type DashboardSummary = {
  revenue_usd?: number
  reward_cost_usd?: number
  profit_rate?: number
  new_users?: number
  plays?: number
  orders?: number
}

export function DashboardPage() {
  const { query, result } = useCustom<DashboardSummary>({
    url: '/dashboard/summary',
    method: 'get',
    queryOptions: { retry: false },
  })

  const summary = result.data || {}

  return (
    <PageContainer title="仪表盘">
      {query.error ? (
        <Alert
          type="warning"
          showIcon
          message="报表服务未接入或接口不可用"
          description={String((query.error as any)?.message || '')}
        />
      ) : null}
      <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="今日收入" value={summary.revenue_usd ?? 0} prefix="$" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="今日奖励成本" value={summary.reward_cost_usd ?? 0} prefix="$" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="利润率" value={(summary.profit_rate ?? 0) * 100} suffix="%" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="新增用户" value={summary.new_users ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="抽奖次数" value={summary.plays ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={query.isPending}>
            <Statistic title="订单数" value={summary.orders ?? 0} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
