import { PageContainer } from '@ant-design/pro-components'
import type { DataNode } from 'antd/es/tree'
import { Alert, Button, Card, Select, Space, Tree, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import type { AdminRole, PermissionCode } from '../../providers/adminSession'
import {
  buildSession,
  loadRolePermissionsOverride,
  saveRolePermissionsOverride,
  getDefaultRolePermissions,
  getRolePermissions,
  saveSession,
  loadSession,
} from '../../providers/adminSession'
import { resources } from '../../resources/resources'

const roleOptions: Array<{ value: AdminRole; label: string }> = [
  { value: 'super_admin', label: 'super_admin' },
  { value: 'ops_manager', label: 'ops_manager' },
  { value: 'finance_manager', label: 'finance_manager' },
  { value: 'merchant', label: 'merchant' },
  { value: 'customer_service', label: 'customer_service' },
]

function uniqSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function buildPermissionCatalog(): { menus: PermissionCode[]; pages: PermissionCode[]; buttons: PermissionCode[] } {
  const menus: string[] = []
  const pages: string[] = []
  const buttons: string[] = []

  for (const r of resources) {
    const name = String(r.name)
    if (!r.meta?.parent) menus.push(`menu.${name}`)
    pages.push(`page.${name}.list`)
    if ((r as any).show) pages.push(`page.${name}.show`)
    if ((r as any).create) pages.push(`page.${name}.create`)
    if ((r as any).edit) pages.push(`page.${name}.edit`)
  }

  const override = loadRolePermissionsOverride()
  const fromRoles: string[] = []
  for (const role of roleOptions) {
    fromRoles.push(...getDefaultRolePermissions(role.value))
    const ov = override[role.value]
    if (Array.isArray(ov)) fromRoles.push(...ov)
  }

  for (const code of fromRoles) {
    if (code === '*') continue
    if (code.startsWith('menu.')) menus.push(code)
    else if (code.startsWith('page.')) pages.push(code)
    else if (code.startsWith('button.')) buttons.push(code)
  }

  return {
    menus: uniqSorted(menus),
    pages: uniqSorted(pages),
    buttons: uniqSorted(buttons),
  }
}

function toTree(title: string, codes: string[]): DataNode {
  return {
    key: title,
    title,
    selectable: false,
    children: codes.map((c) => ({ key: c, title: c, selectable: false })),
  }
}

export function RolesPage() {
  const current = loadSession()
  const [role, setRole] = useState<AdminRole>((current?.role as AdminRole) || 'super_admin')
  const catalog = useMemo(() => buildPermissionCatalog(), [])

  const [checked, setChecked] = useState<PermissionCode[]>(() => {
    const list = getRolePermissions(role)
    return Array.isArray(list) ? list : []
  })

  const treeData = useMemo<DataNode[]>(
    () => [toTree('Menu', catalog.menus), toTree('Pages', catalog.pages), toTree('Buttons', catalog.buttons)],
    [catalog],
  )

  const onRoleChange = (next: AdminRole) => {
    setRole(next)
    setChecked(getRolePermissions(next))
  }

  const save = () => {
    const next = loadRolePermissionsOverride()
    next[role] = checked
    saveRolePermissionsOverride(next)
    message.success('已保存权限配置')
  }

  const resetToDefault = () => {
    const defaults = getDefaultRolePermissions(role)
    setChecked(defaults)
    const next = loadRolePermissionsOverride()
    delete (next as any)[role]
    saveRolePermissionsOverride(next)
    message.success('已恢复默认权限')
  }

  const applyToSession = () => {
    const nextSession = buildSession(role)
    saveSession(nextSession)
    message.success('已应用到当前会话，正在刷新…')
    window.location.reload()
  }

  const canEdit = role !== 'super_admin'

  return (
    <PageContainer title={false}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Space>
              <Typography.Text strong>角色</Typography.Text>
              <Select value={role} onChange={onRoleChange} style={{ width: 220 }} options={roleOptions} />
            </Space>
            <Space>
              <Button onClick={applyToSession}>应用到当前会话</Button>
              <Button onClick={resetToDefault} disabled={role === 'super_admin'}>
                恢复默认
              </Button>
              <Button type="primary" onClick={save} disabled={role === 'super_admin'}>
                保存
              </Button>
            </Space>
          </div>

          {role === 'super_admin' ? (
            <Alert
              type="info"
              showIcon
              message="super_admin 为全权限"
              description="当前实现中 super_admin 使用 '*'，无需维护细粒度权限。"
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              message="开发模式权限配置"
              description="当前权限配置保存在浏览器 localStorage，仅用于开发联调。后续可切换为后端 roles-service 持久化。"
            />
          )}

          <Tree
            checkable
            selectable={false}
            treeData={treeData}
            checkedKeys={checked}
            onCheck={(keys) => setChecked(keys as string[])}
            defaultExpandAll
            disabled={!canEdit}
          />
        </Space>
      </Card>
    </PageContainer>
  )
}

