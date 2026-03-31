import { PageContainer } from '@ant-design/pro-components'
import { CanAccess, useCustomMutation, useCustom } from '@refinedev/core'
import { Button, Card, Descriptions, Modal, Space, Tag, message } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function UserShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const userId = String(id || '')

  const { result, query } = useCustom({
    url: `/users/${encodeURIComponent(userId)}`,
    method: 'get',
  } as any)

  const { mutateAsync } = useCustomMutation()

  const user = useMemo(() => (result as any)?.data || null, [result])

  const toggle = async (next: 'freeze' | 'unfreeze') => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: next === 'freeze' ? '确认冻结该用户？' : '确认解冻该用户？',
        content: `用户：${userId}`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: `/users/${encodeURIComponent(userId)}/${next}`, method: 'post', values: {} })
    message.success(next === 'freeze' ? '已冻结' : '已解冻')
    await query.refetch()
  }

  const status = String(user?.status || '-')

  return (
    <PageContainer
      title={false}
      extra={
        <Space>
          <Button onClick={() => navigate('/admin/users')}>返回列表</Button>
          <CanAccess resource="users" action="freeze">
            <Button danger disabled={status !== 'active'} onClick={() => toggle('freeze')}>
              冻结
            </Button>
          </CanAccess>
          <CanAccess resource="users" action="unfreeze">
            <Button disabled={status === 'active'} onClick={() => toggle('unfreeze')}>
              解冻
            </Button>
          </CanAccess>
        </Space>
      }
    >
      <Card loading={query.isFetching} title="用户详情">
        <Descriptions column={2} size="middle">
          <Descriptions.Item label="Global User ID">{user?.global_user_id || userId}</Descriptions.Item>
          <Descriptions.Item label="Telegram ID">{user?.telegram_id ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="用户名">{user?.username ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="宠物类型">{user?.pet_type ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="累计消费">{user?.spend_total ?? 0}</Descriptions.Item>
          <Descriptions.Item label="消费等级">
            <Tag>{String(user?.spend_level || '-')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最近活跃">{user?.last_active_at ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </PageContainer>
  )
}
