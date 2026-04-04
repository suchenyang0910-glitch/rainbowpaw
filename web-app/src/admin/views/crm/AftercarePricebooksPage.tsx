import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Button, Card, Form, Input, Modal, Space, Table, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type Pricebook = {
  id: string
  country: string
  city: string
  package_code: string
  currency: string
  base_price_cents: number
  pickup_fee_cents: number
  weight_fee_rules?: any
  updated_at?: string | null
}

export function AftercarePricebooksPage() {
  const [filters, setFilters] = useState({ country: '', city: '', limit: '200' })
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const { mutateAsync, mutation } = useCustomMutation()

  const { result, refetch, isFetching } = useCustom({
    url: '/pricing/aftercare/pricebooks',
    method: 'get',
    query: filters,
  } as any)
  const items: Pricebook[] = ((result as any)?.data?.items as any[]) || []

  const columns = useMemo(
    () => [
      { title: 'country', dataIndex: 'country', width: 90, render: (v: any) => <Tag>{String(v)}</Tag> },
      { title: 'city', dataIndex: 'city', width: 160 },
      { title: 'package', dataIndex: 'package_code', width: 140, render: (v: any) => <Typography.Text code>{String(v)}</Typography.Text> },
      { title: 'currency', dataIndex: 'currency', width: 90 },
      { title: 'base', dataIndex: 'base_price_cents', width: 90, render: (v: any) => (Number(v || 0) / 100).toFixed(2) },
      { title: 'pickup', dataIndex: 'pickup_fee_cents', width: 90, render: (v: any) => (Number(v || 0) / 100).toFixed(2) },
      { title: 'weight_rules', dataIndex: 'weight_fee_rules', render: (v: any) => (v ? JSON.stringify(v) : '-') },
      { title: 'updated', dataIndex: 'updated_at', width: 160, render: (v: any) => (v ? dayjs(String(v)).format('YYYY-MM-DD HH:mm') : '-') },
      {
        title: '操作',
        key: 'actions',
        width: 110,
        fixed: 'right' as const,
        render: (_: any, r: Pricebook) => (
          <Button
            size="small"
            onClick={() => {
              setOpen(true)
              form.setFieldsValue({
                country: r.country,
                city: r.city,
                package_code: r.package_code,
                currency: r.currency,
                base_price_cents: r.base_price_cents,
                pickup_fee_cents: r.pickup_fee_cents,
                weight_fee_rules: r.weight_fee_rules ? JSON.stringify(r.weight_fee_rules, null, 2) : '',
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
    let rules: any = null
    const raw = String(v.weight_fee_rules || '').trim()
    if (raw) {
      try {
        rules = JSON.parse(raw)
      } catch {
        throw new Error('weight_fee_rules 不是合法 JSON')
      }
    }
    await mutateAsync({
      url: '/pricing/aftercare/pricebooks',
      method: 'post',
      values: {
        country: String(v.country).trim(),
        city: String(v.city).trim(),
        package_code: String(v.package_code).trim(),
        currency: String(v.currency || 'USD').trim(),
        base_price_cents: Math.floor(Number(v.base_price_cents || 0)),
        pickup_fee_cents: Math.floor(Number(v.pickup_fee_cents || 0)),
        weight_fee_rules: rules,
      },
    } as any)
    message.success('已保存')
    setOpen(false)
    refetch()
  }

  return (
    <PageContainer title={false}>
      <Card
        title="善终价目表（Pricebook）"
        extra={
          <Space>
            <Button
              onClick={() => {
                setOpen(true)
                form.resetFields()
                form.setFieldsValue({ currency: 'USD', base_price_cents: 0, pickup_fee_cents: 0, weight_fee_rules: '' })
              }}
            >
              新增/覆盖
            </Button>
            <Button onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Input placeholder="country" value={filters.country} onChange={(e) => setFilters((s) => ({ ...s, country: e.target.value }))} style={{ width: 120 }} allowClear />
          <Input placeholder="city" value={filters.city} onChange={(e) => setFilters((s) => ({ ...s, city: e.target.value }))} style={{ width: 160 }} allowClear />
          <Button type="primary" onClick={() => refetch()}>
            查询
          </Button>
        </Space>
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns as any}
          dataSource={items}
          loading={isFetching}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 50 }}
        />
      </Card>

      <Modal
        open={open}
        title="编辑 Pricebook"
        okText="保存"
        onCancel={() => setOpen(false)}
        confirmLoading={mutation.isPending}
        onOk={() => save().catch((e) => message.error(String(e?.message || e)))}
      >
        <Form form={form} layout="vertical">
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="country" label="country" rules={[{ required: true }]} style={{ width: 130 }}>
              <Input />
            </Form.Item>
            <Form.Item name="city" label="city" rules={[{ required: true }]} style={{ width: 220 }}>
              <Input />
            </Form.Item>
            <Form.Item name="package_code" label="package_code" rules={[{ required: true }]} style={{ width: 220 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="currency" label="currency" rules={[{ required: true }]} style={{ width: 160 }}>
              <Input />
            </Form.Item>
            <Form.Item name="base_price_cents" label="base_price_cents" rules={[{ required: true }]} style={{ width: 200 }}>
              <Input type="number" min={0} step={1} />
            </Form.Item>
            <Form.Item name="pickup_fee_cents" label="pickup_fee_cents" rules={[{ required: true }]} style={{ width: 200 }}>
              <Input type="number" min={0} step={1} />
            </Form.Item>
          </Space>
          <Form.Item name="weight_fee_rules" label="weight_fee_rules（JSON）">
            <Input.TextArea rows={6} placeholder='例如：{"per_kg_cents": 50}' />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

