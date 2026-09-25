import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { PUBLIC_SHELL, precacheUrls, serviceWorkerSource } from './vitePlugin.js'

const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8')
const publicFile = (url) => new URL(`../public${url}`, import.meta.url)
const pngSize = (url) => {
  const png = readFileSync(publicFile(url))
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`
}

describe('precacheUrls', () => {
  it('guarda HTML, JS, CSS e o casco do app, sem fontes e sem o próprio service worker', () => {
    const urls = precacheUrls([
      'index.html',
      'assets/index-abc.js',
      'assets/index-abc.css',
      'assets/manrope-latin-wght-normal.woff2',
      'sw.js',
    ])
    assert.ok(urls.includes('/index.html'))
    assert.ok(urls.includes('/assets/index-abc.js'))
    assert.ok(urls.includes('/assets/index-abc.css'))
    assert.ok(!urls.includes('/assets/manrope-latin-wght-normal.woff2'))
    assert.ok(!urls.includes('/sw.js'))
    for (const url of PUBLIC_SHELL) assert.ok(urls.includes(url), url)
  })

  it('não repete arquivos e mantém a mesma ordem entre builds', () => {
    const urls = precacheUrls(['index.html', 'assets/b.js', 'assets/a.js', 'index.html'])
    assert.deepEqual(urls, [...new Set(urls)].sort())
    assert.deepEqual(urls, precacheUrls(['assets/a.js', 'index.html', 'assets/b.js']))
  })

  it('só lista arquivos de public/ que existem de verdade', () => {
    for (const url of PUBLIC_SHELL) assert.ok(existsSync(publicFile(url)), url)
  })
})

describe('serviceWorkerSource', () => {
  it('troca as constantes do modelo e continua sendo JavaScript válido', () => {
    const source = serviceWorkerSource(template, { version: 'abc123', urls: ['/index.html'] })
    assert.ok(!source.includes('__DENGUINHO_SW_'))
    assert.match(source, /const VERSION = "abc123"/)
    assert.match(source, /const PRECACHE_URLS = \["\/index\.html"\]/)
    assert.doesNotThrow(() => new Function(source))
  })
})

describe('manifest.webmanifest', () => {
  const manifest = JSON.parse(readFileSync(publicFile('/manifest.webmanifest'), 'utf8'))

  it('abre em tela cheia a partir da raiz do site', () => {
    assert.equal(manifest.display, 'standalone')
    assert.equal(manifest.start_url, '/')
    assert.equal(manifest.scope, '/')
    assert.equal(manifest.short_name, 'Denguinho')
  })

  it('aponta para ícones que existem, no tamanho declarado, inclusive os adaptáveis do Android', () => {
    for (const icon of manifest.icons) assert.equal(pngSize(icon.src), icon.sizes, icon.src)
    for (const purpose of ['any', 'maskable']) {
      for (const sizes of ['192x192', '512x512']) {
        assert.ok(
          manifest.icons.some((icon) => icon.purpose === purpose && icon.sizes === sizes),
          `${purpose} ${sizes}`,
        )
      }
    }
    assert.equal(pngSize('/apple-touch-icon.png'), '180x180')
  })
})

// Roda o service worker gerado com caches e rede de mentira.
function loadServiceWorker({ network, cached = {} }) {
  const origin = 'https://denguinho.test'
  const store = new Map(Object.entries(cached).map(([path, body]) => [`${origin}${path}`, body]))
  const keyOf = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href
  const cache = {
    addAll: async () => {},
    put: async (request, response) => store.set(keyOf(request), response),
  }
  const matchOptions = []
  const caches = {
    open: async () => cache,
    match: async (request, options) => {
      matchOptions.push(options)
      return store.get(keyOf(request))
    },
    keys: async () => [],
    delete: async () => true,
  }
  const listeners = {}
  const self = {
    location: new URL(origin),
    addEventListener: (type, listener) => (listeners[type] = listener),
  }
  const source = serviceWorkerSource(template, { version: 'test', urls: ['/index.html'] })
  new Function('self', 'caches', 'fetch', source)(self, caches, network)

  return {
    store,
    matchOptions,
    async request(path, { mode = 'no-cors', method = 'GET' } = {}) {
      const pending = []
      let responded = null
      listeners.fetch({
        request: { url: new URL(path, origin).href, mode, method },
        respondWith: (promise) => (responded = promise),
        waitUntil: (promise) => pending.push(promise),
      })
      const response = responded ? await responded : null
      await Promise.all(pending)
      return response
    },
  }
}

const offline = async () => {
  throw new TypeError('Failed to fetch')
}
const okResponse = (body) => ({ status: 200, body, clone: () => ({ status: 200, body }) })

describe('service worker', () => {
  it('com rede, abre sempre a versão mais nova da página', async () => {
    const sw = loadServiceWorker({
      network: async () => okResponse('html novo'),
      cached: { '/index.html': 'html guardado' },
    })
    assert.equal((await sw.request('/?invite=ABC123', { mode: 'navigate' })).body, 'html novo')
  })

  it('sem rede, abre o app com o HTML guardado', async () => {
    const sw = loadServiceWorker({ network: offline, cached: { '/index.html': 'html guardado' } })
    assert.equal(await sw.request('/', { mode: 'navigate' }), 'html guardado')
    assert.deepEqual(sw.matchOptions, [{ ignoreVary: true }])
  })

  it('serve arquivos do build do cache e guarda os que ainda não tinha', async () => {
    let calls = 0
    const sw = loadServiceWorker({
      network: async () => {
        calls += 1
        return okResponse('fonte')
      },
      cached: { '/assets/index-abc.js': 'js guardado' },
    })
    assert.equal(await sw.request('/assets/index-abc.js'), 'js guardado')
    assert.equal(calls, 0)
    // O servidor pode responder com `Vary: Origin`; o módulo JS chega com `Origin`.
    assert.deepEqual(sw.matchOptions, [{ ignoreVary: true }])
    assert.equal((await sw.request('/assets/fonte-abc.woff2')).body, 'fonte')
    assert.equal(sw.store.get('https://denguinho.test/assets/fonte-abc.woff2').body, 'fonte')
  })

  it('não mexe em chamadas para a API nem em envios de formulário', async () => {
    const sw = loadServiceWorker({ network: offline })
    assert.equal(await sw.request('https://api.denguinho.test/api/couples/me'), null)
    assert.equal(await sw.request('/assets/index-abc.js', { method: 'POST' }), null)
  })
})
