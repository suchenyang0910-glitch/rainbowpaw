import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, DatePicker, Drawer, Form, Input, Select, Space, Table, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type Lead = {
  lead_id: string
  global_user_id?: string | null
  country?: string | null
  city?: string | null
  language?: string | null
  channel?: string | null
  intent?: string | null
  stage?: string | null
  session_id?: string | null
  last_event_at?: string | null
  owner?: string | null
  next_followup_at?: string | null
}

export function CrmLeadsPage() {
  const [filters, setFilters] = useState({ country: '', city: '', stage: '', q: '', limit: '200' })
  const [active, setActive] = useState<Lead | null>(null)
  const [editForm] = Form.useForm()
  const [quoteForm] = Form.useForm()
  const { mutateAsync, mutation } = useCustomMutation()

  const { result, query } = useCustom({
    url: '/crm/leads',
    method: 'get',
    query: filters,
  } as any)

  const items: Lead[] = ((result as any)?.data?.items as any[]) || []

  const eventsQuery = useCustom(
    active
      ? ({ url: `/crm/leads/${encodeURIComponent(active.lead_id)}/events`, method: 'get', query: { limit: '200' } } as any)
      : (null as any),
  )
  const events = (((eventsQuery as any)?.result as any)?.data?.items as any[]) || []

  const quotesQuery = useCustom(
    active
      ? ({ url: '/pricing/aftercare/quotes', method: 'get', query: { lead_id: active.lead_id, limit: '50' } } as any)
      : (null as any),
  )
  const quotes = (((quotesQuery as any)?.result as any)?.data?.items as any[]) || []

  const columns = useMemo(
    () => [
      { title: 'Lead', dataIndex: 'lead_id', width: 150, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: '国家', dataIndex: 'country', width: 80 },
      { title: '城市', dataIndex: 'city', width: 120 },
      { title: '语言', dataIndex: 'language', width: 90 },
      { title: '渠道', dataIndex: 'channel', width: 110 },
      { title: '意向', dataIndex: 'intent', width: 110 },
      { title: '阶段', dataIndex: 'stage', width: 110, render: (v: any) => (v ? <Tag color="blue">{String(v)}</Tag> : '-') },
      { title: '归属', dataIndex: 'owner', width: 120 },
      {
        title: '下次跟进',
        dataIndex: 'next_followup_at',
        width: 170,
        render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 110,
        fixed: 'right' as const,
        render: (_: any, r: Lead) => (
          <Button
            size="small"
            onClick={() => {
              setActive(r)
              editForm.setFieldsValue({
                owner: r.owner || '',
                stage: r.stage || '',
                intent: r.intent || '',
                next_followup_at: r.next_followup_at ? dayjs(r.next_followup_at) : null,
              })
              quoteForm.setFieldsValue({
                country: r.country || '',
                city: r.city || '',
                package_code: '',
                weight_kg: 0,
                note: '',
              })
            }}
          >
            查看
          </Button>
        ),
      },
    ],
    [editForm, quoteForm],
  )

  const updateLead = async () => {
    if (!active) return
    const v = await editForm.validateFields()
    await mutateAsync({
      url: `/crm/leads/${encodeURIComponent(active.lead_id)}`,
      method: 'patch',
      values: {
        owner: String(v.owner || '').trim() || null,
        stage: String(v.stage || '').trim() || null,
        intent: String(v.intent || '').trim() || null,
        next_followup_at: v.next_followup_at ? (v.next_followup_at as any).toISOString() : null,
        reason: 'admin_edit',
      },
    } as any)
    message.success('已保存')
    void query.refetch()
    setActive({ ...active, ...v, next_followup_at: v.next_followup_at ? (v.next_followup_at as any).toISOString() : null })
  }

  const appendNote = async () => {
    if (!active) return
    const text = String(editForm.getFieldValue('note') || '').trim()
    if (!text) return
    await mutateAsync({
      url: `/crm/leads/${encodeURIComponent(active.lead_id)}/events`,
      method: 'post',
      values: { event_name: 'admin_note', event_data: { note: text } },
    } as any)
    editForm.setFieldValue('note', '')
    message.success('已写入事件')
    ;(eventsQuery as any)?.refetch?.()
  }

  const createQuote = async () => {
    if (!active) return
    const v = await quoteForm.validateFields()
    const res = await mutateAsync({
      url: '/pricing/aftercare/quotes',
      method: 'post',
      values: {
        lead_id: active.lead_id,
        country: v.country,
        city: v.city,
        package_code: v.package_code,
        weight_kg: Number(v.weight_kg || 0),
        note: v.note || null,
      },
    } as any)
    const share = (res as any)?.data?.share_url
    message.success('报价单已创建')
    ;(quotesQuery as any)?.refetch?.()
    if (share) {
      await navigator.clipboard.writeText(String(share)).catch(() => void 0)
    }
  }

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card title="线索列表" extra={<Button onClick={() => void query.refetch()} loading={query.isFetching}>刷新</Button>}>
          <Space wrap style={{ marginBottom: 12 }}>
            <Input
              placeholder="搜索 lead/global_user/channel"
              value={filters.q}
              onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
              style={{ width: 240 }}
              allowClear
            />
            <Input placeholder="country" value={filters.country} onChange={(e) => setFilters((s) => ({ ...s, country: e.target.value }))} style={{ width: 120 }} allowClear />
            <Input placeholder="city" value={filters.city} onChange={(e) => setFilters((s) => ({ ...s, city: e.target.value }))} style={{ width: 160 }} allowClear />
            <Select
              placeholder="stage"
              value={filters.stage || undefined}
              onChange={(v) => setFilters((s) => ({ ...s, stage: String(v || '') }))}
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'new', label: 'new' },
                { value: 'qualified', label: 'qualified' },
                { value: 'quoted', label: 'quoted' },
                { value: 'paid', label: 'paid' },
                { value: 'closed', label: 'closed' },
              ]}
            />
            <Button type="primary" onClick={() => void query.refetch()}>
              查询
            </Button>
          </Space>
          <Table
            rowKey={(r) => r.lead_id}
            columns={columns as any}
            dataSource={items}
            loading={query.isFetching}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 50 }}
          />
        </Card>

        <Drawer
          open={Boolean(active)}
          onClose={() => setActive(null)}
          width={720}
          title={active ? `Lead ${active.lead_id}` : 'Lead'}
        >
          {active ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card title="基础信息" size="small">
                <Form form={editForm} layout="vertical">
                  <Space wrap style={{ width: '100%' }}>
                    <Form.Item name="owner" label="归属" style={{ width: 220 }}>
                      <Input placeholder="例如：ops_1" />
                    </Form.Item>
                    <Form.Item name="stage" label="阶段" style={{ width: 220 }}>
                      <Select
                        allowClear
                        options={[
                          { value: 'new', label: 'new' },
                          { value: 'qualified', label: 'qualified' },
                          { value: 'quoted', label: 'quoted' },
                          { value: 'paid', label: 'paid' },
                          { value: 'closed', label: 'closed' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="intent" label="意向" style={{ width: 220 }}>
                      <Input placeholder="例如：aftercare" />
                    </Form.Item>
                    <Form.Item name="next_followup_at" label="下次跟进" style={{ width: 220 }}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Space>
                  <Form.Item name="note" label="写一条备注（会写入 lead_events）">
                    <Input.TextArea rows={3} placeholder="仅写关键信息" />
                  </Form.Item>
                  <Space>
                    <Button type="primary" onClick={updateLead} loading={mutation.isPending}>
                      保存
                    </Button>
                    <Button onClick={appendNote} loading={mutation.isPending}>
                      写入事件
                    </Button>
                  </Space>
                </Form>
              </Card>

              <Card title="善终报价" size="small">
                <Form
                  form={quoteForm}
                  layout="vertical"
                  initialValues={{ country: active.country || '', city: active.city || '', weight_kg: 0 }}
                >
                  <Space wrap style={{ width: '100%' }}>
                    <Form.Item name="country" label="country" rules={[{ required: true }]} style={{ width: 140 }}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="city" label="city" rules={[{ required: true }]} style={{ width: 220 }}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="package_code" label="package_code" rules={[{ required: true }]} style={{ width: 200 }}>
                      <Input placeholder="例如：basic" />
                    </Form.Item>
                    <Form.Item name="weight_kg" label="weight_kg" rules={[{ required: true }]} style={{ width: 160 }}>
                      <Input type="number" min={0} step={0.1} />
                    </Form.Item>
                  </Space>
                  <Form.Item name="note" label="备注">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Button type="primary" onClick={createQuote} loading={mutation.isPending}>
                    创建报价单（复制分享链接）
                  </Button>
                </Form>
                <div style={{ marginTop: 12 }}>
                  <Table
                    size="small"
                    rowKey={(r) => String(r.id)}
                    dataSource={quotes}
                    pagination={false}
                    columns={[
                      { title: 'ID', dataIndex: 'id', width: 90, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
                      { title: '套餐', dataIndex: 'package_code', width: 120 },
                      { title: '金额', dataIndex: 'total_cents', width: 120, render: (v: any, r: any) => `${String(r.currency || 'USD')} ${(Number(v || 0) / 100).toFixed(2)}` },
                      { title: '状态', dataIndex: 'status', width: 110, render: (v: any) => <Tag>{String(v)}</Tag> },
                      { title: '分享链接', dataIndex: 'share_url', render: (v: any) => (v ? <Typography.Link href={String(v)} target="_blank">打开</Typography.Link> : '-') },
                    ]}
                  />
                </div>
              </Card>

              <Card title="事件时间线" size="small" loading={(eventsQuery as any)?.isFetching}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {events.length ? (
                    events.map((e: any) => (
                      <Card key={String(e.id)} size="small" style={{ background: '#fafafa' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Typography.Text strong>{String(e.event_name)}</Typography.Text>
                          <Typography.Text type="secondary">{e.created_at ? dayjs(e.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Typography.Text>
                        </Space>
                        <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                          {e.event_data ? JSON.stringify(e.event_data) : '-'}
                        </Typography.Paragraph>
                      </Card>
                    ))
                  ) : (
                    <Typography.Text type="secondary">暂无事件</Typography.Text>
                  )}
                </Space>
              </Card>
            </Space>
          ) : null}
        </Drawer>
      </Space>
    </PageContainer>
  )
}
