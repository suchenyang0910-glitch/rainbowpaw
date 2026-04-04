import { PageContainer } from '@ant-design/pro-components'
import { CanAccess, useCustom, useCustomMutation } from '@refinedev/core'
import { Alert, Button, Card, Col, Descriptions, Form, Input, Modal, Row, Space, Tag, Typography, message } from 'antd'
import { useMemo } from 'react'

export function AiOpsPage() {
  const { result: cfgResult } = useCustom({ url: '/ai/config', method: 'get' } as any)
  const { result, query } = useCustom({ url: '/ai/ops/daily', method: 'get' } as any)
  const daily = useMemo(() => (result as any)?.data || null, [result])
  const cfg = useMemo(() => (cfgResult as any)?.data || {}, [cfgResult])
  const { mutateAsync, mutation } = useCustomMutation()
  const [form] = Form.useForm()

  const generate = async () => {
    const v = await form.validateFields()
    await mutateAsync({ url: '/ai/ops/daily', method: 'post', values: v })
    message.success('已生成')
    await query.refetch()
  }

  const publish = async () => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认发布 AI 建议？',
        content: '将把当前建议发布为可被运营/系统引用的版本（开发模式为本地记录）。',
        okText: '发布',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    await mutateAsync({ url: '/ai/ops/publish', method: 'post', values: { title: 'AI 日报建议发布', daily } })
    message.success('已发布')
  }

  const smoke = async () => {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '执行冒烟测试？',
        content: '将对 AI 中枢关键接口做一次标准化健康检查。',
        okText: '执行',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!ok) return
    const res = await mutateAsync({ url: '/ai/ops/smoke', method: 'post', values: {} })
    message.success(`冒烟结果：${String((res as any)?.data?.status || 'unknown')}`)
  }

  return (
    <PageContainer title={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {cfg && cfg.ai_orchestrator_url_set === false && (
          <Alert
            type="warning"
            showIcon
            message="AI 未配置"
            description="未设置 AI_ORCHESTRATOR_SERVICE_URL，AI 能力将降级为 stub。"
          />
        )}
        <Alert
          type="info"
          showIcon
          message="AI 运营职责"
          description="生成日报建议、活动建议与召回建议；发布需二次确认；不允许修改密钥与环境认证。"
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Card title="生成" loading={query.isFetching}>
              <Form form={form} layout="vertical" initialValues={{ focus: '' }}>
                <Form.Item name="focus" label="今日重点（可选）">
                  <Input placeholder="例如：提高 claw→RainbowPaw 转化" />
                </Form.Item>
                <Space>
                  <CanAccess resource="aiOps" action="generate">
                    <Button type="primary" loading={mutation.isPending} onClick={generate}>
                      生成建议
                    </Button>
                  </CanAccess>
                  <CanAccess resource="aiOps" action="publish">
                    <Button loading={mutation.isPending} onClick={publish}>
                      发布
                    </Button>
                  </CanAccess>
                  <CanAccess resource="aiOps" action="runSmoke">
                    <Button loading={mutation.isPending} onClick={smoke}>
                      冒烟测试
                    </Button>
                  </CanAccess>
                  <Button onClick={() => query.refetch()}>刷新</Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card title="今日 AI 建议" loading={query.isFetching}>
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="生成时间">{daily?.generated_at || '-'}</Descriptions.Item>
                <Descriptions.Item label="模型">
                  <Tag>{String(daily?.model_hint || '-')}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="概览">
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{String(daily?.summary || '-')}</Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="问题清单">
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(Array.isArray(daily?.issues) ? daily.issues : []).map((x: any, i: number) => (
                      <Typography.Text key={i}>- {String(x)}</Typography.Text>
                    ))}
                    {(!daily?.issues || !daily?.issues?.length) && <Typography.Text type="secondary">-</Typography.Text>}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="奖池建议">
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{String(daily?.pool_suggestion || '-')}</Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="召回建议">
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{String(daily?.reactivation_suggestion || '-')}</Typography.Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Space>
    </PageContainer>
  )
}
