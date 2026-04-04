import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function MerchantOrdersPage() {
  const { tableProps } = useTable({ resource: 'merchantOrders' })

  return (
    <List title="商家订单">
      <Table {...tableProps} rowKey="order_id" size="middle">
        <Table.Column dataIndex="order_id" title="订单号" width={220} />
        <Table.Column dataIndex="merchant_id" title="商家" width={160} />
        <Table.Column dataIndex="type" title="类型" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => <Tag>{String(v || '-')}</Tag>}
        />
        <Table.Column dataIndex="amount" title="金额" width={120} />
        <Table.Column dataIndex="currency" title="币种" width={100} />
        <Table.Column dataIndex="user_id" title="用户" width={220} />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>
    </List>
  )
}

