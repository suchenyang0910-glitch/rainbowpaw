import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function OrderListPage() {
  const { tableProps } = useTable({ resource: 'orders' })

  return (
    <List title="订单总列表">
      <Table {...tableProps} rowKey="order_id" size="middle">
        <Table.Column dataIndex="order_id" title="订单号" width={220} />
        <Table.Column dataIndex="phone" title="手机号" width={140} />
        <Table.Column dataIndex="order_type" title="类型" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => {
            const color = v === 'paid' ? 'green' : v === 'pending' ? 'gold' : v === 'processing' ? 'blue' : 'default'
            return <Tag color={color}>{String(v)}</Tag>
          }}
        />
        <Table.Column
          dataIndex="total_cents"
          title="金额"
          width={140}
          render={(c: number, r: any) => {
            const cents = Number(c || 0)
            const currency = String(r?.currency || 'USD')
            return (
              <span>
                {(cents / 100).toFixed(2)} {currency}
              </span>
            )
          }}
        />
        <Table.Column dataIndex="created_at" title="创建时间" width={210} />
      </Table>
    </List>
  )
}

