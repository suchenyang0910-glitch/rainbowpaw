import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function ReactivationPage() {
  const { tableProps } = useTable({ resource: 'reactivation' })

  return (
    <List title="用户激活">
      <Table {...tableProps} rowKey="global_user_id" size="middle">
        <Table.Column dataIndex="global_user_id" title="用户" width={240} />
        <Table.Column dataIndex="telegram_id" title="Telegram" width={140} />
        <Table.Column dataIndex="username" title="用户名" width={160} />
        <Table.Column dataIndex="pet_type" title="宠物" width={120} />
        <Table.Column
          dataIndex="spend_level"
          title="消费等级"
          width={120}
          render={(v: string) => <Tag>{String(v || '-')}</Tag>}
        />
        <Table.Column dataIndex="spend_total" title="累计消费" width={120} />
        <Table.Column dataIndex="last_active_at" title="最近活跃" width={210} />
        <Table.Column dataIndex="created_at" title="注册时间" width={210} />
      </Table>
    </List>
  )
}

