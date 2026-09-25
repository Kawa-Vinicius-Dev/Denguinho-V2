import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const artifacts = path.resolve(process.cwd(), '..', 'artifacts')
fs.mkdirSync(artifacts, { recursive: true })

// Build de produção servido pelo `npm run preview:e2e` (ver playwright.config.js).
const PRODUCTION_BUILD = 'http://127.0.0.1:4317'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }

async function login(page, baseURL = '') {
  await page.goto(`${baseURL}/`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').fill('usuario@exemple.com')
  await page.getByLabel('Senha', { exact: true }).fill('senha-segura')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('Nosso namoro começou em').fill('2024-06-26')
  await page.getByRole('button', { name: 'Guardar nosso dia' }).click()
  await expect(page.getByText('Nossa jornada', { exact: false })).toBeVisible()
}

async function findSmallTouchTargets(locator) {
  return locator.evaluate((root) =>
    Array.from(root.querySelectorAll('button'))
      .map((control) => {
        const { width, height } = control.getBoundingClientRect()
        return {
          name: control.getAttribute('aria-label') || control.innerText.trim(),
          width: Math.round(width),
          height: Math.round(height),
        }
      })
      .filter(({ width, height }) => width > 0 && height > 0 && (width < 44 || height < 44)),
  )
}

// Simula o evento que o Chrome do Android dispara quando o site pode ser instalado.
async function offerInstall(page) {
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = async () => {
      window.__installPrompted = true
    }
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(event)
  })
}

test('o build de produção é instalável e abre sem internet', async ({ page, context }) => {
  await page.goto(`${PRODUCTION_BUILD}/`)
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  )

  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)

  // O próprio Chromium confere manifesto, ícones e service worker.
  const cdp = await context.newCDPSession(page)
  const manifest = await cdp.send('Page.getAppManifest')
  expect(manifest.errors).toEqual([])
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
  // Contextos do Playwright são anônimos; fora disso não pode sobrar nenhum problema.
  expect(installabilityErrors.filter(({ errorId }) => errorId !== 'in-incognito')).toEqual([])

  const cached = await page.evaluate(async () => {
    const keys = await caches.keys()
    const requests = await (await caches.open(keys[0])).keys()
    return { keys, paths: requests.map((request) => new URL(request.url).pathname) }
  })
  expect(cached.keys).toHaveLength(1)
  expect(cached.keys[0]).toMatch(/^denguinho-[0-9a-f]{12}$/)
  expect(cached.paths).toEqual(
    expect.arrayContaining(['/index.html', '/manifest.webmanifest', '/icons/maskable-512.png']),
  )

  // Sem internet nenhuma: tudo o que vier da rede falha.
  await context.route('**/*', (route) => route.abort('internetdisconnected'))
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Que bom ter você de volta.' })).toBeVisible()
  await expect(page.locator('.brand-mark-image').first()).toBeVisible()
  expect(
    await page.locator('.brand-mark-image').first().evaluate((image) => image.naturalWidth),
  ).toBe(192)
  await context.setOffline(false)
  await context.unrouteAll()
})

test('no Android, o botão Instalar usa o convite do navegador', async ({ browser }) => {
  const context = await browser.newContext(phone)
  const page = await context.newPage()
  await login(page)

  const card = page.getByRole('region', { name: 'Denguinho na tela inicial' })
  await expect(card).toHaveCount(0)
  await offerInstall(page)
  await expect(card).toBeVisible()
  await expect.poll(() => findSmallTouchTargets(card)).toEqual([])
  await page.screenshot({
    path: path.join(artifacts, 'install-card-android.png'),
    animations: 'disabled',
  })

  await card.getByRole('button', { name: 'Instalar o app' }).click()
  expect(await page.evaluate(() => window.__installPrompted)).toBe(true)
  await expect(page.getByText('Pronto! Procure o Denguinho na tela inicial.')).toBeVisible()
  await expect(card).toHaveCount(0)

  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await expect(page.getByRole('button', { name: /Minha conta/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Instalar o app/ })).toHaveCount(0)
  await context.close()
})

test('no iPhone, o convite mostra os passos do Safari e pode ser dispensado', async ({
  browser,
}) => {
  const context = await browser.newContext({ ...phone, userAgent: IPHONE })
  const page = await context.newPage()
  await login(page)

  const card = page.getByRole('region', { name: 'Denguinho na tela inicial' })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Como instalar' }).click()
  await expect(card.getByRole('list', { name: 'Como instalar no iPhone' })).toBeVisible()
  await expect(card.getByText('Adicionar à Tela de Início')).toBeVisible()
  await expect.poll(() => findSmallTouchTargets(card)).toEqual([])
  await page.screenshot({
    path: path.join(artifacts, 'install-card-iphone.png'),
    animations: 'disabled',
  })

  await card.getByRole('button', { name: 'Agora não' }).click()
  await expect(card).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Nossa jornada', { exact: false })).toBeVisible()
  await expect(card).toHaveCount(0)

  // Depois de dispensar, o caminho continua em Mais > Instalar o app.
  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await page.getByRole('button', { name: /Instalar o app/ }).click()
  const settings = page.getByRole('dialog', { name: 'Configurações' })
  await expect(settings.getByRole('tab', { name: 'Aplicativo' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(settings.getByRole('heading', { name: 'App no celular' })).toBeVisible()
  await expect(settings.getByText('Adicionar à Tela de Início')).toBeVisible()
  await page.screenshot({
    path: path.join(artifacts, 'install-settings-iphone.png'),
    animations: 'disabled',
  })
  await context.close()
})

test('aberto como app instalado, não oferece instalar de novo', async ({ browser }) => {
  const context = await browser.newContext({ ...phone, userAgent: IPHONE })
  await context.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window)
    window.matchMedia = (query) =>
      query === '(display-mode: standalone)'
        ? {
            matches: true,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent: () => false,
          }
        : matchMedia(query)
  })
  const page = await context.newPage()
  await login(page)
  await offerInstall(page)

  await expect(page.getByRole('region', { name: 'Denguinho na tela inicial' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await expect(page.getByRole('button', { name: /Minha conta/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Instalar o app/ })).toHaveCount(0)
  await page.getByRole('button', { name: /Configurações/ }).click()
  const settings = page.getByRole('dialog', { name: 'Configurações' })
  await settings.getByRole('tab', { name: 'Aplicativo' }).click()
  await expect(settings.getByText('Você está usando o Denguinho instalado.')).toBeVisible()
  await context.close()
})
