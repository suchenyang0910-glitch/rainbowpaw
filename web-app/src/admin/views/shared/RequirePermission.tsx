import { useCan } from '@refinedev/core'
import type { ReactNode } from 'react'
import { Result, Spin } from 'antd'

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { data, isLoading } = useCan({ resource: 'permission', action: 'use', params: { permission } })

  if (isLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <Spin />
      </div>
    )
  }

  if (!data?.can) {
    return <Result status="403" title="403" subTitle="无权限访问" />
  }

  return <>{children}</>
}

