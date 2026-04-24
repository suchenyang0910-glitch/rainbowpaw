import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Space, Table, Tag, message } from 'antd'

export function CampaignsPage() {
  const { tableProps, tableQuery } = useTable({ resource: 'campaigns' })
  const { mutateAsync, mutation } = useCustomMutation()

  const setStatus = async (id: number, action: 'publish' | 'deactivate') => {
    await mutateAsync({
      url: `/campaigns/${encodeURIComponent(String(id))}/${action}`,
      method: 'post',
      values: {},
    })
    message.success(action === 'publish' ? '已发布' : '已停用')
    await tableQuery.refetch()
  }

  return (
    <List title="活动配置">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={100} />
        <Table.Column dataIndex="type" title="类型" width={140} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="start_at" title="开始" width={210} />
        <Table.Column dataIndex="end_at" title="结束" width={210} />
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
        <Table.Column
          title="操作"
          width={220}
          render={(_, r: any) => {
            const st = String(r?.status || '')
            return (
              <Space>
                <CanAccess resource="campaigns" action="publish">
                  <Button
                    size="small"
                    type="primary"
                    disabled={mutation.isPending || st === 'active'}
                    onClick={() => setStatus(Number(r.id), 'publish')}
                  >
                    发布
                  </Button>
                </CanAccess>
                <CanAccess resource="campaigns" action="deactivate">
                  <Button
                    size="small"
                    danger
                    disabled={mutation.isPending || st !== 'active'}
                    onClick={() => setStatus(Number(r.id), 'deactivate')}
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
