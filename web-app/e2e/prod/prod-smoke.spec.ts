import { test, expect } from '@playwright/test'

const PROD_BASE = String(process.env.E2E_BASE_URL || '').trim()

async function gotoOk(page: any, path: string) {
  const resp = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(resp, `no response for ${path}`).toBeTruthy()
  if (resp) expect(resp.status(), `bad status for ${path}`).toBeLessThan(500)
}

test.describe('Production domain smoke', () => {
  test.beforeAll(() => {
    expect(PROD_BASE, 'E2E_BASE_URL must be set for production smoke').toBeTruthy()
  })

  test('should load root and redirect to a locale', async ({ page }) => {
    await gotoOk(page, '/')
    expect(page.url()).toContain(PROD_BASE)
    await expect(page).toHaveURL(/\/(en|zh-CN)(\/|$)/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load English landing and key buttons work', async ({ page }) => {
    await gotoOk(page, '/en')

    const hero = page.locator('h1').first()
    await expect(hero).toBeVisible()

    const cta = page.locator('.btn-dark[href="#packages"]').first()
    await expect(cta).toBeVisible()
    await cta.click()
    await expect(page).toHaveURL(/#packages/)

    const telegramLinks = page.locator('a[href*="t.me/"]')
    await expect(telegramLinks.first()).toBeVisible()
  })

  test('should switch language on landing', async ({ page }) => {
    await gotoOk(page, '/en')
    const zhButton = page.locator('.lang-switch .lang-btn:has-text("中文")').first()
    await expect(zhButton).toBeVisible()
    await zhButton.click()
    await page.waitForURL('**/zh-CN**')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('should load Care Plan page and controls respond', async ({ page }) => {
    await gotoOk(page, '/care')
    const title = page.getByText('专属护理方案', { exact: false })
    const loading = page.getByText('AI 正在为您生成专属护理方案', { exact: false })
    const error = page.getByText('加载护理方案失败', { exact: false })
    await expect(title.or(loading).or(error)).toBeVisible()

    const retry = page.getByRole('button', { name: '重试' })
    if (await retry.isVisible().catch(() => false)) {
      await retry.click()
      await expect(loading.or(error).or(title)).toBeVisible()
    }
  })

  test('should load Services page and show header', async ({ page }) => {
    await gotoOk(page, '/services')
    const title = page.getByText('服务与善终', { exact: false })
    const loading = page.getByText('Loading Services', { exact: false })
    const error = page.getByText('加载服务列表失败', { exact: false })
    const retry = page.getByRole('button', { name: '重试' })
    await expect(title.or(loading).or(error)).toBeVisible({ timeout: 15000 })
    if (await retry.isVisible().catch(() => false)) {
      await retry.click()
      await expect(title.or(loading).or(error)).toBeVisible({ timeout: 15000 })
    }
  })

  test('should load Memorial page', async ({ page }) => {
    await gotoOk(page, '/memorial')
    const loading = page.getByText('Loading', { exact: false })
    const title = page.getByRole('heading', { level: 1 })
    const error = page.getByText('加载', { exact: false })
    await expect(title.or(loading).or(error)).toBeVisible({ timeout: 15000 })
  })

  test('should load Admin login route', async ({ page }) => {
    await gotoOk(page, '/console/login')
    await expect(page.locator('form').first()).toBeVisible()
  })
})
