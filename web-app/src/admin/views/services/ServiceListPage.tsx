import { List, useTable } from '@refinedev/antd'
import { Table, Tag } from 'antd'

export function ServiceListPage() {
  const { tableProps } = useTable({ resource: 'services' })

  return (
    <List title="服务管理">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={200} />
        <Table.Column dataIndex="service_name" title="服务名" />
        <Table.Column dataIndex="category" title="分类" width={120} />
        <Table.Column dataIndex="city" title="城市" width={140} />
        <Table.Column
          dataIndex="price_cents"
          title="价格"
          width={120}
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
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => <Tag color={v === 'published' ? 'green' : 'default'}>{String(v)}</Tag>}
        />
      </Table>
    </List>
  )
}

