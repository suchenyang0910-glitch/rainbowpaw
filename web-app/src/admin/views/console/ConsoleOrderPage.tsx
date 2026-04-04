import { useMemo, useState } from 'react'
import { useCustom } from '@refinedev/core'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'

type OrderItem = {
  order_id: string
  type: string
  status: string
  flow: string
  amount: number
  currency: string
  user_id: string
  created_at?: string
  updated_at?: string
  metadata?: any
}

export function ConsoleOrderPage() {
  const [query, setQuery] = useState({
    user_id: '',
    type: '',
    status: '',
    from: '',
    to: '',
    page: 1,
    pageSize: 20,
  })
  const [drawer, setDrawer] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' })

  const params = useMemo(
    () => ({
      user_id: query.user_id || undefined,
      type: query.type || undefined,
      status: query.status || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
      page: query.page,
      pageSize: query.pageSize,
    }),
    [query],
  )

  const { result, query: listQuery } = useCustom({
    url: '/console/orders',
    method: 'get',
    query: params,
  } as any)

  const payload = (result as any)?.data || { items: [], total: 0, page: query.page, pageSize: query.pageSize }
  const items: OrderItem[] = Array.isArray(payload.items) ? payload.items : []

  const { result: detailResult, query: detailQuery } = useCustom({
    url: drawer.orderId ? `/console/orders/${encodeURIComponent(drawer.orderId)}` : '/console/orders/_',
    method: 'get',
    queryOptions: { enabled: Boolean(drawer.orderId) },
  } as any)

  const detail: OrderItem | null = (detailResult as any)?.data || null

  const statusTag = (v: string) => {
    const s = String(v || '').toLowerCase()
    const color =
      s === 'paid' || s === 'completed' || s === 'posted'
        ? 'green'
        : s === 'created' || s === 'pending'
          ? 'gold'
          : s === 'failed' || s === 'canceled' || s === 'cancelled'
            ? 'red'
            : 'default'
    return <Tag color={color}>{String(v)}</Tag>
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title="订单（统一）">
        <Form
          layout="inline"
          onFinish={(v) => {
            const range = Array.isArray(v.range) ? v.range : []
            const from = range[0] ? String(range[0].toISOString()) : ''
            const to = range[1] ? String(range[1].toISOString()) : ''
            setQuery((q) => ({
              ...q,
              page: 1,
              user_id: String(v.user_id || ''),
              type: String(v.type || ''),
              status: String(v.status || ''),
              from,
              to,
            }))
          }}
        >
          <Form.Item name="user_id" label="用户ID">
            <Input placeholder="global_user_id / phone" allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="type" label="订单类型">
            <Select
              allowClear
              style={{ width: 160 }}
              options={[
                { value: 'claw', label: 'claw' },
                { value: 'product', label: 'product' },
                { value: 'service', label: 'service' },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Input placeholder="created/paid/posted/failed..." allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="range" label="时间">
            <DatePicker.RangePicker showTime style={{ width: 320 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Table<OrderItem>
        loading={listQuery.isFetching}
        dataSource={items}
        rowKey="order_id"
        size="middle"
        pagination={{
          current: Number(payload.page || query.page),
          pageSize: Number(payload.pageSize || query.pageSize),
          total: Number(payload.total || 0),
          onChange: (page, pageSize) => setQuery((q) => ({ ...q, page, pageSize })),
        }}
      >
        <Table.Column<OrderItem>
          dataIndex="order_id"
          title="订单号"
          width={260}
          render={(v: string) => (
            <Typography.Link
              onClick={() => setDrawer({ open: true, orderId: String(v) })}
              style={{ fontFamily: 'monospace' }}
            >
              {String(v)}
            </Typography.Link>
          )}
        />
        <Table.Column<OrderItem> dataIndex="type" title="类型" width={100} />
        <Table.Column<OrderItem>
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => statusTag(v)}
        />
        <Table.Column<OrderItem> dataIndex="flow" title="方向" width={90} />
        <Table.Column<OrderItem>
          dataIndex="amount"
          title="金额"
          width={140}
          render={(v: number, r: OrderItem) => (
            <span>
              {Number(v || 0).toFixed(2)} {String(r.currency || '')}
            </span>
          )}
        />
        <Table.Column<OrderItem>
          dataIndex="user_id"
          title="用户"
          width={220}
          render={(v: string) => <span style={{ fontFamily: 'monospace' }}>{String(v)}</span>}
        />
        <Table.Column<OrderItem> dataIndex="created_at" title="创建时间" width={210} />
        <Table.Column<OrderItem>
          title="操作"
          width={90}
          render={(_, r) => (
            <Button size="small" onClick={() => setDrawer({ open: true, orderId: r.order_id })}>
              详情
            </Button>
          )}
        />
      </Table>

      <Drawer
        title="订单详情"
        open={drawer.open}
        width={720}
        onClose={() => setDrawer({ open: false, orderId: '' })}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" loading={detailQuery.isFetching}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="订单号">
                <span style={{ fontFamily: 'monospace' }}>{detail?.order_id || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="类型">{detail?.type || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{detail ? statusTag(detail.status) : '-'}</Descriptions.Item>
              <Descriptions.Item label="方向">{detail?.flow || '-'}</Descriptions.Item>
              <Descriptions.Item label="金额">
                {detail ? `${Number(detail.amount || 0).toFixed(2)} ${detail.currency}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户">{detail?.user_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail?.created_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detail?.updated_at || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="metadata / raw" loading={detailQuery.isFetching}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(detail?.metadata || null, null, 2)}
            </pre>
          </Card>
        </Space>
      </Drawer>
    </Space>
  )
}
