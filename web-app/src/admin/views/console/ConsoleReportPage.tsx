import { useMemo, useState } from 'react'
import { useCustom } from '@refinedev/core'
import { Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'

type DailyReport = {
  date: string
  revenue?: { points?: number; usd?: number }
  cost?: { points?: number; usd?: number }
  profit?: { usd?: number }
  claw_plays?: number
  funnel?: {
    clicks?: number
    landings?: number
    leads?: number
    conversions?: number
    conversion_rate?: number
  }
  anomalies?: Array<{ type: string; count?: number; clicks?: number }>
}

export function ConsoleReportPage() {
  const [date, setDate] = useState<string>('')
  const [days, setDays] = useState<number>(7)

  const dailyQuery = useMemo(() => ({ date: date || undefined }), [date])
  const profitQuery = useMemo(() => ({ days }), [days])

  const { result: dailyRes, query: dailyReq } = useCustom({
    url: '/reports/daily',
    method: 'get',
    query: dailyQuery,
  } as any)

  const { result: profitRes, query: profitReq } = useCustom({
    url: '/reports/profit',
    method: 'get',
    query: profitQuery,
  } as any)

  const daily: DailyReport | null = (dailyRes as any)?.data || null
  const profitPayload = (profitRes as any)?.data || { items: [] }
  const profitItems: DailyReport[] = Array.isArray(profitPayload.items) ? profitPayload.items : []

  const money = (n: any) => {
    const x = Number(n || 0)
    return Number.isFinite(x) ? x.toFixed(2) : '0.00'
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card
        title="经营报表"
        extra={<Button onClick={() => void Promise.all([dailyReq.refetch(), profitReq.refetch()])}>刷新</Button>}
      >
        <Space wrap>
          <span>日期</span>
          <DatePicker
            onChange={(v) => setDate(v ? v.format('YYYY-MM-DD') : '')}
            placeholder="默认今天"
          />
          <span>近 N 天</span>
          <Select
            value={days}
            style={{ width: 120 }}
            onChange={(v) => setDays(Number(v || 7))}
            options={[
              { value: 3, label: '3天' },
              { value: 7, label: '7天' },
              { value: 14, label: '14天' },
              { value: 30, label: '30天' },
            ]}
          />
          <Button onClick={() => void dailyReq.refetch()} loading={dailyReq.isFetching}>
            更新日报
          </Button>
          <Button onClick={() => void profitReq.refetch()} loading={profitReq.isFetching}>
            更新趋势
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card loading={dailyReq.isFetching}>
            <Statistic title="收入（USD）" value={Number(daily?.revenue?.usd || 0)} precision={2} />
            <Typography.Text type="secondary">积分：{money(daily?.revenue?.points)}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={dailyReq.isFetching}>
            <Statistic title="成本（USD）" value={Number(daily?.cost?.usd || 0)} precision={2} />
            <Typography.Text type="secondary">积分：{money(daily?.cost?.points)}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={dailyReq.isFetching}>
            <Statistic title="利润（USD）" value={Number(daily?.profit?.usd || 0)} precision={2} />
            <Typography.Text type="secondary">日期：{daily?.date || '—'}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={dailyReq.isFetching}>
            <Statistic title="抽奖次数" value={Number(daily?.claw_plays || 0)} />
            <Typography.Text type="secondary">
              转化率：{Number(daily?.funnel?.conversion_rate || 0).toFixed(4)}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="漏斗" loading={dailyReq.isFetching}>
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { k: 'clicks', v: Number(daily?.funnel?.clicks || 0) },
                { k: 'landings', v: Number(daily?.funnel?.landings || 0) },
                { k: 'leads', v: Number(daily?.funnel?.leads || 0) },
                { k: 'conversions', v: Number(daily?.funnel?.conversions || 0) },
              ]}
              rowKey="k"
              columns={[
                { title: '指标', dataIndex: 'k', width: 140 },
                { title: '数值', dataIndex: 'v' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="异常" loading={dailyReq.isFetching}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(Array.isArray(daily?.anomalies) ? daily?.anomalies : []).length ? (
                (daily?.anomalies || []).map((a, idx) => (
                  <div key={`${a.type}_${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Tag color="red">{a.type}</Tag>
                    <span style={{ fontFamily: 'monospace' }}>{String(a.count ?? a.clicks ?? '-') }</span>
                  </div>
                ))
              ) : (
                <Typography.Text type="secondary">暂无异常</Typography.Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="利润趋势" loading={profitReq.isFetching}>
        <Table<DailyReport>
          size="middle"
          rowKey={(r) => r.date}
          dataSource={profitItems}
          pagination={false}
        >
          <Table.Column<DailyReport> dataIndex="date" title="日期" width={130} />
          <Table.Column<DailyReport>
            title="收入(USD)"
            width={140}
            render={(_, r) => money(r.revenue?.usd)}
          />
          <Table.Column<DailyReport>
            title="成本(USD)"
            width={140}
            render={(_, r) => money(r.cost?.usd)}
          />
          <Table.Column<DailyReport>
            title="利润(USD)"
            width={140}
            render={(_, r) => money(r.profit?.usd)}
          />
          <Table.Column<DailyReport>
            title="抽奖"
            width={100}
            render={(_, r) => Number(r.claw_plays || 0)}
          />
          <Table.Column<DailyReport>
            title="转化率"
            width={120}
            render={(_, r) => Number(r.funnel?.conversion_rate || 0).toFixed(4)}
          />
        </Table>
      </Card>
    </Space>
  )
}
