import { CanAccess, useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, Col, Modal, Row, Space, Statistic, Table, Tag, message } from 'antd'
import { useMemo } from 'react'

export function RiskPage() {
  const { result: summaryResult } = useCustom({ url: '/risk/summary', method: 'get' } as any)
  const { result: alertsResult, query: alertsQuery } = useCustom(
    { url: '/risk/alerts', method: 'get', query: { current: 1, pageSize: 50 } } as any,
  )
  const { mutateAsync, mutation } = useCustomMutation()

  const s = (summaryResult as any)?.data || {}
  const list = useMemo(() => (((alertsResult as any)?.data?.items as any[]) || []), [alertsResult])

  const toggle = async (globalUserId: string, next: 'freeze' | 'unfreeze') => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: next === 'freeze' ? '确认冻结该用户？' : '确认解冻该用户？',
        content: `用户：${globalUserId}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: `/users/${encodeURIComponent(globalUserId)}/${next}`, method: 'post', values: {} })
    message.success(next === 'freeze' ? '已冻结' : '已解冻')
    await alertsQuery.refetch()
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="高风险用户" value={Number(s.highRiskUsers || 0)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="大奖异常率" value={Number(s.bigPrizeRate || 0)} precision={4} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="异常提现" value={Number(s.abnormalWithdraws || 0)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="异常拼团" value={Number(s.abnormalGroups || 0)} />
          </Card>
        </Col>
      </Row>

      <Card title="风险警报">
        <Table dataSource={list} rowKey="id" size="middle" pagination={false}>
          <Table.Column dataIndex="id" title="ID" width={120} />
          <Table.Column dataIndex="type" title="类型" width={180} />
          <Table.Column
            dataIndex="level"
            title="级别"
            width={120}
            render={(v: string) => {
              const color = v === 'high' ? 'red' : v === 'medium' ? 'gold' : 'default'
              return <Tag color={color}>{String(v)}</Tag>
            }}
          />
          <Table.Column dataIndex="title" title="标题" width={220} />
          <Table.Column dataIndex="description" title="描述" />
          <Table.Column dataIndex="created_at" title="时间" width={210} />
          <Table.Column
            title="操作"
            width={220}
            render={(_, r: any) => {
              const globalUserId = String(r?.global_user_id || '').trim()
              const status = String(r?.user_status || '')
              if (!globalUserId) return null
              return (
                <Space>
                  <CanAccess resource="risk" action="freeze">
                    <Button
                      size="small"
                      danger
                      disabled={mutation.isPending || status !== 'active'}
                      onClick={() => toggle(globalUserId, 'freeze')}
                    >
                      冻结
                    </Button>
                  </CanAccess>
                  <CanAccess resource="risk" action="unfreeze">
                    <Button size="small" disabled={mutation.isPending || status === 'active'} onClick={() => toggle(globalUserId, 'unfreeze')}>
                      解冻
                    </Button>
                  </CanAccess>
                </Space>
              )
            }}
          />
        </Table>
      </Card>
    </div>
  )
}
