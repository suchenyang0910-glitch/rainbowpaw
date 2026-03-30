import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function ClawPlaysPage() {
  const { tableProps } = useTable({ resource: 'clawPlays' })

  return (
    <List title="抽奖记录">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={120} />
        <Table.Column dataIndex="global_user_id" title="用户" width={220} />
        <Table.Column dataIndex="pool_id" title="奖池" width={160} />
        <Table.Column dataIndex="prize_level" title="档位" width={120} />
        <Table.Column dataIndex="prize_name" title="奖品" />
        <Table.Column dataIndex="consumed_points" title="消耗积分" width={120} />
        <Table.Column
          dataIndex="result_status"
          title="状态"
          width={120}
          render={(v: string) => <Tag>{String(v || '-') }</Tag>}
        />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>
    </List>
  )
}

