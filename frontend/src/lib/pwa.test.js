import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createPwa, installMethod, isIos, isStandalone } from './pwa.js'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'

describe('isIos', () => {
  it('reconhece iPhone e iPad, inclusive o iPad que se apresenta como Mac', () => {
    assert.equal(isIos({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 }), true)
    assert.equal(isIos({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 5 }), true)
  })

  it('não confunde Android nem um Mac de verdade', () => {
    assert.equal(isIos({ userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 }), false)
    assert.equal(isIos({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 0 }), false)
  })
})

describe('isStandalone', () => {
  const windowWith = ({ displayMode = false, iosStandalone } = {}) => ({
    matchMedia: (query) => ({ matches: displayMode && query === '(display-mode: standalone)' }),
    navigator: { standalone: iosStandalone },
  })

  it('percebe quando o site já roda como app instalado', () => {
    assert.equal(isStandalone(windowWith({ displayMode: true })), true)
    assert.equal(isStandalone(windowWith({ iosStandalone: true })), true)
    assert.equal(isStandalone(windowWith()), false)
  })
})

describe('installMethod', () => {
  const base = { standalone: false, installed: false, canPrompt: false, ios: false }

  it('prefere o botão do navegador e cai para os passos do iPhone ou do menu', () => {
    assert.equal(installMethod({ ...base, canPrompt: true }), 'prompt')
    assert.equal(installMethod({ ...base, ios: true }), 'ios')
    assert.equal(installMethod(base), 'manual')
  })

  it('não oferece instalar de novo o que já está instalado', () => {
    assert.equal(installMethod({ ...base, standalone: true, canPrompt: true }), 'installed')
    assert.equal(installMethod({ ...base, installed: true, ios: true }), 'installed')
  })
})

function installPromptEvent(outcome) {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  event.prompted = false
  event.prompt = async () => {
    event.prompted = true
  }
  event.userChoice = Promise.resolve({ outcome, platform: 'web' })
  return event
}

describe('createPwa — instalação', () => {
  it('guarda o convite do navegador e instala com um toque', async () => {
    const win = new EventTarget()
    const pwa = createPwa()
    let changes = 0
    pwa.subscribe(() => (changes += 1))
    pwa.start({ win })

    const event = installPromptEvent('accepted')
    win.dispatchEvent(event)
    assert.equal(event.defaultPrevented, true)
    assert.equal(pwa.getState().canPrompt, true)

    assert.equal(await pwa.promptInstall(), 'accepted')
    assert.equal(event.prompted, true)
    assert.deepEqual(pwa.getState(), { canPrompt: false, installed: true, updateReady: false })
    assert.ok(changes >= 2)
  })

  it('usa o convite uma vez só, mesmo quando a pessoa recusa', async () => {
    const win = new EventTarget()
    const pwa = createPwa()
    pwa.start({ win })
    win.dispatchEvent(installPromptEvent('dismissed'))

    assert.equal(await pwa.promptInstall(), 'dismissed')
    assert.equal(pwa.getState().installed, false)
    assert.equal(await pwa.promptInstall(), 'unavailable')
  })

  it('marca como instalado quando o navegador avisa que instalou', () => {
    const win = new EventTarget()
    const pwa = createPwa()
    pwa.start({ win })
    win.dispatchEvent(installPromptEvent('accepted'))
    win.dispatchEvent(new Event('appinstalled'))
    assert.deepEqual(pwa.getState(), { canPrompt: false, installed: true, updateReady: false })
  })
})

const SCRIPT = 'https://denguinho.test/assets/index-abc123.js'
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function worker(state) {
  const target = new EventTarget()
  target.state = state
  return target
}

function browserWith({ controller = null, cachedUrls = [] } = {}) {
  const win = new EventTarget()
  const cache = new Set(cachedUrls)
  win.caches = { match: async (url) => (cache.has(url) ? {} : undefined) }
  const container = new EventTarget()
  container.controller = controller
  container.registered = []
  container.updates = 0
  container.register = async (url) => {
    container.registered.push(url)
    return {
      update: async () => {
        container.updates += 1
      },
    }
  }
  // Um service worker novo assume a página (no começo da ativação, como no Chrome).
  container.takeOver = (state = 'activated') => {
    container.controller = worker(state)
    container.dispatchEvent(new Event('controllerchange'))
    return container.controller
  }
  const document = new EventTarget()
  document.readyState = 'complete'
  document.visibilityState = 'visible'
  win.navigator = { serviceWorker: container }
  win.document = document
  return { win, container, document, cache }
}

describe('createPwa — service worker', () => {
  it('registra o service worker e procura versão nova quando o app volta para a tela', async () => {
    const { win, container, document } = browserWith({ controller: null })
    createPwa().start({ win, serviceWorker: true })
    await Promise.resolve()
    assert.deepEqual(container.registered, ['/sw.js'])

    document.dispatchEvent(new Event('visibilitychange'))
    assert.equal(container.updates, 1)
  })

  it('na primeira visita, o service worker assumir a página não é versão nova', async () => {
    const { win, container } = browserWith()
    const pwa = createPwa()
    pwa.start({ win, serviceWorker: true, scriptUrl: SCRIPT })
    container.takeOver()
    await settle()
    assert.equal(pwa.getState().updateReady, false)
  })

  it('avisa só depois que o deploy novo termina de ativar e apaga o cache antigo', async () => {
    const { win, container, cache } = browserWith({ controller: worker('activated'), cachedUrls: [SCRIPT] })
    const pwa = createPwa()
    pwa.start({ win, serviceWorker: true, scriptUrl: SCRIPT })

    const incoming = container.takeOver('activating')
    await settle()
    assert.equal(pwa.getState().updateReady, false)

    cache.delete(SCRIPT)
    incoming.state = 'activated'
    incoming.dispatchEvent(new Event('statechange'))
    await settle()
    assert.equal(pwa.getState().updateReady, true)
  })

  it('avisa do deploy seguinte mesmo na aba que instalou o primeiro service worker', async () => {
    const { win, container, cache } = browserWith({ cachedUrls: [SCRIPT] })
    const pwa = createPwa()
    pwa.start({ win, serviceWorker: true, scriptUrl: SCRIPT })
    container.takeOver()
    await settle()
    assert.equal(pwa.getState().updateReady, false)

    cache.delete(SCRIPT)
    container.takeOver()
    await settle()
    assert.equal(pwa.getState().updateReady, true)
  })

  it('não avisa quando a página já veio da rede na versão nova', async () => {
    const { win, container } = browserWith({ controller: worker('activated'), cachedUrls: [SCRIPT] })
    const pwa = createPwa()
    pwa.start({ win, serviceWorker: true, scriptUrl: SCRIPT })
    container.takeOver()
    await settle()
    assert.equal(pwa.getState().updateReady, false)
  })

  it('não registra nada fora do build de produção', () => {
    const { win, container } = browserWith({ controller: null })
    createPwa().start({ win })
    assert.deepEqual(container.registered, [])
  })
})
