// Service worker do Denguinho instalado como app (PWA).
// O build (pwa/vitePlugin.js) troca as duas constantes abaixo pela versão do
// deploy e pela lista de arquivos que o app precisa para abrir sem internet.
const VERSION = __DENGUINHO_SW_VERSION__
const PRECACHE_URLS = __DENGUINHO_SW_PRECACHE__

const CACHE_PREFIX = 'denguinho-'
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`
const APP_SHELL = '/index.html'
// Em rede muito lenta o app abre com o HTML guardado em vez de ficar em branco.
const NAVIGATION_TIMEOUT_MS = 4000
const precached = new Set(PRECACHE_URLS)
// Servidores e CDNs costumam responder com `Vary: Origin`, e o navegador manda
// `Origin` ao buscar módulos JS: sem isto o cache nunca acharia o arquivo. Os
// nomes têm hash do conteúdo, então a URL sozinha já identifica a versão certa.
const MATCH_OPTIONS = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `reload` ignora o cache HTTP para não guardar um arquivo de outro deploy.
      .then((cache) =>
        cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // A API fica em outro domínio: login, dados do casal e fotos vão sempre direto
  // para a rede, sem passar por nenhum cache daqui.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/assets/') || precached.has(url.pathname)) {
    event.respondWith(cacheFirst(event))
  }
})

// Páginas: com rede, sempre a versão mais nova do site; sem rede, o HTML guardado.
async function networkFirst(request) {
  const network = fetch(request)
  // Se o HTML guardado responder primeiro, a falha da rede não deve virar erro solto.
  network.catch(() => {})
  let timer
  const slow = new Promise((resolve) => {
    timer = setTimeout(resolve, NAVIGATION_TIMEOUT_MS, null)
  })
  try {
    const response = await Promise.race([network, slow])
    if (response) return response
  } catch {
    // Sem conexão: segue para o HTML guardado.
  } finally {
    clearTimeout(timer)
  }
  return (await caches.match(APP_SHELL, MATCH_OPTIONS)) || network
}

// Arquivos do build têm hash no nome e nunca mudam: o que está guardado vale.
async function cacheFirst(event) {
  const cached = await caches.match(event.request, MATCH_OPTIONS)
  if (cached) return cached
  const response = await fetch(event.request)
  if (response.status === 200) {
    const copy = response.clone()
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)))
  }
  return response
}
