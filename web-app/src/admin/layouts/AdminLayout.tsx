import { ProLayout } from '@ant-design/pro-components'
import { Button } from 'antd'
import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGetIdentity, useLogout } from '@refinedev/core'
import { loadSession, hasPermission } from '../providers/adminSession'
import { resourcesResolved } from '../resources/resources'

type MenuItem = {
  path?: string
  name?: string
  icon?: ReactNode
  routes?: MenuItem[]
}

function buildMenu(): MenuItem[] {
  const session = loadSession()
  const all = resourcesResolved.filter((r) => !(r as any)?.meta?.hideInMenu)
  const top = all.filter((r) => Boolean(r.list) && !r.meta?.parent)
  const childrenByParent = new Map<string, any[]>()
  for (const r of all) {
    const parent = r.meta?.parent
    if (!parent) continue
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, [])
    childrenByParent.get(parent)!.push(r)
  }

  const menu: MenuItem[] = []
  for (const r of top) {
    const menuCode = `menu.${r.name}`
    if (!hasPermission(session, menuCode)) continue

    const kids = childrenByParent.get(r.name) || []
    const kidItems: MenuItem[] = kids
      .filter((k) => Boolean(k.list) && hasPermission(session, `page.${k.name}.list`))
      .map((k) => ({ path: String(k.list), name: String(k.meta?.label || k.name) }))

    menu.push({
      path: String(r.list),
      name: String(r.meta?.label || r.name),
      icon: r.meta?.icon as any,
      routes: kidItems.length ? kidItems : undefined,
    })
  }
  return menu
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate: logout } = useLogout()
  const { data: identity } = useGetIdentity()

  const menu = buildMenu()

  return (
    <ProLayout
      title="Admin Console"
      logo={false}
      location={{ pathname: location.pathname }}
      route={{ routes: menu as any }}
      menuItemRender={(item, dom) => {
        if (!item.path) return dom
        return (
          <a
            href={item.path}
            onClick={(e) => {
              e.preventDefault()
              navigate(item.path || '/console/dashboard')
            }}
          >
            {dom}
          </a>
        )
      }}
      avatarProps={{
        title: identity?.name || 'admin',
        size: 'small',
        render: (_props, dom) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dom}
            <Button
              size="small"
              icon={<LogOut size={14} />}
              onClick={() => logout()}
              style={{ borderRadius: 999 }}
            >
              退出
            </Button>
          </div>
        ),
      }}
      layout="mix"
      fixSiderbar
      contentStyle={{ padding: 16 }}
    >
      {children}
    </ProLayout>
  )
}
