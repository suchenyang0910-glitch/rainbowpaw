import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Modal, Space, Table, Tag, message } from 'antd'

export function MerchantListPage() {
  const { tableProps, tableQuery } = useTable({ resource: 'merchants' })
  const { mutateAsync } = useCustomMutation()

  const act = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: action === 'approve' ? '确认通过该商家？' : action === 'reject' ? '确认驳回该商家？' : '确认暂停该商家？',
        content: `商家：${id}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: `/merchants/${encodeURIComponent(id)}/${action}`, method: 'post', values: {} })
    message.success('操作成功')
    await tableQuery.refetch()
  }

  return (
    <List title="商家列表">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={160} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="category" title="分类" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={140}
          render={(v: string) => {
            const color = v === 'approved' ? 'green' : v === 'pending' ? 'gold' : v === 'suspended' ? 'red' : 'default'
            return <Tag color={color}>{String(v)}</Tag>
          }}
        />
        <Table.Column dataIndex="created_at" title="创建时间" width={210} />
        <Table.Column
          title="操作"
          width={260}
          render={(_, r: any) => (
            <Space>
              <CanAccess resource="merchants" action="approve">
                <Button size="small" onClick={() => act(String(r.id), 'approve')}>
                  通过
                </Button>
              </CanAccess>
              <CanAccess resource="merchants" action="reject">
                <Button size="small" danger onClick={() => act(String(r.id), 'reject')}>
                  驳回
                </Button>
              </CanAccess>
              <CanAccess resource="merchants" action="suspend">
                <Button size="small" onClick={() => act(String(r.id), 'suspend')}>
                  暂停
                </Button>
              </CanAccess>
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
