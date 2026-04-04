import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, Form, Input, InputNumber, Space, Table, Tag, message } from 'antd'
import { useMemo, useState } from 'react'

export function UserTagsPage() {
  const [userId, setUserId] = useState('')
  const [form] = Form.useForm()
  const target = String(userId || '').trim()

  const { result, query } = useCustom(
    {
      url: target ? `/users/${encodeURIComponent(target)}` : '/users/__none__',
      method: 'get',
      query: { t: Date.now() },
    } as any,
  )

  const { mutateAsync, mutation } = useCustomMutation()

  const user = useMemo(() => (result as any)?.data || null, [result])
  const tags = useMemo(() => (Array.isArray(user?.tags) ? user.tags : []), [user])

  const submit = async () => {
    const values = await form.validateFields()
    const tag_key = String(values.tag_key || '').trim()
    const tag_value = values.tag_value != null ? String(values.tag_value) : null
    const score = values.score != null ? Number(values.score) : null
    if (!target) return

    await mutateAsync({
      url: `/users/${encodeURIComponent(target)}/tags/upsert`,
      method: 'post',
      values: { tags: [{ tag_key, tag_value, score }] },
    })
    message.success('已更新标签')
    form.resetFields(['tag_key', 'tag_value', 'score'])
    await query.refetch()
  }

  return (
    <PageContainer title={false}>
      <Card title="用户标签管理" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="输入 global_user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Button type="primary" onClick={() => query.refetch()} disabled={!target}>
            查询
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            <span>用户：</span>
            <Tag>{target || '-'}</Tag>
            <span>宠物：</span>
            <Tag>{user?.pet_type ?? '-'}</Tag>
            <span>消费等级：</span>
            <Tag>{user?.spend_level ?? '-'}</Tag>
          </Space>
        </div>
      </Card>

      <Card title="当前标签" style={{ marginBottom: 16 }} loading={query.isFetching}>
        <Table
          rowKey={(r: any) => String(r.tag_key)}
          dataSource={tags}
          pagination={false}
          size="middle"
        >
          <Table.Column dataIndex="tag_key" title="tag_key" width={220} />
          <Table.Column dataIndex="tag_value" title="tag_value" />
          <Table.Column dataIndex="score" title="score" width={120} />
        </Table>
      </Card>

      <Card title="添加 / 更新" loading={mutation.isPending}>
        <Form form={form} layout="inline" initialValues={{ score: 1 }}>
          <Form.Item name="tag_key" rules={[{ required: true, message: 'tag_key 必填' }]}
            >
            <Input placeholder="例如 high_value" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="tag_value">
            <Input placeholder="可选，例如 true" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="score">
            <InputNumber min={0} max={100} step={0.1} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={submit} disabled={!target}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  )
}

