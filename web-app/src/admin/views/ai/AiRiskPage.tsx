import { PageContainer } from '@ant-design/pro-components'
import { CanAccess, useCustomMutation } from '@refinedev/core'
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { useState } from 'react'

export function AiRiskPage() {
  const { mutateAsync, mutation } = useCustomMutation()
  const [out, setOut] = useState<any | null>(null)
  const [form] = Form.useForm()

  const summarize = async () => {
    const v = await form.validateFields()
    const res = await mutateAsync({ url: '/ai/risk/summarize', method: 'post', values: v })
    setOut((res as any)?.data || null)
    message.success('已生成摘要')
  }

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="AI 风控职责"
          description="基于报表/提现/行为数据生成风险原因摘要与建议动作；冻结/解冻属于强操作，需额外按钮权限与审计。"
        />

        <Card title="生成风控摘要">
          <Form form={form} layout="vertical" initialValues={{ global_user_id: '' }}>
            <Form.Item name="global_user_id" label="Global User ID（可选）">
              <Input placeholder="例如：g_xxx" />
            </Form.Item>
            <CanAccess resource="aiRisk" action="summarize">
              <Button type="primary" loading={mutation.isPending} onClick={summarize}>
                生成摘要
              </Button>
            </CanAccess>
          </Form>
        </Card>

        <Card title="摘要结果">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            模型：{String(out?.model_hint || '-')}
          </Typography.Paragraph>
          <Typography.Paragraph style={{ marginBottom: 8 }}>{out?.summary ? String(out.summary) : '暂无'}</Typography.Paragraph>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
            {Array.isArray(out?.suggested_actions) ? out.suggested_actions.map((x: any) => `- ${String(x)}`).join('\n') : ''}
          </Typography.Paragraph>
        </Card>
      </Space>
    </PageContainer>
  )
}

