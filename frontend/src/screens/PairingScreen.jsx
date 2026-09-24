import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  HeartHandshake,
  Link2,
  LogOut,
  MessageCircleHeart,
  Share2,
  UserRoundPlus,
} from 'lucide-react'
import { api } from '../api'
import { Brand } from '../components/Brand'
import {
  clearInviteCodeFromUrl,
  createInviteLink,
  createInviteMessage,
  createWhatsAppInviteLink,
  normalizeInviteCode,
  readInviteCodeFromUrl,
} from '../lib/invite'
import { firstName } from '../lib/text'

const PARTNER_CHECK_INTERVAL_MS = 8_000

function formatExpiration(value) {
  return new Date(value).toLocaleString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function PairingScreen({ user, couple, onPaired, onLogout }) {
  const [invite, setInvite] = useState(null)
  const [code, setCode] = useState(readInviteCodeFromUrl)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const waitingPartner = Boolean(invite || couple)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  // Quem convidou fica nesta tela até a outra pessoa entrar; então segue sozinho.
  useEffect(() => {
    if (!waitingPartner) return undefined
    let active = true
    const check = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const current = await api.getCouple()
        if (active && current.members.length >= 2) onPaired(current)
      } catch {
        // Tenta de novo no próximo intervalo.
      }
    }
    const timer = window.setInterval(check, PARTNER_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', check)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [waitingPartner, onPaired])

  const createInvite = async () => {
    setBusy('create')
    setError('')
    try {
      setInvite(await api.createInvite())
      setCopied('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const join = async (event) => {
    event.preventDefault()
    setBusy('join')
    setError('')
    try {
      const joined = await api.joinCouple(code)
      clearInviteCodeFromUrl()
      onPaired(joined)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const copy = async (kind) => {
    const copiedText = await copyText(kind === 'code' ? invite.code : createInviteLink(invite.code))
    setCopied(copiedText ? kind : '')
    if (!copiedText) setError('Não consegui copiar. Selecione o código e copie manualmente.')
    window.setTimeout(() => setCopied(''), 1800)
  }

  const share = async () => {
    try {
      await navigator.share({ title: 'Denguinho', text: createInviteMessage(invite.code) })
    } catch {
      // Compartilhamento cancelado pela pessoa.
    }
  }

  return (
    <main className="pairing-shell">
      <header>
        <Brand />
        <button className="icon-text" onClick={onLogout}>
          <LogOut size={17} /> Sair
        </button>
      </header>
      <section className="pairing-card">
        <div className="pairing-heading">
          <span className="round-icon">
            <HeartHandshake />
          </span>
          <p className="eyebrow">Oi, {firstName(user.name)}</p>
          <h1>Agora falta trazer sua pessoa.</h1>
          <p>
            Vocês terão um espaço só de vocês. O convite dura 48 horas e pode ser
            usado uma única vez.
          </p>
        </div>

        <div className="pairing-options">
          <article>
            <UserRoundPlus size={24} />
            <h2>Quero convidar</h2>
            <p>Crie um código curto e envie para o seu dengo.</p>
            {invite ? (
              <div className="invite-share">
                <div className="invite-code">
                  <span>{invite.code}</span>
                  <button onClick={() => copy('code')} aria-label="Copiar código">
                    {copied === 'code' ? <Check size={19} /> : <Copy size={19} />}
                  </button>
                </div>
                <a
                  className="button whatsapp"
                  href={createWhatsAppInviteLink(invite.code)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Enviar convite pelo WhatsApp"
                >
                  <MessageCircleHeart size={18} />
                  Enviar pelo WhatsApp
                </a>
                <div className="invite-secondary-actions">
                  <button type="button" className="button secondary" onClick={() => copy('link')}>
                    {copied === 'link' ? <Check size={17} /> : <Link2 size={17} />}
                    {copied === 'link' ? 'Link copiado' : 'Copiar link'}
                  </button>
                  {canShare ? (
                    <button type="button" className="button secondary" onClick={share}>
                      <Share2 size={17} />
                      Compartilhar
                    </button>
                  ) : null}
                </div>
                <small className="invite-share-note">
                  A mensagem já vai com o código e o link. Vale até{' '}
                  {formatExpiration(invite.expiresAt)}.
                </small>
              </div>
            ) : (
              <button className="button primary" onClick={createInvite} disabled={Boolean(busy)}>
                {busy === 'create' ? 'Criando…' : couple ? 'Criar novo convite' : 'Criar convite'}
              </button>
            )}
            {waitingPartner ? (
              <p className="pairing-waiting" role="status">
                <span className="moment-live-dot" aria-hidden="true" />
                Esperando seu dengo entrar. Esta tela avança sozinha quando isso acontecer.
              </p>
            ) : null}
          </article>

          <div className="or-divider">
            <span>ou</span>
          </div>

          <article>
            <HeartHandshake size={24} />
            <h2>Recebi um convite</h2>
            <p>Digite o código compartilhado com você.</p>
            <form onSubmit={join} className="join-form">
              <input
                value={code}
                onChange={(event) => setCode(normalizeInviteCode(event.target.value))}
                placeholder="DENGO2"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-label="Código do convite"
                required
              />
              <button className="button dark" disabled={code.length !== 6 || Boolean(busy)}>
                {busy === 'join' ? 'Entrando…' : 'Entrar na dupla'}
              </button>
            </form>
          </article>
        </div>
        {error ? (
          <p className="form-error centered" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
