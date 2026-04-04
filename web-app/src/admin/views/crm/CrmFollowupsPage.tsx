import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, DatePicker, Form, Input, Modal, Space, Table, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type Followup = {
  id: string
  lead_id: string
  channel: string
  dedupe_key?: string | null
  status: string
  due_at?: string | null
  template_key?: string | null
  payload?: any
  last_error?: string | null
}

export function CrmFollowupsPage() {
  const [filters, setFilters] = useState({ due_before: new Date().toISOString(), status: 'pending', limit: '200' })
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTarget, setSendTarget] = useState<Followup | null>(null)
  const [autoOpen, setAutoOpen] = useState(false)

  const [sendForm] = Form.useForm()
  const [autoForm] = Form.useForm()
  const { mutateAsync, mutation } = useCustomMutation()

  const { result, refetch, isFetching } = useCustom({
    url: '/crm/followups',
    method: 'get',
    query: filters,
  } as any)

  const items: Followup[] = ((result as any)?.data?.items as any[]) || []

  const openSend = (r: Followup) => {
    setSendTarget(r)
    setSendOpen(true)
    const p = r.payload && typeof r.payload === 'object' ? r.payload : {}
    sendForm.setFieldsValue({
      bot: 'rainbow',
      chat_id: p.chat_id || p.telegram_chat_id || '',
      message: p.message || '',
    })
  }

  const sendNow = async () => {
    const v = await sendForm.validateFields()
    if (!sendTarget) return
    await mutateAsync({
      url: '/outreach/telegram/send',
      method: 'post',
      values: {
        bot: v.bot,
        chat_id: v.chat_id,
        lead_id: sendTarget.lead_id,
        template_key: sendTarget.template_key || 'followup',
        message: v.message,
      },
    } as any)
    await mutateAsync({
      url: `/crm/followups/${encodeURIComponent(sendTarget.id)}/result`,
      method: 'post',
      values: { status: 'sent' },
    } as any)
    message.success('已发送并写回状态')
    setSendOpen(false)
    setSendTarget(null)
    refetch()
  }

  const markDone = async (r: Followup) => {
    await mutateAsync({
      url: `/crm/followups/${encodeURIComponent(r.id)}/result`,
      method: 'post',
      values: { status: 'done' },
    } as any)
    message.success('已标记完成')
    refetch()
  }

  const autoGenerate = async () => {
    const v = await autoForm.validateFields()
    const days = String(v.days || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
    const res = await mutateAsync({
      url: '/crm/followups/auto-generate',
      method: 'post',
      values: {
        country: String(v.country || '').trim(),
        stage: String(v.stage || '').trim(),
        intent: String(v.intent || '').trim(),
        limit: Number(v.limit || 200),
        days: days.length ? days : [0, 1, 3, 7],
      },
    } as any)
    message.success(`已生成：${Number((res as any)?.data?.inserted || 0)} 条`) 
    setAutoOpen(false)
    refetch()
  }

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: 'Lead', dataIndex: 'lead_id', width: 150, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: '渠道', dataIndex: 'channel', width: 90, render: (v: any) => <Tag>{String(v)}</Tag> },
      { title: '模板', dataIndex: 'template_key', width: 90, render: (v: any) => (v ? String(v) : '-') },
      { title: '状态', dataIndex: 'status', width: 90, render: (v: any) => <Tag color={v === 'pending' ? 'orange' : 'blue'}>{String(v)}</Tag> },
      { title: '到期时间', dataIndex: 'due_at', width: 170, render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-') },
      { title: '错误', dataIndex: 'last_error', render: (v: any) => (v ? <Typography.Text type="danger">{String(v)}</Typography.Text> : '-') },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        fixed: 'right' as const,
        render: (_: any, r: Followup) => (
          <Space>
            <Button size="small" type="primary" onClick={() => openSend(r)}>
              发送
            </Button>
            <Button size="small" onClick={() => markDone(r)}>
              完成
            </Button>
          </Space>
        ),
      },
    ],
    [],
  )

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card
          title="待跟进任务"
          extra={
            <Space>
              <Button onClick={() => setAutoOpen(true)}>自动生成</Button>
              <Button onClick={() => refetch()} loading={isFetching}>
                刷新
              </Button>
            </Space>
          }
        >
          <Space wrap style={{ marginBottom: 12 }}>
            <DatePicker
              showTime
              value={filters.due_before ? dayjs(filters.due_before) : dayjs()}
              onChange={(d) => setFilters((s) => ({ ...s, due_before: (d || dayjs()).toISOString() }))}
            />
            <Input
              placeholder="status"
              value={filters.status}
              onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
              style={{ width: 140 }}
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
            scroll={{ x: 980 }}
            pagination={{ pageSize: 50 }}
          />
        </Card>
      </Space>

      <Modal
        open={sendOpen}
        title={sendTarget ? `发送跟进（#${sendTarget.id}）` : '发送跟进'}
        okText="发送"
        onCancel={() => {
          setSendOpen(false)
          setSendTarget(null)
        }}
        confirmLoading={mutation.isPending}
        onOk={sendNow}
      >
        <Form form={sendForm} layout="vertical">
          <Form.Item name="bot" label="bot" rules={[{ required: true }]}>
            <Select options={[{ value: 'rainbow', label: 'rainbow' }, { value: 'claw', label: 'claw' }]} />
          </Form.Item>
          <Form.Item name="chat_id" label="chat_id" rules={[{ required: true, message: '请输入 Telegram chat_id' }]}>
            <Input placeholder="例如：123456789" />
          </Form.Item>
          <Form.Item name="message" label="message" rules={[{ required: true, message: '请输入发送内容' }]}>
            <Input.TextArea rows={6} placeholder="支持 HTML parse_mode" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={autoOpen}
        title="自动生成 D0/D1/D3/D7 跟进"
        okText="生成"
        onCancel={() => setAutoOpen(false)}
        confirmLoading={mutation.isPending}
        onOk={autoGenerate}
      >
        <Form form={autoForm} layout="vertical" initialValues={{ limit: 200, days: '0,1,3,7', stage: '', country: '', intent: '' }}>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="country" label="country" style={{ width: 140 }}>
              <Input allowClear />
            </Form.Item>
            <Form.Item name="stage" label="stage" style={{ width: 160 }}>
              <Input allowClear />
            </Form.Item>
            <Form.Item name="intent" label="intent" style={{ width: 180 }}>
              <Input allowClear />
            </Form.Item>
          </Space>
          <Form.Item name="days" label="days（逗号分隔）">
            <Input placeholder="0,1,3,7" />
          </Form.Item>
          <Form.Item name="limit" label="limit" rules={[{ required: true }]}>
            <Input type="number" min={1} max={500} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

