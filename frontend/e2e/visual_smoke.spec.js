import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const artifacts = path.resolve(process.cwd(), '..', 'artifacts')
fs.mkdirSync(artifacts, { recursive: true })

async function login(page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').fill('usuario@exemple.com')
  await page.getByLabel('Senha').fill('senha-segura')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Que dia você começou a namorar com teu dengo?',
    }),
  ).toBeVisible()
  await page.getByLabel('Nosso namoro começou em').fill('2024-06-26')
  await page.getByRole('button', { name: 'Guardar nosso dia' }).click()
  await expect(page.getByText('Nossa jornada', { exact: false })).toBeVisible()
}

async function expectNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasOverflow).toBe(false)
}

function watchPageErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('cria e compartilha um convite carinhoso pelo WhatsApp', async ({ page }) => {
  await page.goto('/?invite=ABC123')
  await page.getByRole('button', { name: 'Criar agora' }).click()
  await page.getByLabel('Como podemos chamar você?').fill('Kawã')
  await page.getByLabel('E-mail').fill('usuario@exemplo.com')
  await page.getByLabel('Senha').fill('senha-segura')
  await page.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page.getByLabel('Código do convite')).toHaveValue('ABC123')
  await expect(
    page.getByText('Crie um código curto e envie para o seu dengo.'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Criar convite' }).click()
  await expect(page.getByText('DENGO2', { exact: true })).toBeVisible()

  const whatsappLink = page.getByRole('link', {
    name: 'Enviar convite pelo WhatsApp',
  })
  const href = await whatsappLink.getAttribute('href')
  const message = new URL(href).searchParams.get('text')

  expect(message).toContain('Entra comigo no Denguinho? 💛')
  expect(message).toContain('Use o código DENGO2')
  expect(message).toContain('/?invite=DENGO2')

  expect(await findSmallTouchTargets(page)).toEqual([])
  await expectNoHorizontalOverflow(page)
  await page.screenshot({
    path: path.join(artifacts, 'invite-share-desktop.png'),
    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await findSmallTouchTargets(page)).toEqual([])
  await expectNoHorizontalOverflow(page)
  await page.screenshot({
    path: path.join(artifacts, 'invite-share-mobile.png'),
    fullPage: true,
  })
})

async function findSmallTouchTargets(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('button, label.button'))
      .map((control) => {
        const rect = control.getBoundingClientRect()
        return {
          name:
            control.getAttribute('aria-label') ||
            control.innerText.trim().replace(/\s+/g, ' '),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      })
      .filter(
        ({ width, height }) =>
          width > 0 && height > 0 && (width < 44 || height < 44),
      ),
  )
}

test('dashboard e fluxos principais no desktop', async ({ page }) => {
  const errors = watchPageErrors(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await login(page)

  await expect(page.getByText('Rilary & Kawã', { exact: true })).toBeVisible()
  await expect(page.getByText('Boa tarde, meu denguinho.')).toBeVisible()
  await expect(page.getByText('Vamos começar?')).toBeVisible()
  await expect(
    page.getByText('Planejar, executar e concluir — juntos.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Rilary, empatou. O próximo avanço decide quem provoca quem.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText('Semana 5 de 5', { exact: true })).toBeVisible()
  await expect(page.getByText('Agora no Denguinho', { exact: true })).toBeVisible()
  await expect(page.locator('.brand-mark-image')).toBeVisible()
  await expect(page.locator('.brand-mark-image')).toHaveAttribute(
    'src',
    '/denguinho-icon.png?v=2',
  )
  await expectNoHorizontalOverflow(page)

  await page.screenshot({
    path: path.join(artifacts, 'dashboard-desktop.png'),
    fullPage: true,
  })

  await page.getByRole('button', { name: 'Preciso de dengo' }).click()
  await expect(
    page.getByRole('heading', { name: 'Tô precisando de dengo, não vê?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Um cheiro' }).click()
  await page.getByRole('button', { name: 'Avisar meu dengo' }).click()
  await expect(page.getByText('Rilary recebeu uma notificação.')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await page.getByRole('button', { name: 'Notificações', exact: true }).click()
  const notifications = page.getByRole('dialog', { name: 'Notificações' })
  await notifications.getByRole('button', { name: 'Tô indo', exact: true }).click()
  await expect(notifications.getByText('Rilary respondeu')).toBeVisible()
  await notifications.getByRole('button', { name: 'Coração' }).click()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await expect(page.getByText('Rilary respondeu', { exact: true })).toBeVisible()
  await expect(page.getByText('Tô indo', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Ver todos' }).click()
  const challenges = page.getByRole('dialog', { name: 'Todos os desafios' })
  await expect(challenges).toBeVisible()
  await expect(challenges.getByText('Kawã', { exact: true })).toBeVisible()
  await expect(challenges.getByText('Rilary', { exact: true })).toBeVisible()
  await expect(challenges.getByText('0 pts', { exact: true })).toHaveCount(3)
  await expect(
    challenges.getByRole('heading', { name: 'Nenhum desafio por aqui ainda.' }),
  ).toBeVisible()
  await expect(challenges.getByText('Escolha o tipo', { exact: true })).toBeVisible()
  await expect(challenges.getByText('Defina uma meta', { exact: true })).toBeVisible()
  await expect(challenges.getByText('Registre os avanços', { exact: true })).toBeVisible()
  await challenges.getByRole('tab', { name: 'Em casal' }).click()
  await challenges.getByRole('button', { name: 'Criar primeiro desafio' }).click()
  await challenges.getByLabel('Nome do desafio').fill('Planejar um encontro')
  await challenges.getByLabel('Qual é a meta?').fill('3')
  await challenges.getByRole('button', { name: 'Adicionar desafio' }).click()
  await expect(
    challenges.getByRole('heading', { name: 'Planejar um encontro' }),
  ).toBeVisible()
  await challenges.getByRole('button', { name: 'Abrir Planejar um encontro' }).click()
  const createdChallengeDetails = page.getByRole('dialog', {
    name: 'Planejar um encontro',
  })
  await createdChallengeDetails.getByRole('button', { name: 'Editar desafio' }).click()
  await createdChallengeDetails
    .getByLabel('Nome do desafio')
    .fill('Planejar encontro surpresa')
  await createdChallengeDetails.getByLabel('Categoria').selectOption('Lazer')
  await createdChallengeDetails.getByLabel('Meta total').fill('5')
  await page.screenshot({
    path: path.join(artifacts, 'challenge-edit-desktop.png'),
    fullPage: true,
  })
  await createdChallengeDetails.getByRole('button', { name: 'Salvar alterações' }).click()
  const editedChallengeDetails = page.getByRole('dialog', {
    name: 'Planejar encontro surpresa',
  })
  await expect(editedChallengeDetails).toBeVisible()
  await editedChallengeDetails
    .getByRole('button', { name: 'Excluir Planejar encontro surpresa' })
    .click()
  await expect(
    editedChallengeDetails.getByText('Excluir “Planejar encontro surpresa”?'),
  ).toBeVisible()
  await editedChallengeDetails
    .getByRole('button', { name: 'Excluir desafio' })
    .click()
  await expect(editedChallengeDetails).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Planejar encontro surpresa' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Nenhum desafio por aqui ainda.' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  const settings = page.getByRole('dialog', { name: 'Configurações' })
  await expect(settings).toBeVisible()
  await expect(settings.getByLabel('Posição horizontal da foto')).toHaveCount(0)
  await expect(settings.getByLabel('Posição vertical da foto')).toHaveCount(0)
  await settings.getByRole('button', { name: 'Ajustar foto' }).click()
  await expect(settings.getByLabel('Posição horizontal da foto')).toBeVisible()
  await expect(settings.getByLabel('Posição vertical da foto')).toBeVisible()
  await settings.getByRole('button', { name: 'Concluir ajuste' }).click()
  await expect(settings.getByLabel('Posição horizontal da foto')).toHaveCount(0)
  await settings
    .locator('input[type="file"]')
    .setInputFiles(path.resolve(process.cwd(), 'public', 'journey-fallback.png'))
  await expect(settings.getByLabel('Posição horizontal da foto')).toBeVisible()
  await settings.getByRole('button', { name: 'Concluir ajuste' }).click()
  await expect(
    settings.getByLabel('Que dia você começou a namorar com teu dengo?'),
  ).toHaveValue('2024-06-26')
  await settings.getByRole('tab', { name: 'Aplicativo' }).click()
  await expect(settings.getByRole('switch', { name: 'Mostrar placar' })).toBeChecked()
  await settings.getByRole('switch', { name: 'Mostrar placar' }).click()
  await expect(page.getByText('Semana 5 de 5', { exact: true })).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('denguinho-preferences-v1')).showScore,
      ),
    )
    .toBe(false)
  await settings.getByRole('switch', { name: 'Reduzir animações' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true')
  await settings.getByRole('button', { name: 'Escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('denguinho-theme-v1')))
    .toBe('dark')
  await page.screenshot({
    path: path.join(artifacts, 'settings-app-desktop.png'),
    fullPage: true,
  })
  await page.reload()
  await expect(page.getByText('Nossa jornada', { exact: false })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.getByRole('heading', { name: 'Nenhum desafio por aqui ainda.' }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({
    path: path.join(artifacts, 'dashboard-dark.png'),
    fullPage: true,
  })

  expect(errors).toEqual([])
})

test('navegação, toque e conta no celular', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const errors = watchPageErrors(page)
  await login(page)

  await expect(page.getByText('Rilary & Kawã', { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)

  expect(await findSmallTouchTargets(page)).toEqual([])

  await page.screenshot({
    path: path.join(artifacts, 'dashboard-mobile.png'),
    fullPage: true,
  })

  await page.getByRole('button', { name: 'Agenda', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Agenda do casal' })).toBeVisible()
  await expect(
    page.getByText('Todo dia 26, mais um mês da história de vocês.'),
  ).toBeVisible()
  await expect(page.getByText('0 eventos', { exact: true })).toBeVisible()
  await expect(
    page.getByText('A agenda está livre. Qual vai ser o primeiro rolê?'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Novo evento' }).click()
  await page.getByLabel('O que vocês vão fazer?').fill('Dia de praia')
  await page.getByLabel('Vai se repetir?').selectOption('NONE')
  await page.getByRole('button', { name: 'Adicionar à agenda' }).click()
  await page.getByRole('button', { name: 'Editar Dia de praia' }).click()
  await page.getByLabel('O que vocês vão fazer?').fill('Dia de praia e pôr do sol')
  await page.getByLabel('Vai se repetir?').selectOption('MONTHLY')
  await page.getByRole('button', { name: 'Salvar evento' }).click()
  await expect(page.getByRole('heading', { name: 'Dia de praia e pôr do sol' })).toBeVisible()

  await page.getByRole('button', { name: 'Excluir Dia de praia e pôr do sol' }).click()
  const deleteConfirmation = page.getByRole('alert')
  await expect(
    deleteConfirmation.getByText('Excluir “Dia de praia e pôr do sol”?'),
  ).toBeVisible()
  await page.screenshot({
    path: path.join(artifacts, 'events-manage-mobile.png'),
    fullPage: false,
  })
  await deleteConfirmation.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dia de praia e pôr do sol' })).toHaveCount(0)
  await expect(page.getByText('0 eventos', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await page.getByRole('button', { name: 'Desafios', exact: true }).click()
  const mobileChallenges = page.getByRole('dialog', { name: 'Todos os desafios' })
  await expect(
    mobileChallenges.getByRole('heading', { name: 'Nenhum desafio por aqui ainda.' }),
  ).toBeVisible()
  await mobileChallenges.getByRole('button', { name: 'Criar primeiro desafio' }).click()
  await mobileChallenges.getByLabel('Nome do desafio').fill('Ler juntos')
  await mobileChallenges.getByLabel('Qual é a meta?').fill('2')
  await mobileChallenges.getByRole('button', { name: 'Adicionar desafio' }).click()
  await mobileChallenges
    .getByRole('button', { name: 'Abrir Ler juntos' })
    .click()
  const mobileChallengeDetails = page.getByRole('dialog', {
    name: 'Ler juntos',
  })
  const mobileDeleteChallenge = mobileChallengeDetails.getByRole('button', {
    name: 'Excluir Ler juntos',
  })
  await expect(mobileDeleteChallenge).toBeVisible()
  await mobileDeleteChallenge.click()
  await expect(
    mobileChallengeDetails.getByText('Excluir “Ler juntos”?'),
  ).toBeVisible()
  await page.screenshot({
    path: path.join(artifacts, 'challenge-delete-mobile.png'),
    fullPage: false,
  })
  await mobileChallengeDetails.getByRole('button', { name: 'Cancelar' }).click()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await page.getByRole('button', { name: /Minha conta/ }).click()
  const account = page.getByRole('dialog', { name: 'Minha conta' })
  await expect(account.getByLabel('Seu nome')).toHaveValue('Kawã')
  await expect(account.getByLabel('E-mail', { exact: false })).toHaveValue(
    'usuario@exemple.com',
  )
  await expect(account.getByText('Receber por e-mail')).toHaveCount(0)
  const passwordButton = account.getByRole('button', {
    name: 'Esqueci minha senha',
    exact: true,
  })
  await expect(passwordButton).toBeVisible()
  await passwordButton.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: path.join(artifacts, 'account-password-collapsed-mobile.png'),
    fullPage: true,
  })
  await passwordButton.click()
  await expect(account.getByText('Receber por e-mail')).toBeVisible()
  await expect(account.getByText('usuario@exemple.com', { exact: false })).toBeVisible()
  await account.getByRole('button', { name: 'Enviar instruções' }).click()
  await expect(
    account.getByText('Instruções enviadas para usuario@exemple.com.'),
  ).toBeVisible()
  await expect(account.locator('input[type="file"]')).toHaveCount(1)
  expect(await findSmallTouchTargets(page)).toEqual([])
  await page.screenshot({
    path: path.join(artifacts, 'account-password-expanded-mobile.png'),
    fullPage: true,
  })
  await account.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(account.getByText('Receber por e-mail')).toHaveCount(0)
  await page.getByRole('button', { name: 'Fechar minha conta' }).click()

  await page.getByRole('button', { name: 'Foco', exact: true }).click()
  const focusPanel = page.getByRole('dialog', { name: 'Preparar foco juntos' })
  await focusPanel.getByLabel('No que vocês vão focar?').fill('Planejar a semana')
  await focusPanel.getByRole('button', { name: 'Começar juntos' }).click()
  await expect(focusPanel.getByText('Rilary está nessa com você')).toBeVisible()
  await focusPanel.getByRole('button', { name: 'Pausar' }).click()
  await expect(focusPanel.getByRole('button', { name: 'Continuar' })).toBeVisible()
  await focusPanel.getByRole('button', { name: 'Continuar' }).click()
  await focusPanel.getByRole('button', { name: 'Concluir' }).click()
  await expect(focusPanel.getByText('+25 pontos para o casal')).toBeVisible()
  await focusPanel.getByRole('button', { name: 'Focado' }).click()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await page.getByRole('button', { name: /Retrospectiva/ }).click()
  await expect(page.getByRole('heading', { name: 'Retrospectiva' })).toBeVisible()
  await expect(page.getByText('Resumo da semana')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await page.getByRole('button', { name: 'Mais', exact: true }).click()
  await page.getByRole('button', { name: /Surpresa do mês/ }).click()
  const surprise = page.getByRole('dialog', { name: 'Surpresa do mês' })
  await surprise.getByRole('button', { name: 'Topamos essa' }).click()
  await expect(surprise.getByText('Combinado guardado')).toBeVisible()
  await surprise.getByRole('button', { name: 'Já fizemos' }).click()
  await expect(surprise.getByText('Feito 💛')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await page.screenshot({
    path: path.join(artifacts, 'dashboard-dynamic-mobile.png'),
    fullPage: true,
  })

  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  const settings = page.getByRole('dialog', { name: 'Configurações' })
  await settings.getByRole('tab', { name: 'Aplicativo' }).click()
  await settings.getByRole('button', { name: 'Escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await settings.evaluate((panel) => {
    panel.scrollTop = 0
  })
  await page.screenshot({
    path: path.join(artifacts, 'settings-app-mobile.png'),
    fullPage: false,
  })
  await page.getByRole('button', { name: 'Fechar configurações' }).click()
  await expectNoHorizontalOverflow(page)
  expect(await findSmallTouchTargets(page)).toEqual([])
  await page.screenshot({
    path: path.join(artifacts, 'dashboard-mobile-dark.png'),
    fullPage: true,
  })

  expect(errors).toEqual([])
  await context.close()
})
