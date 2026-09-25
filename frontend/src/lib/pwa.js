// Instalação do Denguinho como app (PWA) e aviso de versão nova.

export function isIos(nav = globalThis.navigator) {
  if (!nav) return false
  // O iPad se apresenta como Mac, mas tem tela de toque.
  const touchMac = nav.platform === 'MacIntel' && nav.maxTouchPoints > 1
  return /iPhone|iPad|iPod/i.test(nav.userAgent) || touchMac
}

export function isStandalone(win = globalThis.window) {
  if (!win) return false
  const displayMode = win.matchMedia?.('(display-mode: standalone)').matches
  return Boolean(displayMode || win.navigator?.standalone)
}

export function isTouchDevice(win = globalThis.window) {
  return Boolean(win?.matchMedia?.('(pointer: coarse)').matches)
}

// installed: já roda como app; prompt: o navegador deixa instalar com um toque
// (Android, Chrome e Edge); ios: só pelo menu Compartilhar do iPhone/iPad;
// manual: pelo menu do navegador, que o site não controla.
export function installMethod({ standalone, installed, canPrompt, ios }) {
  if (standalone || installed) return 'installed'
  if (canPrompt) return 'prompt'
  if (ios) return 'ios'
  return 'manual'
}

// O navegador troca o controle da página assim que o service worker novo começa
// a ativar, antes de ele apagar o cache do deploy anterior.
function whenActivated(worker) {
  return new Promise((resolve) => {
    const check = () => {
      if (!worker || worker.state === 'activated' || worker.state === 'redundant') {
        worker?.removeEventListener('statechange', check)
        resolve()
      }
    }
    worker?.addEventListener('statechange', check)
    check()
  })
}

// A página quase sempre vem da rede já na versão nova. Ela só está desatualizada
// quando o arquivo JS que está rodando ficou fora do cache do deploy que chegou.
async function isCurrentBuild(win, scriptUrl) {
  if (!scriptUrl || !win.caches) return false
  try {
    return Boolean(await win.caches.match(scriptUrl, { ignoreVary: true }))
  } catch {
    return false
  }
}

export function createPwa() {
  const listeners = new Set()
  let state = { canPrompt: false, installed: false, updateReady: false }
  let deferredPrompt = null

  const setState = (patch) => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }

  const registerServiceWorker = (win, scriptUrl) => {
    const container = win.navigator.serviceWorker
    if (!container) return
    // Na primeira visita o service worker também assume a página; só pode ser
    // versão nova quando ele substitui outro que já estava no controle.
    let hadController = Boolean(container.controller)
    container.addEventListener('controllerchange', async () => {
      const replaced = hadController
      hadController = true
      if (!replaced) return
      await whenActivated(container.controller)
      if (!(await isCurrentBuild(win, scriptUrl))) setState({ updateReady: true })
    })
    const register = () => {
      container
        .register('/sw.js')
        .then((registration) => {
          // O app instalado fica dias aberto no celular: ao voltar para ele,
          // procura um deploy novo.
          win.document.addEventListener('visibilitychange', () => {
            if (win.document.visibilityState === 'visible') registration.update().catch(() => {})
          })
        })
        .catch(() => {
          // Sem service worker o site continua funcionando, só não abre offline.
        })
    }
    if (win.document.readyState === 'complete') register()
    else win.addEventListener('load', register, { once: true })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start({ win = globalThis.window, serviceWorker = false, scriptUrl = '' } = {}) {
      if (!win) return
      win.addEventListener('beforeinstallprompt', (event) => {
        // Guarda o convite do navegador para o nosso botão "Instalar".
        event.preventDefault()
        deferredPrompt = event
        setState({ canPrompt: true })
      })
      win.addEventListener('appinstalled', () => {
        deferredPrompt = null
        setState({ canPrompt: false, installed: true })
      })
      if (serviceWorker) registerServiceWorker(win, scriptUrl)
    },
    async promptInstall() {
      const promptEvent = deferredPrompt
      if (!promptEvent) return 'unavailable'
      // O convite do navegador só pode ser usado uma vez.
      deferredPrompt = null
      setState({ canPrompt: false })
      try {
        await promptEvent.prompt()
        const { outcome } = await promptEvent.userChoice
        if (outcome === 'accepted') setState({ installed: true })
        return outcome
      } catch {
        return 'unavailable'
      }
    },
  }
}

export const pwa = createPwa()
