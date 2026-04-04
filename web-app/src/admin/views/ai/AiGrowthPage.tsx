import { PageContainer } from '@ant-design/pro-components'
import { CanAccess, useCustom, useCustomMutation } from '@refinedev/core'
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'

export function AiGrowthPage() {
  const { mutateAsync, mutation } = useCustomMutation()
  const [out, setOut] = useState<any | null>(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({ status: 'draft', country: '', limit: '100' })
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [editForm] = Form.useForm()

  const { result, refetch, isFetching } = useCustom({
    url: '/ai/growth/contents',
    method: 'get',
    query: filters,
  } as any)
  const items = ((result as any)?.data?.items as any[]) || []

  const generate = async () => {
    const v = await form.validateFields()
    const res = await mutateAsync({ url: '/ai/growth/generate', method: 'post', values: v })
    setOut((res as any)?.data || null)
    message.success('已生成')
    if (v.save) refetch()
  }

  const saveEdit = async () => {
    const v = await editForm.validateFields()
    if (!editTarget) return
    await mutateAsync({
      url: `/ai/growth/contents/${encodeURIComponent(String(editTarget.id))}`,
      method: 'patch',
      values: { status: v.status, content: v.content },
    } as any)
    message.success('已更新')
    setEditOpen(false)
    setEditTarget(null)
    refetch()
  }

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert type="info" showIcon message="AI 文案职责" description="为活动/召回/拼团生成多版本文案或短视频脚本，支持复用模板与审计。" />

        <Card title="生成文案">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ kind: 'push', topic: '拼团召回', tone: 'warm', save: true }}
          >
            <Form.Item name="kind" label="类型" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'push', label: 'Push 文案' },
                  { value: 'tiktok', label: '短视频脚本' },
                ]}
              />
            </Form.Item>
            <Form.Item name="topic" label="主题" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="例如：积分即将过期" />
            </Form.Item>
            <Form.Item name="tone" label="语气" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'warm', label: '温柔' },
                  { value: 'friendly', label: '友好' },
                  { value: 'urgent', label: '紧迫' },
                ]}
              />
            </Form.Item>
            <Form.Item name="country" label="country（可选）">
              <Input placeholder="例如：VN" />
            </Form.Item>
            <Form.Item name="save" label="保存到内容池" valuePropName="checked">
              <Switch />
            </Form.Item>
            <CanAccess resource="aiGrowth" action="generate">
              <Button type="primary" loading={mutation.isPending} onClick={generate}>
                生成
              </Button>
            </CanAccess>
          </Form>
        </Card>

        <Card title="生成结果">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            模型：{String(out?.model_hint || '-')}
          </Typography.Paragraph>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
            {out?.content ? String(out.content) : '暂无'}
          </Typography.Paragraph>
        </Card>

        <Card
          title="内容池（draft）"
          extra={
            <Space>
              <Button onClick={() => refetch()} loading={isFetching}>
                刷新
              </Button>
            </Space>
          }
        >
          <Space wrap style={{ marginBottom: 12 }}>
            <Select
              value={filters.status}
              onChange={(v) => setFilters((s) => ({ ...s, status: String(v || '') }))}
              style={{ width: 160 }}
              options={[
                { value: 'draft', label: 'draft' },
                { value: 'published', label: 'published' },
                { value: 'archived', label: 'archived' },
              ]}
            />
            <Input
              placeholder="country"
              value={filters.country}
              onChange={(e) => setFilters((s) => ({ ...s, country: e.target.value }))}
              style={{ width: 160 }}
              allowClear
            />
            <Button type="primary" onClick={() => refetch()}>
              查询
            </Button>
          </Space>
          <Table
            rowKey={(r) => String(r.id)}
            dataSource={items}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 90, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
              { title: 'kind', dataIndex: 'kind', width: 110, render: (v: any) => <Tag>{String(v)}</Tag> },
              { title: 'topic', dataIndex: 'topic', width: 180 },
              { title: 'tone', dataIndex: 'tone', width: 120 },
              { title: 'country', dataIndex: 'country', width: 90 },
              { title: 'status', dataIndex: 'status', width: 110, render: (v: any) => <Tag color={v === 'draft' ? 'orange' : 'blue'}>{String(v)}</Tag> },
              {
                title: '操作',
                key: 'actions',
                width: 110,
                fixed: 'right' as const,
                render: (_: any, r: any) => (
                  <Button
                    size="small"
                    onClick={() => {
                      setEditTarget(r)
                      setEditOpen(true)
                      editForm.setFieldsValue({ status: r.status, content: r.content })
                    }}
                  >
                    编辑
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Modal
        open={editOpen}
        title={editTarget ? `编辑内容 #${String(editTarget.id)}` : '编辑内容'}
        okText="保存"
        onCancel={() => {
          setEditOpen(false)
          setEditTarget(null)
        }}
        confirmLoading={mutation.isPending}
        onOk={saveEdit}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="status" label="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'draft', label: 'draft' },
                { value: 'published', label: 'published' },
                { value: 'archived', label: 'archived' },
              ]}
            />
          </Form.Item>
          <Form.Item name="content" label="content" rules={[{ required: true }]}>
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
