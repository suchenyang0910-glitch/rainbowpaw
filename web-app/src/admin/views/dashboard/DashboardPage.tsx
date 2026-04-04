import { PageContainer } from '@ant-design/pro-components'
import { Alert, Card, Col, Divider, Progress, Row, Space, Statistic, Table, Tag } from 'antd'
import { useCustom } from '@refinedev/core'
import { useMemo } from 'react'

type DashboardSummary = {
  date?: string
  revenue_usd?: number
  cost_usd?: number
  profit_usd?: number
  profit_rate?: number
  new_users?: number
  plays?: number
  orders?: number
  conversion_rate?: number
  withdraw_pending?: number
  wallet?: {
    points_locked?: number
    points_cashable?: number
    wallet_cash?: number
    total_earned?: number
    total_spent?: number
  } | null
  risk?: {
    highRiskUsers?: number
    bigPrizeRate?: number
    abnormalWithdraws?: number
    abnormalGroups?: number
  } | null
  anomalies?: Array<{ type: string; count?: number; clicks?: number }>
  funnel?: {
    clicks?: number
    landings?: number
    leads?: number
    conversions?: number
    conversion_rate?: number
  } | null
}

type ProfitSeries = {
  days?: number
  items?: Array<{ date: string; profit?: { usd?: number }; revenue?: { usd?: number }; cost?: { usd?: number } }>
}

type DashboardAlerts = {
  items?: Array<any>
}

export function DashboardPage() {
  const { query, result } = useCustom<DashboardSummary>({
    url: '/dashboard/summary',
    method: 'get',
    queryOptions: { retry: false },
  })

  const { result: profitResult } = useCustom<ProfitSeries>({
    url: '/reports/profit',
    method: 'get',
    query: { days: 7 },
    queryOptions: { retry: false },
  } as any)

  const { result: alertsResult } = useCustom<DashboardAlerts>({
    url: '/dashboard/alerts',
    method: 'get',
    query: { current: 1, pageSize: 10 },
    queryOptions: { retry: false },
  } as any)

  const summary = result.data || {}
  const wallet = summary.wallet || null
  const risk = summary.risk || null

  const anomalies = useMemo(() => (Array.isArray(summary.anomalies) ? summary.anomalies : []), [summary.anomalies])
  const alerts = useMemo(() => ((alertsResult as any)?.data?.items as any[]) || [], [alertsResult])

  const profitItems = useMemo(() => {
    const items = ((profitResult as any)?.data?.items as any[]) || []
    return items
      .slice()
      .reverse()
      .map((x) => ({
        date: String(x?.date || '-'),
        revenue_usd: Number(x?.revenue?.usd || 0),
        cost_usd: Number(x?.cost?.usd || 0),
        profit_usd: Number(x?.profit?.usd || 0),
      }))
  }, [profitResult])

  const funnel = summary.funnel || null
  const conversionRate = Number(funnel?.conversion_rate ?? summary.conversion_rate ?? 0)

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
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="今日收入" value={summary.revenue_usd ?? 0} prefix="$" precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="今日成本" value={summary.cost_usd ?? 0} prefix="$" precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="今日利润" value={summary.profit_usd ?? 0} prefix="$" precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="利润率" value={(summary.profit_rate ?? 0) * 100} suffix="%" precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="抽奖次数" value={summary.plays ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="订单数" value={summary.orders ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="新增用户" value={summary.new_users ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="待处理提现" value={summary.withdraw_pending ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={query.isPending}>
                <Statistic title="转化率" value={conversionRate * 100} suffix="%" precision={2} />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 16 }} loading={query.isPending} title="漏斗（今日）">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Statistic title="点击" value={Number(funnel?.clicks || 0)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title="落地" value={Number(funnel?.landings || 0)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title="线索" value={Number(funnel?.leads || 0)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title="转化" value={Number(funnel?.conversions || 0)} />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Progress percent={Math.round(conversionRate * 10000) / 100} status="active" />
          </Card>

          <Card style={{ marginTop: 16 }} title="近 7 天利润" loading={false}>
            <Table dataSource={profitItems} rowKey="date" size="middle" pagination={false}>
              <Table.Column dataIndex="date" title="日期" width={140} />
              <Table.Column dataIndex="revenue_usd" title="收入" width={140} render={(v: any) => `$${Number(v || 0).toFixed(2)}`} />
              <Table.Column dataIndex="cost_usd" title="成本" width={140} render={(v: any) => `$${Number(v || 0).toFixed(2)}`} />
              <Table.Column dataIndex="profit_usd" title="利润" width={140} render={(v: any) => `$${Number(v || 0).toFixed(2)}`} />
            </Table>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="钱包概览" loading={query.isPending}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Statistic title="可提现积分" value={Number(wallet?.points_cashable ?? 0)} />
              <Statistic title="冻结积分" value={Number(wallet?.points_locked ?? 0)} />
              <Statistic title="现金池（wallet_cash）" value={Number(wallet?.wallet_cash ?? 0)} prefix="$" precision={2} />
              <Divider style={{ margin: 0 }} />
              <Statistic title="累计赚取" value={Number(wallet?.total_earned ?? 0)} />
              <Statistic title="累计消耗" value={Number(wallet?.total_spent ?? 0)} />
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }} title="风控概览" loading={query.isPending}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="高风险用户" value={Number(risk?.highRiskUsers ?? 0)} />
              </Col>
              <Col span={12}>
                <Statistic title="异常提现" value={Number(risk?.abnormalWithdraws ?? 0)} />
              </Col>
              <Col span={12}>
                <Statistic title="大奖异常率" value={Number(risk?.bigPrizeRate ?? 0) * 100} suffix="%" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="异常拼团" value={Number(risk?.abnormalGroups ?? 0)} />
              </Col>
            </Row>
          </Card>

          <Card style={{ marginTop: 16 }} title="异常与告警" loading={query.isPending}>
            {anomalies.length ? (
              <Table
                dataSource={anomalies.map((a: any, i: number) => ({ key: i, ...a }))}
                pagination={false}
                size="small"
              >
                <Table.Column dataIndex="type" title="类型" width={180} />
                <Table.Column dataIndex="count" title="数量" width={90} />
                <Table.Column
                  dataIndex="clicks"
                  title="附加"
                  render={(v: any) => (v != null ? <Tag>{String(v)}</Tag> : '-')}
                />
              </Table>
            ) : (
              <Alert type="success" showIcon message="暂无异常" />
            )}
          </Card>

          <Card style={{ marginTop: 16 }} title="最新风险警报" loading={false}>
            <Table dataSource={alerts} rowKey="id" size="small" pagination={false}>
              <Table.Column dataIndex="type" title="类型" width={110} />
              <Table.Column
                dataIndex="level"
                title="级别"
                width={90}
                render={(v: string) => {
                  const color = v === 'high' ? 'red' : v === 'medium' ? 'gold' : 'default'
                  return <Tag color={color}>{String(v || '-')}</Tag>
                }}
              />
              <Table.Column dataIndex="title" title="标题" />
            </Table>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
      </Row>
    </PageContainer>
  )
}
