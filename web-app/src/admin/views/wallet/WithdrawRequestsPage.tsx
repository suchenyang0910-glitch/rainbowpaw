import { PageContainer } from '@ant-design/pro-components'
import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Modal, Space, Table, Tag, message } from 'antd'

type WithdrawRequestRow = {
  id: string | number
  request_no?: string
  global_user_id?: string
  points_cashable_amount?: number
  cash_amount?: number
  status?: string
  created_at?: string
}

export function WithdrawRequestsPage() {
  const { tableProps, tableQuery } = useTable<WithdrawRequestRow>({ resource: 'withdrawRequests' })
  const { mutateAsync, mutation } = useCustomMutation()

  const onDecision = async (row: WithdrawRequestRow, action: 'approve' | 'reject') => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: action === 'approve' ? '确认通过提现吗？' : '确认驳回提现吗？',
        content: `提现单：${String(row.request_no || row.id)}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return

    await mutateAsync({
      url: `/withdraw-requests/${encodeURIComponent(String(row.id))}/${action}`,
      method: 'post',
      values: {},
    })
    message.success(action === 'approve' ? '已通过' : '已驳回')
    await tableQuery.refetch()
  }

  const onPaid = async (row: WithdrawRequestRow) => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认标记已打款？',
        content: `提现单：${String(row.request_no || row.id)}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({
      url: `/withdraw-requests/${encodeURIComponent(String(row.id))}/paid`,
      method: 'post',
      values: {},
    })
    message.success('已标记打款')
    await tableQuery.refetch()
  }

  return (
    <PageContainer title={false}>
      <List title="提现审核">
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="request_no" title="提现单号" />
          <Table.Column dataIndex="global_user_id" title="用户" />
          <Table.Column dataIndex="points_cashable_amount" title="提取积分" />
          <Table.Column dataIndex="cash_amount" title="折算现金" />
          <Table.Column
            dataIndex="status"
            title="状态"
            render={(value: any) => {
              const v = String(value || '')
              const color = v === 'pending' ? 'gold' : v === 'approved' ? 'blue' : v === 'paid' ? 'green' : v === 'rejected' ? 'red' : 'default'
              return <Tag color={color}>{v || '-'}</Tag>
            }}
          />
          <Table.Column dataIndex="created_at" title="创建时间" />
          <Table.Column
            title="操作"
            render={(_v: any, row: WithdrawRequestRow) => (
              <Space>
                <CanAccess resource="withdrawRequests" action="approve">
                  <Button size="small" type="primary" disabled={mutation.isPending || String(row.status) !== 'pending'} onClick={() => onDecision(row, 'approve')}>
                    通过
                  </Button>
                </CanAccess>
                <CanAccess resource="withdrawRequests" action="reject">
                  <Button size="small" danger disabled={mutation.isPending || String(row.status) !== 'pending'} onClick={() => onDecision(row, 'reject')}>
                    驳回
                  </Button>
                </CanAccess>
                <CanAccess resource="withdrawRequests" action="paid">
                  <Button size="small" disabled={mutation.isPending || String(row.status) !== 'approved'} onClick={() => onPaid(row)}>
                    标记打款
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
