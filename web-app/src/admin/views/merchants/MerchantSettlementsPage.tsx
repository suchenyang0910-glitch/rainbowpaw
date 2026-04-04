import { List, useTable } from '@refinedev/antd'
import { Table } from 'antd'

export function MerchantSettlementsPage() {
  const { tableProps } = useTable({ resource: 'merchantSettlements' })

  return (
    <List title="商家收益">
      <Table {...tableProps} rowKey={(r: any) => String(r.id || Math.random())} size="middle">
        <Table.Column dataIndex="id" title="ID" width={120} />
        <Table.Column dataIndex="merchant_id" title="商家" width={160} />
        <Table.Column dataIndex="amount" title="金额" width={120} />
        <Table.Column dataIndex="currency" title="币种" width={100} />
        <Table.Column dataIndex="status" title="状态" width={120} />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>
    </List>
  )
}

