import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'

export function ClawPoolsPage() {
  const { tableProps, tableQueryResult } = useTable({ resource: 'clawPools' })
  const { mutateAsync } = useCustomMutation()
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  const openCreate = () => {
    setCreating(true)
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ mode: 'normal', status: 'draft', legendary_rate: 0.05, recycle_ratio: 0.8 })
  }

  const openEdit = (row: any) => {
    setCreating(false)
    setEditing(row)
    form.setFieldsValue({
      id: row?.id,
      pool_name: row?.pool_name,
      mode: row?.mode,
      legendary_rate: Number(row?.legendary_rate ?? 0.05),
      recycle_ratio: Number(row?.recycle_ratio ?? 0.8),
      status: row?.status,
    })
  }

  const save = async () => {
    const v = await form.validateFields()
    if (creating) {
      await mutateAsync({ url: '/clawPools', method: 'post', values: v })
      message.success('已创建')
    } else {
      await mutateAsync({ url: `/clawPools/${encodeURIComponent(String(editing?.id))}`, method: 'put', values: v })
      message.success('已保存')
    }
    setEditing(null)
    setCreating(false)
    await tableQueryResult.refetch()
  }

  const publish = async (id: string) => {
    await mutateAsync({ url: `/clawPools/${encodeURIComponent(id)}/publish`, method: 'post', values: {} })
    message.success('已发布')
    await tableQueryResult.refetch()
  }

  const remove = async (id: string) => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除该奖池？',
        content: `奖池：${id}`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: `/clawPools/${encodeURIComponent(id)}`, method: 'delete', values: {} })
    message.success('已删除')
    await tableQueryResult.refetch()
  }

  return (
    <List
      title="奖池管理"
      headerButtons={() => (
        <CanAccess resource="clawPools" action="create">
          <Button type="primary" onClick={openCreate}>
            新建奖池
          </Button>
        </CanAccess>
      )}
    >
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={160} />
        <Table.Column dataIndex="pool_name" title="奖池名" />
        <Table.Column dataIndex="mode" title="模式" width={120} />
        <Table.Column
          dataIndex="legendary_rate"
          title="大奖率"
          width={120}
          render={(v: any) => <span>{Number(v || 0).toFixed(4)}</span>}
        />
        <Table.Column
          dataIndex="recycle_ratio"
          title="回收比例"
          width={120}
          render={(v: any) => <span>{Number(v || 0).toFixed(2)}</span>}
        />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => {
            const color = v === 'active' ? 'green' : v === 'draft' ? 'gold' : 'default'
            return <Tag color={color}>{String(v)}</Tag>
          }}
        />
        <Table.Column dataIndex="updated_at" title="更新时间" width={210} />
        <Table.Column
          title="操作"
          width={280}
          render={(_, r: any) => (
            <Space>
              <CanAccess resource="clawPools" action="edit">
                <Button size="small" onClick={() => openEdit(r)}>
                  编辑
                </Button>
              </CanAccess>
              <CanAccess resource="clawPools" action="publish">
                <Button size="small" disabled={String(r.status) === 'active'} onClick={() => publish(String(r.id))}>
                  发布
                </Button>
              </CanAccess>
              <CanAccess resource="clawPools" action="delete">
                <Button size="small" danger onClick={() => remove(String(r.id))}>
                  删除
                </Button>
              </CanAccess>
            </Space>
          )}
        />
      </Table>

      <Modal
        title={creating ? '新建奖池' : '编辑奖池'}
        open={creating || Boolean(editing)}
        okText="保存"
        cancelText="取消"
        onOk={save}
        onCancel={() => {
          setCreating(false)
          setEditing(null)
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="pool_name" label="奖池名" rules={[{ required: true, message: '请输入奖池名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="mode" label="模式" rules={[{ required: true, message: '请选择模式' }]}>
            <Select
              options={[
                { value: 'low', label: 'low' },
                { value: 'normal', label: 'normal' },
                { value: 'boost', label: 'boost' },
              ]}
            />
          </Form.Item>
          <Form.Item name="legendary_rate" label="大奖率" rules={[{ required: true, message: '请输入大奖率' }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.01} />
          </Form.Item>
          <Form.Item name="recycle_ratio" label="回收比例" rules={[{ required: true, message: '请输入回收比例' }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.01} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { value: 'draft', label: 'draft' },
                { value: 'active', label: 'active' },
                { value: 'inactive', label: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  )
}

