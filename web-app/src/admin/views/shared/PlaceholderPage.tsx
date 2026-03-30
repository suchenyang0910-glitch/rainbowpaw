import { PageContainer } from '@ant-design/pro-components'
import { Alert, Card } from 'antd'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageContainer title={title}>
      <Card>
        <Alert message="页面骨架已就绪" description="请按 resources 映射补齐具体查询与表格/表单。" type="info" showIcon />
      </Card>
    </PageContainer>
  )
}

