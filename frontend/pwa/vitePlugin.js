import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const templateUrl = new URL('./service-worker.js', import.meta.url)

// Arquivos de public/ que o app instalado usa ao abrir (ícones e manifesto).
export const PUBLIC_SHELL = [
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/manifest.webmanifest',
]

// HTML, JS e CSS do build formam o "casco" do app e vão para o cache na
// instalação. Fontes e imagens entram só quando usadas: a fonte variável traz
// arquivos para vários alfabetos e o celular baixa apenas o que precisa.
export function precacheUrls(bundleFileNames) {
  const built = bundleFileNames
    .filter((fileName) => /\.(html|js|css)$/.test(fileName) && fileName !== 'sw.js')
    .map((fileName) => `/${fileName}`)
  return [...new Set([...built, ...PUBLIC_SHELL])].sort()
}

export function serviceWorkerSource(template, { version, urls }) {
  return template
    .replace('__DENGUINHO_SW_VERSION__', JSON.stringify(version))
    .replace('__DENGUINHO_SW_PRECACHE__', JSON.stringify(urls))
}

// Gera dist/sw.js a cada build. A versão vem do conteúdo de tudo que foi
// gerado e dos arquivos do casco: qualquer mudança publicada troca o service
// worker, que então apaga o cache antigo.
export function serviceWorkerPlugin() {
  let publicDir = ''
  return {
    name: 'denguinho:service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir
    },
    generateBundle(_options, bundle) {
      if (!bundle['index.html']) {
        this.error('index.html não apareceu no build; o service worker depende dele.')
      }
      const hash = createHash('sha256')
      for (const fileName of Object.keys(bundle).sort()) {
        const output = bundle[fileName]
        hash.update(fileName).update(output.type === 'chunk' ? output.code : output.source)
      }
      for (const url of PUBLIC_SHELL) {
        const filePath = path.join(publicDir, url)
        if (!existsSync(filePath)) this.error(`Arquivo do app instalado não encontrado: public${url}`)
        hash.update(url).update(readFileSync(filePath))
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorkerSource(readFileSync(templateUrl, 'utf8'), {
          version: hash.digest('hex').slice(0, 12),
          urls: precacheUrls(Object.keys(bundle)),
        }),
      })
    },
  }
}
