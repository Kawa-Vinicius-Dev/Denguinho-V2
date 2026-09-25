import { useState } from 'react'
import { CircleCheck, Download, Share, Smartphone, SquarePlus, X } from 'lucide-react'
import { usePersistentState } from '../hooks/usePersistentState'
import { useInstallApp } from '../hooks/usePwa'
import { useToast } from '../hooks/useToast'
import { isTouchDevice } from '../lib/pwa'

const CARD_DISMISSED_KEY = 'denguinho-install-card-dismissed-v1'

function IosInstallSteps() {
  return (
    <ol className="install-steps" aria-label="Como instalar no iPhone">
      <li>
        <span>
          Toque em <Share size={15} aria-hidden="true" /> <strong>Compartilhar</strong>, na barra
          do Safari.
        </span>
      </li>
      <li>
        <span>
          Escolha <SquarePlus size={15} aria-hidden="true" />{' '}
          <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>.
        </span>
      </li>
      <li>
        <span>
          Abra o Denguinho pela tela inicial e entre com seu e-mail e senha uma vez: o app do
          iPhone não usa o login do Safari.
        </span>
      </li>
    </ol>
  )
}

function useInstallNow(install) {
  const notify = useToast()
  return async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      notify('Pronto! Procure o Denguinho na tela inicial.', { key: 'install-app' })
    } else if (outcome === 'unavailable') {
      notify('Não deu para instalar agora. Use o menu do navegador e toque em "Instalar app".', {
        tone: 'error',
        key: 'install-app',
      })
    }
  }
}

// Convite para instalar, só no celular e só quando dá para ajudar de verdade:
// com o botão do navegador (Android) ou com os passos do Safari (iPhone).
export function InstallAppCard() {
  const { method, install } = useInstallApp()
  const installNow = useInstallNow(install)
  const [dismissed, setDismissed] = usePersistentState(CARD_DISMISSED_KEY, false)
  const [showSteps, setShowSteps] = useState(false)

  if (dismissed || !isTouchDevice() || (method !== 'prompt' && method !== 'ios')) return null

  return (
    <section className="install-card" aria-labelledby="install-card-title">
      <img className="install-card-icon" src="/icons/icon-192.png" alt="" />
      <div className="install-card-copy">
        <h2 id="install-card-title">Denguinho na tela inicial</h2>
        <p>Abre em tela cheia, como um app, a um toque de distância.</p>
      </div>
      <div className="install-card-actions">
        {method === 'prompt' ? (
          <button type="button" className="button primary" onClick={installNow}>
            <Download size={17} />
            Instalar o app
          </button>
        ) : (
          <button
            type="button"
            className="button secondary"
            aria-expanded={showSteps}
            onClick={() => setShowSteps((current) => !current)}
          >
            <Smartphone size={17} />
            {showSteps ? 'Esconder os passos' : 'Como instalar'}
          </button>
        )}
      </div>
      {method === 'ios' && showSteps ? <IosInstallSteps /> : null}
      <button
        type="button"
        className="install-card-close"
        aria-label="Agora não"
        onClick={() => setDismissed(true)}
      >
        <X size={17} />
      </button>
    </section>
  )
}

// Entrada fixa em Configurações > Aplicativo, mesmo depois de dispensar o convite.
export function InstallAppSettings() {
  const { method, standalone, install } = useInstallApp()
  const installNow = useInstallNow(install)
  const description = {
    installed: standalone
      ? 'Você está usando o Denguinho instalado. 💛'
      : 'O Denguinho já foi instalado neste aparelho.',
    prompt: 'Instale para abrir em tela cheia, direto da tela inicial.',
    ios: 'No iPhone e no iPad, a instalação é feita pelo Safari:',
    manual: (
      <>
        No celular, abra o menu do navegador e toque em <strong>Instalar app</strong> ou{' '}
        <strong>Adicionar à tela inicial</strong>.
      </>
    ),
  }[method]

  return (
    <section className="install-settings" aria-labelledby="install-settings-title">
      <div className="appearance-copy">
        <span className="appearance-icon">
          {method === 'installed' ? <CircleCheck size={19} /> : <Smartphone size={19} />}
        </span>
        <div>
          <h3 id="install-settings-title">App no celular</h3>
          <p>{description}</p>
        </div>
      </div>
      {method === 'prompt' ? (
        <button type="button" className="button primary" onClick={installNow}>
          <Download size={17} />
          Instalar o app
        </button>
      ) : null}
      {method === 'ios' ? <IosInstallSteps /> : null}
    </section>
  )
}
