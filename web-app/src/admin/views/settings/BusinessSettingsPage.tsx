import { PageContainer } from '@ant-design/pro-components'
import { useCustom, useCustomMutation } from '@refinedev/core'
import { Alert, Button, Card, Form, InputNumber, Select, Space } from 'antd'
import { useEffect } from 'react'

type BusinessSettings = {
  points_per_usd: number
  claw_cost_points: number
  recycle_ratio: number
  recycle_locked_ratio: number
  recycle_cashable_ratio: number
  withdraw_min_points: number
  withdraw_fee_ratio: number
  reward_mode: 'low' | 'normal' | 'boost'
  legendary_rate: number
}

const defaultValues: BusinessSettings = {
  points_per_usd: 2,
  claw_cost_points: 3,
  recycle_ratio: 0.8,
  recycle_locked_ratio: 0.6,
  recycle_cashable_ratio: 0.4,
  withdraw_min_points: 20,
  withdraw_fee_ratio: 0.05,
  reward_mode: 'normal',
  legendary_rate: 0.05,
}

export function BusinessSettingsPage() {
  const [form] = Form.useForm<BusinessSettings>()
  const { query, result } = useCustom<BusinessSettings>({
    url: '/settings/business',
    method: 'get',
    queryOptions: {
      retry: false,
    },
  })

  useEffect(() => {
    if (!result.data) return
    form.setFieldsValue({ ...defaultValues, ...result.data })
  }, [form, result.data])

  const { mutate, mutation } = useCustomMutation()

  return (
    <PageContainer title="业务参数配置">
      {query.error ? (
        <Alert type="warning" showIcon message="接口未接入或不可用" description={String((query.error as any)?.message || '')} />
      ) : null}
      <Card loading={query.isPending} style={{ marginTop: 12 }}>
        <Form form={form} layout="vertical" initialValues={result.data ? { ...defaultValues, ...result.data } : defaultValues}>
          <Form.Item label="1 美元 = 积分" name="points_per_usd" rules={[{ required: true }]}> 
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="抽奖一次消耗积分" name="claw_cost_points" rules={[{ required: true }]}> 
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="回收比例" name="recycle_ratio" rules={[{ required: true }]}> 
            <InputNumber min={0} max={1} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="回收拆分：locked 比例" name="recycle_locked_ratio" rules={[{ required: true }]}> 
            <InputNumber min={0} max={1} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="回收拆分：cashable 比例" name="recycle_cashable_ratio" rules={[{ required: true }]}> 
            <InputNumber min={0} max={1} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="提现门槛（积分）" name="withdraw_min_points" rules={[{ required: true }]}> 
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="提现手续费比例" name="withdraw_fee_ratio" rules={[{ required: true }]}> 
            <InputNumber min={0} max={1} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="奖励模式" name="reward_mode" rules={[{ required: true }]}> 
            <Select
              options={[
                { value: 'low', label: 'low' },
                { value: 'normal', label: 'normal' },
                { value: 'boost', label: 'boost' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Legendary 概率" name="legendary_rate" rules={[{ required: true }]}> 
            <InputNumber min={0} max={1} step={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              loading={mutation.isPending}
              onClick={() => {
                form
                  .validateFields()
                  .then((values) => {
                    mutate({ url: '/settings/business', method: 'put', values })
                  })
                  .catch(() => {})
              }}
            >
              保存
            </Button>
            <Button onClick={() => form.setFieldsValue(defaultValues)}>重置为默认</Button>
          </Space>
        </Form>
      </Card>
    </PageContainer>
  )
}
