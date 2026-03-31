import { useCustom } from '@refinedev/core'
import { Card, Col, Row, Statistic } from 'antd'

export function BridgeReportsPage() {
  const { result } = useCustom({
    url: '/bridge/reports/summary',
    method: 'get',
  } as any)

  const payload = (result as any)?.data || { clicks: 0, conversions: 0 }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="点击" value={Number(payload.clicks || 0)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="转化" value={Number(payload.conversions || 0)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="转化率"
              value={payload.clicks ? Number(payload.conversions || 0) / Number(payload.clicks || 1) : 0}
              precision={4}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
