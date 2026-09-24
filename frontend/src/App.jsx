import { useCallback, useEffect, useState } from 'react'
import { SESSION_EXPIRED_EVENT, api, session } from './api'
import { ToastProvider } from './components/ToastProvider'
import { readInviteCodeFromUrl } from './lib/invite'
import { readJson, writeJson, writeText } from './lib/storage'
import { AuthScreen } from './screens/AuthScreen'
import { CoupleSetupScreen } from './screens/CoupleSetupScreen'
import { Dashboard } from './screens/Dashboard'
import { LoadingScreen } from './screens/LoadingScreen'
import { PairingScreen } from './screens/PairingScreen'

const preferencesKey = 'denguinho-preferences-v1'
const themeKey = 'denguinho-theme-v1'
const defaultPreferences = {
  showScore: true,
  showKindReminder: true,
  notificationPreview: true,
  vibration: true,
  reducedMotion: false,
}
const guestState = { status: 'guest', user: null, couple: null, notice: '', error: '' }

// Uma dupla só existe de verdade com duas pessoas; até lá, quem convidou espera
// na tela de pareamento.
function stateFor(user, couple) {
  if (!couple || couple.members.length < 2) {
    return { status: 'pairing', user, couple: couple || null, notice: '', error: '' }
  }
  return {
    status: couple.relationshipStartedOn ? 'ready' : 'setup',
    user,
    couple,
    notice: '',
    error: '',
  }
}

async function resolveSession(knownUser) {
  const user = knownUser ?? (await api.me())
  if (!user.coupleId) return stateFor(user, null)
  return stateFor(user, await api.getCouple())
}

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const [preferences, setPreferences] = useState(() => ({
    ...defaultPreferences,
    ...readJson(preferencesKey, {}),
  }))
  const [state, setState] = useState(() =>
    session.token()
      ? { status: 'loading', user: null, couple: null, notice: '', error: '' }
      : guestState,
  )
  const [inviteCode] = useState(readInviteCodeFromUrl)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeText(themeKey, theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0908' : '#f7f3eb')
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = `${preferences.reducedMotion}`
    writeJson(preferencesKey, preferences)
  }, [preferences])

  useEffect(() => {
    const expire = () =>
      setState({ ...guestState, notice: 'Sua sessão expirou. Entre de novo para continuar.' })
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
  }, [])

  useEffect(() => {
    if (state.status !== 'loading') return undefined
    let active = true
    resolveSession()
      .then((next) => {
        if (active) setState(next)
      })
      .catch((error) => {
        // 401 já levou para a tela de entrada pelo evento de sessão expirada.
        if (!active || error.status === 401) return
        setState({ status: 'offline', user: null, couple: null, notice: '', error: error.message })
      })
    return () => {
      active = false
    }
  }, [state.status])

  const logout = useCallback(() => {
    session.clear()
    setState(guestState)
  }, [])

  const handleAuthenticated = async (user) => {
    setState(await resolveSession(user))
  }

  const handlePaired = useCallback((couple) => {
    setState((current) => stateFor(current.user, couple))
  }, [])

  const handleCoupleChange = useCallback((couple) => {
    setState((current) => (current.couple ? { ...current, couple } : current))
  }, [])

  const handleUserChange = useCallback((user) => {
    setState((current) => ({
      ...current,
      user,
      couple: current.couple && {
        ...current.couple,
        members: current.couple.members.map((member) =>
          member.id === user.id ? { ...member, ...user } : member,
        ),
      },
    }))
  }, [])

  const updatePreference = useCallback((key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }, [])

  let screen
  if (state.status === 'loading' || state.status === 'offline') {
    screen = (
      <LoadingScreen
        error={state.status === 'offline' ? state.error : ''}
        onRetry={() => setState((current) => ({ ...current, status: 'loading', error: '' }))}
        onLogout={logout}
      />
    )
  } else if (state.status === 'guest') {
    screen = (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        notice={state.notice}
        inviteCode={inviteCode}
      />
    )
  } else if (state.status === 'pairing') {
    screen = (
      <PairingScreen user={state.user} couple={state.couple} onPaired={handlePaired} onLogout={logout} />
    )
  } else if (state.status === 'setup') {
    screen = (
      <CoupleSetupScreen
        couple={state.couple}
        onComplete={(couple) => setState((current) => stateFor(current.user, couple))}
        onLogout={logout}
      />
    )
  } else {
    screen = (
      <Dashboard
        user={state.user}
        couple={state.couple}
        onUserChange={handleUserChange}
        onCoupleChange={handleCoupleChange}
        onLogout={logout}
        theme={theme}
        onThemeChange={setTheme}
        preferences={preferences}
        onPreferenceChange={updatePreference}
      />
    )
  }

  return <ToastProvider>{screen}</ToastProvider>
}
