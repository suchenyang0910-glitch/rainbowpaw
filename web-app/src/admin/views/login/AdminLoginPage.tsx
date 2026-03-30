import { PageContainer } from '@ant-design/pro-components'
import { Button, Card, Form, Select, Typography } from 'antd'
import { useLogin } from '@refinedev/core'
import type { AdminRole } from '../../providers/adminSession'

const roles: Array<{ value: AdminRole; label: string }> = [
  { value: 'super_admin', label: 'super_admin' },
  { value: 'ops_manager', label: 'ops_manager' },
  { value: 'finance_manager', label: 'finance_manager' },
  { value: 'merchant', label: 'merchant' },
  { value: 'customer_service', label: 'customer_service' },
]

export function AdminLoginPage() {
  const { mutate: login, isPending } = useLogin<{ role: AdminRole }>()

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <PageContainer title={false}>
        <Card style={{ width: 420, borderRadius: 16 }}>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            管理后台登录
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            当前为开发模式登录：选择角色后进入后台。
          </Typography.Paragraph>

          <Form
            layout="vertical"
            initialValues={{ role: 'super_admin' }}
            onFinish={(values: { role: AdminRole }) => login({ role: values.role })}
          >
            <Form.Item label="角色" name="role" rules={[{ required: true }]}> 
              <Select options={roles} />
            </Form.Item>
            <Button htmlType="submit" type="primary" block loading={isPending}>
              登录
            </Button>
          </Form>
        </Card>
      </PageContainer>
    </div>
  )
}
