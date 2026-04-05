import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import { Refine } from '@refinedev/core'
import routerProvider from '@refinedev/react-router'
import { AdminRoutes } from './routes/AdminRoutes'
import { authProvider } from './providers/authProvider'
import { accessControlProvider } from './providers/accessControlProvider'
import { dataProvider } from './providers/dataProvider'
import { resourcesResolved } from './resources/resources'
import { applySeo } from '../seo.js'

import 'antd/dist/reset.css'

export default function AdminApp() {
  useEffect(() => {
    applySeo({
      title: 'RainbowPaw Admin | 管理后台',
      description: 'RainbowPaw 管理后台：运营配置、订单、商家与风控管理。',
      robots: 'noindex, nofollow',
      canonicalPath: '/console/',
      ogType: 'website',
      ogImagePath: '/logo.png',
    })
  }, [])

  return (
    <ConfigProvider>
      <AntdApp>
        <Refine
          routerProvider={routerProvider}
          authProvider={authProvider}
          accessControlProvider={accessControlProvider}
          dataProvider={dataProvider}
          resources={resourcesResolved}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            projectId: 'rainbowpaw-admin',
            disableTelemetry: true,
          }}
        >
          <AdminRoutes />
        </Refine>
      </AntdApp>
    </ConfigProvider>
  )
}
