import { useState } from 'react'
import { ArrowRight, HeartHandshake, Sparkles } from 'lucide-react'
import { api, isDemoMode, session } from '../api'
import { Brand } from '../components/Brand'
import { PasswordField } from '../components/PasswordField'

const SLOW_REQUEST_MS = 4000

export function AuthScreen({ onAuthenticated, notice, inviteCode }) {
  const [mode, setMode] = useState(inviteCode ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState('')
  const isLogin = mode === 'login'

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_REQUEST_MS)
    try {
      const email = form.email.trim()
      const response = isLogin
        ? await api.login({ email, password: form.password })
        : await api.register({ name: form.name.trim(), email, password: form.password })
      session.save(response.token)
      await onAuthenticated(response.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      window.clearTimeout(slowTimer)
      setBusy(false)
      setSlow(false)
    }
  }

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div className="story-copy">
          <p className="eyebrow light">Para duas pessoas, de verdade</p>
          <h1>
            Cada passo é seu.
            <br />
            <em>O caminho é de vocês.</em>
          </h1>
          <p>
            Um espaço privado para transformar planos em pequenos avanços — com
            incentivo, presença e zero culpa para recomeçar.
          </p>
        </div>
        <blockquote>
          <Sparkles size={18} />
          “A meta não é correr na mesma velocidade. É não deixar ninguém caminhar
          sozinho.”
        </blockquote>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          {inviteCode ? (
            <p className="auth-invite-banner">
              <HeartHandshake size={18} />
              <span>
                Você recebeu o convite <b>{inviteCode}</b>.{' '}
                {isLogin ? 'Entre para aceitar.' : 'Crie sua conta para aceitar.'}
              </span>
            </p>
          ) : null}
          <p className="eyebrow">Seu espaço a dois</p>
          <h2>{isLogin ? 'Que bom ter você de volta.' : 'Comecem por aqui.'}</h2>
          <p className="auth-intro">
            {isLogin
              ? 'Entre para ver como vocês estão avançando.'
              : inviteCode
                ? 'Crie sua conta e a dupla de vocês fica pronta.'
                : 'Crie sua conta e convide sua pessoa depois.'}
          </p>
          {notice ? (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          ) : null}

          <form onSubmit={submit}>
            {!isLogin ? (
              <label>
                Como podemos chamar você?
                <input
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="Seu nome"
                  autoComplete="name"
                  maxLength={80}
                  required
                />
              </label>
            ) : null}
            <label>
              E-mail
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                maxLength={160}
                required
              />
            </label>
            <PasswordField
              label="Senha"
              name="password"
              value={form.password}
              onChange={update}
              placeholder="No mínimo 8 caracteres"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              maxLength={72}
              required
            />
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="button primary wide" disabled={busy}>
              {busy
                ? slow && !isDemoMode
                  ? 'Acordando o servidor…'
                  : 'Só um instante…'
                : isLogin
                  ? 'Entrar'
                  : 'Criar minha conta'}
              {!busy ? <ArrowRight size={18} /> : null}
            </button>
            {slow && !isDemoMode ? (
              <p className="auth-slow-note">
                Na primeira visita do dia o servidor leva alguns segundos para acordar.
              </p>
            ) : null}
          </form>

          <p className="auth-switch">
            {isLogin ? 'Ainda não tem conta?' : 'Já criou sua conta?'}{' '}
            <button type="button" onClick={switchMode}>
              {isLogin ? 'Criar agora' : 'Entrar'}
            </button>
          </p>
          {isDemoMode ? (
            <p className="demo-note">
              Modo apresentação ativo — use qualquer e-mail e senha com 8 caracteres.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
