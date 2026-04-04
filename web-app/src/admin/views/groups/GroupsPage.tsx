import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Space, Table, Tag, message } from 'antd'

export function GroupsPage() {
  const { tableProps, tableQueryResult } = useTable({ resource: 'groups' })
  const { mutateAsync, mutation } = useCustomMutation()

  const activate = async (id: number, on: boolean) => {
    await mutateAsync({
      url: `/groups/${encodeURIComponent(String(id))}/${on ? 'activate' : 'deactivate'}`,
      method: 'post',
      values: {},
    })
    message.success(on ? '已启用' : '已停用')
    await tableQueryResult.refetch()
  }

  return (
    <List title="拼团列表">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={100} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="activity_config_name" title="活动" width={180} />
        <Table.Column dataIndex="group_size" title="成团人数" width={120} />
        <Table.Column dataIndex="valid_minutes" title="有效期(min)" width={130} />
        <Table.Column dataIndex="stock" title="库存" width={100} />
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
                <CanAccess resource="groups" action="activate">
                  <Button
                    size="small"
                    type="primary"
                    disabled={mutation.isPending || st === 'active'}
                    onClick={() => activate(Number(r.id), true)}
                  >
                    启用
                  </Button>
                </CanAccess>
                <CanAccess resource="groups" action="deactivate">
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

