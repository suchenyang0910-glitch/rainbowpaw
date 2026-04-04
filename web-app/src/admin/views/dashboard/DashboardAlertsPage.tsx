import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function DashboardAlertsPage() {
  const { tableProps } = useTable({ resource: 'dashboard/alerts' })

  return (
    <List title="实时警报">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={160} />
        <Table.Column dataIndex="type" title="类型" width={160} />
        <Table.Column
          dataIndex="level"
          title="级别"
          width={120}
          render={(v: string) => {
            const color = v === 'high' ? 'red' : v === 'medium' ? 'gold' : 'default'
            return <Tag color={color}>{String(v || '-')}</Tag>
          }}
        />
        <Table.Column dataIndex="title" title="标题" width={240} />
        <Table.Column dataIndex="description" title="描述" />
        <Table.Column dataIndex="global_user_id" title="用户" width={220} />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>
    </List>
  )
}

