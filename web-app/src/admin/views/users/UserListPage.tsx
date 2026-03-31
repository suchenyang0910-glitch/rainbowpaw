import { PageContainer } from '@ant-design/pro-components'
import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Modal, Space, message } from 'antd'
import { Table, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'

type UserRow = {
  global_user_id: string
  telegram_id?: number
  username?: string
  pet_type?: string
  spend_total?: number
  spend_level?: string
  status?: string
  last_active_at?: string
}

export function UserListPage() {
  const navigate = useNavigate()
  const { tableProps, tableQuery } = useTable<UserRow>({
    resource: 'users',
  })
  const { mutateAsync, mutation } = useCustomMutation()

  const onToggleFreeze = async (row: UserRow, next: 'freeze' | 'unfreeze') => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: next === 'freeze' ? '确认冻结该用户？' : '确认解冻该用户？',
        content: `用户：${row.global_user_id}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: `/users/${encodeURIComponent(row.global_user_id)}/${next}`, method: 'post', values: {} })
    message.success(next === 'freeze' ? '已冻结' : '已解冻')
    await tableQuery.refetch()
  }

  return (
    <PageContainer title={false}>
      <List title="用户列表">
        <Table {...tableProps} rowKey="global_user_id">
          <Table.Column dataIndex="global_user_id" title="Global User ID" />
          <Table.Column dataIndex="telegram_id" title="Telegram ID" />
          <Table.Column dataIndex="pet_type" title="宠物类型" />
          <Table.Column dataIndex="spend_total" title="累计消费" />
          <Table.Column dataIndex="spend_level" title="消费等级" render={(value: any) => <Tag>{String(value || '-') }</Tag>} />
          <Table.Column
            dataIndex="status"
            title="状态"
            render={(value: any) => <Tag color={String(value) === 'active' ? 'green' : 'red'}>{String(value || '-') }</Tag>}
          />
          <Table.Column dataIndex="last_active_at" title="最近活跃" />
          <Table.Column
            title="操作"
            render={(_v: any, row: UserRow) => (
              <Space>
                <Button size="small" onClick={() => navigate(`/admin/users/${encodeURIComponent(row.global_user_id)}`)}>
                  详情
                </Button>
                <CanAccess resource="users" action="freeze">
                  <Button size="small" danger disabled={mutation.isPending || String(row.status) !== 'active'} onClick={() => onToggleFreeze(row, 'freeze')}>
                    冻结
                  </Button>
                </CanAccess>
                <CanAccess resource="users" action="unfreeze">
                  <Button size="small" disabled={mutation.isPending || String(row.status) === 'active'} onClick={() => onToggleFreeze(row, 'unfreeze')}>
                    解冻
                  </Button>
                </CanAccess>
              </Space>
            )}
          />
        </Table>
      </List>
    </PageContainer>
  )
}
