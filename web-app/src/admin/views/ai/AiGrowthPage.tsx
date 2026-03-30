import { PageContainer } from '@ant-design/pro-components'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Alert, Button, Card, Form, Input, Select, Space, Typography, message } from 'antd'
import { useState } from 'react'

export function AiGrowthPage() {
  const { mutateAsync, mutation } = useCustomMutation()
  const [out, setOut] = useState<any | null>(null)
  const [form] = Form.useForm()

  const generate = async () => {
    const v = await form.validateFields()
    const res = await mutateAsync({ url: '/ai/growth/generate', method: 'post', values: v })
    setOut((res as any)?.data || null)
    message.success('已生成')
  }

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert type="info" showIcon message="AI 文案职责" description="为活动/召回/拼团生成多版本文案或短视频脚本，支持复用模板与审计。" />

        <Card title="生成文案">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ kind: 'push', topic: '拼团召回', tone: 'warm' }}
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
      </Space>
    </PageContainer>
  )
}

