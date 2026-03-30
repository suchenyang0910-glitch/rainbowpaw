import { useMemo, useState } from 'react'
import { useCustom } from '@refinedev/core'
import { Button, Card, Form, Input, Select, Space, Table } from 'antd'

export function WalletLogsPage() {
  const [query, setQuery] = useState({
    globalUserId: '',
    bizType: '',
    assetType: '',
    refId: '',
    current: 1,
    pageSize: 20,
  })

  const params = useMemo(
    () => ({
      current: query.current,
      pageSize: query.pageSize,
      globalUserId: query.globalUserId || undefined,
      bizType: query.bizType || undefined,
      assetType: query.assetType || undefined,
      refId: query.refId || undefined,
    }),
    [query],
  )

  const { data, isLoading } = useCustom({
    url: '/wallet/logs',
    method: 'get',
    query: params,
  })

  const payload = (data as any)?.data || { items: [], total: 0, current: query.current, pageSize: query.pageSize }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card>
        <Form
          layout="inline"
          onFinish={(v) =>
            setQuery((q) => ({
              ...q,
              current: 1,
              globalUserId: String(v.globalUserId || ''),
              bizType: String(v.bizType || ''),
              assetType: String(v.assetType || ''),
              refId: String(v.refId || ''),
            }))
          }
        >
          <Form.Item name="globalUserId" label="用户ID">
            <Input placeholder="g_xxx" allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="bizType" label="业务类型">
            <Input placeholder="claw_play" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="assetType" label="资产">
            <Select
              allowClear
              style={{ width: 180 }}
              options={[
                { value: 'points_locked', label: 'points_locked' },
                { value: 'points_cashable', label: 'points_cashable' },
                { value: 'wallet_cash', label: 'wallet_cash' },
              ]}
            />
          </Form.Item>
          <Form.Item name="refId" label="Ref ID">
            <Input placeholder="ref_id" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Table
        loading={isLoading}
        dataSource={Array.isArray(payload.items) ? payload.items : []}
        rowKey="id"
        pagination={{
          current: Number(payload.current || query.current),
          pageSize: Number(payload.pageSize || query.pageSize),
          total: Number(payload.total || 0),
          onChange: (current, pageSize) => setQuery((q) => ({ ...q, current, pageSize })),
        }}
        size="middle"
      >
        <Table.Column dataIndex="id" title="ID" width={90} />
        <Table.Column dataIndex="global_user_id" title="用户" width={220} />
        <Table.Column dataIndex="biz_type" title="业务" width={140} />
        <Table.Column dataIndex="asset_type" title="资产" width={140} />
        <Table.Column dataIndex="change_direction" title="方向" width={90} />
        <Table.Column dataIndex="amount" title="金额" width={120} />
        <Table.Column dataIndex="balance_before" title="变更前" width={120} />
        <Table.Column dataIndex="balance_after" title="变更后" width={120} />
        <Table.Column dataIndex="ref_id" title="Ref" width={160} />
        <Table.Column dataIndex="created_at" title="时间" width={200} />
      </Table>
    </Space>
  )
}

