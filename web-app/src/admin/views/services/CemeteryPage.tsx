import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function CemeteryPage() {
  const { tableProps } = useTable({ resource: 'services' })

  return (
    <List title="墓位 / 年费服务管理">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={120} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="category" title="类目" width={160} />
        <Table.Column dataIndex="price_cents" title="价格" width={120} />
        <Table.Column dataIndex="currency" title="币种" width={100} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => <Tag>{String(v || '-')}</Tag>}
        />
      </Table>
    </List>
  )
}

