import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Space, Table, Tag, message } from 'antd'

export function RewardsPage() {
  const { tableProps, tableQuery } = useTable({ resource: 'rewards' })
  const { mutateAsync, mutation } = useCustomMutation()

  const revoke = async (id: number) => {
    await mutateAsync({
      url: `/rewards/${encodeURIComponent(String(id))}/revoke`,
      method: 'post',
      values: {},
    })
    message.success('已撤销')
    await tableQuery.refetch()
  }

  return (
    <List title="奖励发放记录">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={100} />
        <Table.Column dataIndex="rule_name" title="规则" width={180} />
        <Table.Column dataIndex="subject_type" title="对象类型" width={120} />
        <Table.Column dataIndex="subject_id" title="对象ID" width={220} />
        <Table.Column dataIndex="amount" title="数量" width={120} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => {
            const s = String(v || '')
            const color = s === 'granted' ? 'green' : s === 'revoked' ? 'red' : 'default'
            return <Tag color={color}>{s || '-'}</Tag>
          }}
        />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
        <Table.Column
          title="操作"
          width={120}
          render={(_, r: any) => {
            const st = String(r?.status || '')
            return (
              <Space>
                <CanAccess resource="rewards" action="revoke">
                  <Button
                    size="small"
                    danger
                    disabled={mutation.isPending || st !== 'granted'}
                    onClick={() => revoke(Number(r.id))}
                  >
                    撤销
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
