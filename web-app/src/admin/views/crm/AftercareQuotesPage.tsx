import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, Drawer, Form, Input, Modal, Space, Table, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type Quote = {
  id: string
  lead_id?: string | null
  country: string
  city: string
  package_code: string
  weight_kg: number
  currency: string
  total_cents: number
  status: string
  share_url?: string | null
  sent_at?: string | null
  decided_at?: string | null
}

export function AftercareQuotesPage() {
  const [filters, setFilters] = useState({ lead_id: '', status: '', limit: '200' })
  const [active, setActive] = useState<Quote | null>(null)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendForm] = Form.useForm()
  const { mutateAsync, mutation } = useCustomMutation()

  const { result, refetch, isFetching } = useCustom({
    url: '/pricing/aftercare/quotes',
    method: 'get',
    query: filters,
  } as any)
  const items: Quote[] = ((result as any)?.data?.items as any[]) || []

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: 'Lead', dataIndex: 'lead_id', width: 150, render: (v: any) => (v ? <Typography.Text code>{String(v)}</Typography.Text> : '-') },
      { title: '国家', dataIndex: 'country', width: 80, render: (v: any) => <Tag>{String(v)}</Tag> },
      { title: '城市', dataIndex: 'city', width: 120 },
      { title: '套餐', dataIndex: 'package_code', width: 140 },
      { title: '重量(kg)', dataIndex: 'weight_kg', width: 100 },
      { title: '金额', dataIndex: 'total_cents', width: 130, render: (v: any, r: any) => `${String(r.currency || 'USD')} ${(Number(v || 0) / 100).toFixed(2)}` },
      { title: '状态', dataIndex: 'status', width: 100, render: (v: any) => <Tag color={v === 'sent' ? 'blue' : v === 'accepted' ? 'green' : v === 'rejected' ? 'red' : 'default'}>{String(v)}</Tag> },
      { title: 'sent', dataIndex: 'sent_at', width: 160, render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-') },
      { title: 'decision', dataIndex: 'decided_at', width: 160, render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-') },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        fixed: 'right' as const,
        render: (_: any, r: Quote) => (
          <Space>
            <Button size="small" onClick={() => setActive(r)}>
              查看
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setActive(r)
                setSendOpen(true)
                sendForm.setFieldsValue({ bot: 'rainbow', chat_id: '', message: '' })
              }}
            >
              发送
            </Button>
          </Space>
        ),
      },
    ],
    [sendForm],
  )

  const send = async () => {
    const v = await sendForm.validateFields()
    if (!active) return
    const res = await mutateAsync({
      url: `/pricing/aftercare/quotes/${encodeURIComponent(active.id)}/send`,
      method: 'post',
      values: { bot: v.bot, chat_id: v.chat_id, message: v.message || null },
    } as any)
    const share = (res as any)?.data?.share_url
    if (share) await navigator.clipboard.writeText(String(share)).catch(() => void 0)
    message.success('已发送（分享链接已复制）')
    setSendOpen(false)
    refetch()
  }

  const voidQuote = async () => {
    if (!active) return
    await mutateAsync({
      url: `/pricing/aftercare/quotes/${encodeURIComponent(active.id)}/void`,
      method: 'post',
      values: {},
    } as any)
    message.success('已作废')
    refetch()
    setActive(null)
  }

  return (
    <PageContainer title={false}>
      <Card
        title="善终报价单"
        extra={
          <Space>
            <Button onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Input placeholder="lead_id" value={filters.lead_id} onChange={(e) => setFilters((s) => ({ ...s, lead_id: e.target.value }))} style={{ width: 200 }} allowClear />
          <Input placeholder="status" value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} style={{ width: 160 }} allowClear />
          <Button type="primary" onClick={() => refetch()}>
            查询
          </Button>
        </Space>
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns as any}
          dataSource={items}
          loading={isFetching}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 50 }}
        />
      </Card>

      <Drawer open={Boolean(active)} onClose={() => setActive(null)} width={560} title={active ? `Quote #${active.id}` : 'Quote'}>
        {active ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small" title="摘要">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>国家：{active.country}</div>
                <div>城市：{active.city}</div>
                <div>套餐：{active.package_code}</div>
                <div>重量：{Number(active.weight_kg || 0)} kg</div>
                <div>金额：{active.currency} {(Number(active.total_cents || 0) / 100).toFixed(2)}</div>
                <div>
                  分享链接：
                  {active.share_url ? (
                    <Typography.Link href={String(active.share_url)} target="_blank">
                      打开
                    </Typography.Link>
                  ) : (
                    '-'
                  )}
                </div>
              </Space>
            </Card>
            <Space>
              <Button danger onClick={() => voidQuote()} loading={mutation.isPending}>
                作废
              </Button>
            </Space>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        open={sendOpen}
        title={active ? `发送报价（#${active.id}）` : '发送报价'}
        okText="发送"
        onCancel={() => setSendOpen(false)}
        confirmLoading={mutation.isPending}
        onOk={send}
      >
        <Form form={sendForm} layout="vertical" initialValues={{ bot: 'rainbow' }}>
          <Form.Item name="bot" label="bot" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="chat_id" label="chat_id" rules={[{ required: true }]}>
            <Input placeholder="Telegram chat_id" />
          </Form.Item>
          <Form.Item name="message" label="message（可留空使用默认模板）">
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

