import { useCustom } from '@refinedev/core'
import { Card, Col, Row, Statistic } from 'antd'

export function WalletOverviewPage() {
  const { result } = useCustom({ url: '/wallet/overview', method: 'get' } as any)
  const s = (result as any)?.data || {}

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="总 Locked 积分" value={Number(s.points_locked || 0)} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="总 Cashable 积分" value={Number(s.points_cashable || 0)} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="总可提现现金" value={Number(s.wallet_cash || 0)} precision={2} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="总收入" value={Number(s.total_earned || 0)} precision={2} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="总支出" value={Number(s.total_spent || 0)} precision={2} />
        </Card>
      </Col>
    </Row>
  )
}
