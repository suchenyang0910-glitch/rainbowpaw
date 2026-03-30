import { App as AntdApp, ConfigProvider } from 'antd'
import { Refine } from '@refinedev/core'
import routerProvider from '@refinedev/react-router'
import { AdminRoutes } from './routes/AdminRoutes'
import { authProvider } from './providers/authProvider'
import { accessControlProvider } from './providers/accessControlProvider'
import { dataProvider } from './providers/dataProvider'
import { resourcesResolved } from './resources/resources'

import 'antd/dist/reset.css'

export default function AdminApp() {
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
          }}
        >
          <AdminRoutes />
        </Refine>
      </AntdApp>
    </ConfigProvider>
  )
}
