import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type Template = {
  id: string
  scene: string
  name: string
  enabled: boolean
  template_text: string
  variables_schema?: any
  updated_at?: string | null
}

export function AiTemplatesPage() {
  const [filters, setFilters] = useState({ scene: '', enabled: '', limit: '200' })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form] = Form.useForm()
  const { mutateAsync, mutation } = useCustomMutation()

  const { result, refetch, isFetching } = useCustom({
    url: '/ai/templates',
    method: 'get',
    query: filters,
  } as any)
  const items: Template[] = ((result as any)?.data?.items as any[]) || []

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: 'scene', dataIndex: 'scene', width: 160, render: (v: any) => <Tag>{String(v)}</Tag> },
      { title: 'name', dataIndex: 'name', width: 180 },
      { title: 'enabled', dataIndex: 'enabled', width: 90, render: (v: any) => <Tag color={v ? 'green' : 'default'}>{v ? 'on' : 'off'}</Tag> },
      { title: 'updated', dataIndex: 'updated_at', width: 160, render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-') },
      {
        title: '操作',
        key: 'actions',
        width: 110,
        fixed: 'right' as const,
        render: (_: any, r: Template) => (
          <Button
            size="small"
            onClick={() => {
              setEditing(r)
              setOpen(true)
              form.setFieldsValue({
                scene: r.scene,
                name: r.name,
                enabled: r.enabled,
                template_text: r.template_text,
                variables_schema: r.variables_schema ? JSON.stringify(r.variables_schema, null, 2) : '',
              })
            }}
          >
            编辑
          </Button>
        ),
      },
    ],
    [form],
  )

  const save = async () => {
    const v = await form.validateFields()
    let schema: any = null
    const raw = String(v.variables_schema || '').trim()
    if (raw) {
      try {
        schema = JSON.parse(raw)
      } catch {
        throw new Error('variables_schema 不是合法 JSON')
      }
    }
    if (editing) {
      await mutateAsync({
        url: `/ai/templates/${encodeURIComponent(editing.id)}`,
        method: 'patch',
        values: {
          enabled: Boolean(v.enabled),
          name: String(v.name).trim(),
          template_text: String(v.template_text),
          variables_schema: schema,
        },
      } as any)
    } else {
      await mutateAsync({
        url: '/ai/templates',
        method: 'post',
        values: {
          scene: String(v.scene).trim(),
          name: String(v.name).trim(),
          enabled: Boolean(v.enabled),
          template_text: String(v.template_text),
          variables_schema: schema,
        },
      } as any)
    }
    message.success('已保存')
    setOpen(false)
    setEditing(null)
    refetch()
  }

  return (
    <PageContainer title={false}>
      <Card
        title="AI 文案模板"
        extra={
          <Space>
            <Button
              onClick={() => {
                setEditing(null)
                setOpen(true)
                form.resetFields()
                form.setFieldsValue({ enabled: true, scene: 'followup_message' })
              }}
            >
              新增
            </Button>
            <Button onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Input placeholder="scene" value={filters.scene} onChange={(e) => setFilters((s) => ({ ...s, scene: e.target.value }))} style={{ width: 200 }} allowClear />
          <Select
            placeholder="enabled"
            value={filters.enabled || undefined}
            onChange={(v) => setFilters((s) => ({ ...s, enabled: String(v || '') }))}
            allowClear
            style={{ width: 140 }}
            options={[
              { value: 'true', label: 'true' },
              { value: 'false', label: 'false' },
            ]}
          />
          <Button type="primary" onClick={() => refetch()}>
            查询
          </Button>
        </Space>
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns as any}
          dataSource={items}
          loading={isFetching}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 50 }}
        />
      </Card>

      <Modal
        open={open}
        title={editing ? `编辑模板 #${editing.id}` : '新增模板'}
        okText="保存"
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        confirmLoading={mutation.isPending}
        onOk={() => save().catch((e) => message.error(String(e?.message || e)))}
      >
        <Form form={form} layout="vertical" initialValues={{ enabled: true }}>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="scene" label="scene" rules={[{ required: true }]} style={{ width: 220 }}>
              <Select
                disabled={Boolean(editing)}
                options={[
                  { value: 'followup_message', label: 'followup_message' },
                  { value: 'quote_summary', label: 'quote_summary' },
                  { value: 'growth_copy', label: 'growth_copy' },
                ]}
              />
            </Form.Item>
            <Form.Item name="name" label="name" rules={[{ required: true }]} style={{ width: 260 }}>
              <Input placeholder="例如：D1 温柔跟进" />
            </Form.Item>
            <Form.Item name="enabled" label="enabled" valuePropName="checked" style={{ width: 120 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="template_text" label="template_text" rules={[{ required: true }]}>
            <Input.TextArea rows={8} placeholder="写清楚输出格式与变量占位符" />
          </Form.Item>
          <Form.Item name="variables_schema" label="variables_schema（JSON，可选）">
            <Input.TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

