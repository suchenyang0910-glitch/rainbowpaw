import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Space, Table, Tag, message } from 'antd'

export function ReferralsPage() {
  const { tableProps, tableQuery } = useTable({ resource: 'referrals' })
  const { mutateAsync, mutation } = useCustomMutation()

  const activate = async (id: number, on: boolean) => {
    await mutateAsync({
      url: `/referrals/${encodeURIComponent(String(id))}/${on ? 'activate' : 'deactivate'}`,
      method: 'post',
      values: {},
    })
    message.success(on ? '已启用' : '已停用')
    await tableQuery.refetch()
  }

  return (
    <List title="分销列表">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={100} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="level_count" title="层级" width={100} />
        <Table.Column dataIndex="settle_cycle" title="结算周期" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => {
            const s = String(v || '')
            const color = s === 'active' ? 'green' : s === 'inactive' ? 'gold' : 'default'
            return <Tag color={color}>{s || '-'}</Tag>
          }}
        />
        <Table.Column dataIndex="updated_at" title="更新时间" width={210} />
        <Table.Column
          title="操作"
          width={200}
          render={(_, r: any) => {
            const st = String(r?.status || '')
            return (
              <Space>
                <CanAccess resource="referrals" action="activate">
                  <Button
                    size="small"
                    type="primary"
                    disabled={mutation.isPending || st === 'active'}
                    onClick={() => activate(Number(r.id), true)}
                  >
                    启用
                  </Button>
                </CanAccess>
                <CanAccess resource="referrals" action="deactivate">
                  <Button
                    size="small"
                    danger
                    disabled={mutation.isPending || st !== 'active'}
                    onClick={() => activate(Number(r.id), false)}
                  >
                    停用
                  </Button>
                </CanAccess>
              </Space>
            )
          }}
        />
      </Table>
    </List>
  )
}
