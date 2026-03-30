import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'

export function ProductListPage() {
  const { tableProps, tableQueryResult } = useTable({ resource: 'products' })
  const { mutateAsync } = useCustomMutation()
  const [editing, setEditing] = useState<any | null>(null)
  const [form] = Form.useForm()

  const openEdit = (row: any) => {
    setEditing(row)
    form.setFieldsValue({
      name: row?.name,
      category: row?.category,
      price_cents: Number(row?.price_cents || 0),
    })
  }

  const save = async () => {
    const v = await form.validateFields()
    await mutateAsync({
      url: `/products/${encodeURIComponent(String(editing?.id))}`,
      method: 'put',
      values: v,
    })
    message.success('已保存')
    setEditing(null)
    await tableQueryResult.refetch()
  }

  const setStatus = async (id: any, action: 'publish' | 'unpublish') => {
    await mutateAsync({ url: `/products/${encodeURIComponent(String(id))}/${action}`, method: 'post', values: {} })
    message.success(action === 'publish' ? '已上架' : '已下架')
    await tableQueryResult.refetch()
  }

  return (
    <List title="商品管理">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={90} />
        <Table.Column dataIndex="name" title="商品名" />
        <Table.Column dataIndex="category" title="类目" width={120} />
        <Table.Column
          dataIndex="price_cents"
          title="价格"
          width={120}
          render={(c: number, r: any) => {
            const cents = Number(c || 0)
            const currency = String(r?.currency || 'USD')
            return (
              <span>
                {(cents / 100).toFixed(2)} {currency}
              </span>
            )
          }}
        />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => <Tag color={v === 'published' ? 'green' : 'default'}>{String(v)}</Tag>}
        />
        <Table.Column dataIndex={['merchant', 'name']} title="商家" width={160} />
        <Table.Column dataIndex="production_time_days" title="制作天数" width={120} />
        <Table.Column
          title="操作"
          width={260}
          render={(_, r: any) => (
            <Space>
              <CanAccess resource="products" action="edit">
                <Button size="small" onClick={() => openEdit(r)}>
                  编辑
                </Button>
              </CanAccess>
              <CanAccess resource="products" action="publish">
                <Button size="small" disabled={String(r.status) === 'published'} onClick={() => setStatus(r.id, 'publish')}>
                  上架
                </Button>
              </CanAccess>
              <CanAccess resource="products" action="unpublish">
                <Button size="small" disabled={String(r.status) !== 'published'} onClick={() => setStatus(r.id, 'unpublish')}>
                  下架
                </Button>
              </CanAccess>
            </Space>
          )}
        />
      </Table>

      <Modal
        title="编辑商品"
        open={Boolean(editing)}
        okText="保存"
        cancelText="取消"
        onOk={save}
        onCancel={() => setEditing(null)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商品名" rules={[{ required: true, message: '请输入商品名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类目" rules={[{ required: true, message: '请输入类目' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price_cents" label="价格（分）" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  )
}
