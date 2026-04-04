import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function ClawRecyclesPage() {
  const { tableProps } = useTable({ resource: 'clawRecycles' })

  return (
    <List title="回收记录">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="订单ID" width={220} />
        <Table.Column dataIndex="global_user_id" title="用户" width={220} />
        <Table.Column dataIndex="play_id" title="play_id" width={220} />
        <Table.Column dataIndex="origin_amount" title="原始消耗" width={120} />
        <Table.Column dataIndex="amount" title="回收金额" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => <Tag>{String(v || '-')}</Tag>}
        />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>
    </List>
  )
}

