import { List, useTable } from '@refinedev/antd'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Button, Form, Input, Modal, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'

export function RiskBlacklistPage() {
  const { tableProps, tableQuery } = useTable({ resource: 'riskBlacklist' })
  const { mutateAsync, mutation } = useCustomMutation()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const create = async () => {
    const values = await form.validateFields()
    await mutateAsync({ url: '/riskBlacklist', method: 'post', values })
    message.success('已添加')
    setOpen(false)
    form.resetFields()
    await tableQuery.refetch()
  }

  return (
    <List
      title="冻结 / 黑名单"
      headerButtons={() => (
        <CanAccess resource="riskBlacklist" action="create">
          <Button type="primary" onClick={() => setOpen(true)}>
            新增
          </Button>
        </CanAccess>
      )}
    >
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="id" title="ID" width={100} />
        <Table.Column dataIndex="subject_type" title="类型" width={140} />
        <Table.Column dataIndex="subject_id" title="对象ID" width={240} />
        <Table.Column
          dataIndex="status"
          title="状态"
          width={120}
          render={(v: string) => {
            const s = String(v || '')
            const color = s === 'active' ? 'red' : 'default'
            return <Tag color={color}>{s || '-'}</Tag>
          }}
        />
        <Table.Column dataIndex="reason" title="原因" />
        <Table.Column dataIndex="created_at" title="时间" width={210} />
      </Table>

      <Modal
        open={open}
        title="新增黑名单"
        okText="提交"
        cancelText="取消"
        confirmLoading={mutation.isPending}
        onOk={create}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ subject_type: 'global_user' }}>
          <Form.Item name="subject_type" label="subject_type" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subject_id" label="subject_id" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  )
}
