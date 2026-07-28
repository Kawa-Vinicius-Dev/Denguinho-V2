import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Flame,
  Focus,
  Gift,
  HeartHandshake,
  Home,
  ImagePlus,
  KeyRound,
  LayoutList,
  LogOut,
  Mail,
  Medal,
  Menu,
  MessageCircleHeart,
  Moon,
  PartyPopper,
  Pause,
  Pencil,
  Play,
  Plus,
  Settings,
  SmilePlus,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Trophy,
  UserRound,
  UserRoundPlus,
  X,
} from 'lucide-react'
import { api, isDemoMode } from './api'

const fallbackJourneyImage = '/journey-fallback.png'
const preferencesKey = 'denguinho-preferences-v1'
const defaultPreferences = {
  showScore: true,
  showKindReminder: true,
  notificationPreview: true,
  vibration: true,
  reducedMotion: false,
}

function loadPreferences() {
  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(localStorage.getItem(preferencesKey) || '{}'),
    }
  } catch {
    return defaultPreferences
  }
}

function Brand() {
  return (
    <div className="brand" aria-label="Denguinho">
      <img className="brand-mark-image" src="/denguinho-icon.png?v=2" alt="" />
      <span>Denguinho</span>
    </div>
  )
}

function PreferenceToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <button
      type="button"
      className="preference-toggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="preference-toggle-icon">
        <Icon size={18} />
      </span>
      <span className="preference-toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="preference-switch" aria-hidden="true">
        <span />
      </span>
    </button>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response =
        mode === 'login'
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form)
      localStorage.setItem('denguinho-token', response.token)
      onAuthenticated(response.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
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
          <p className="eyebrow">Seu espaço a dois</p>
          <h2>{mode === 'login' ? 'Que bom ter você de volta.' : 'Comecem por aqui.'}</h2>
          <p className="auth-intro">
            {mode === 'login'
              ? 'Entre para ver como vocês estão avançando.'
              : 'Crie sua conta e convide sua pessoa depois.'}
          </p>

          <form onSubmit={submit}>
            {mode === 'register' ? (
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
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={update}
                placeholder="No mínimo 8 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary wide" disabled={busy}>
              {busy ? 'Só um instante…' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
              {!busy ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já criou sua conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? 'Criar agora' : 'Entrar'}
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

function PairingScreen({ user, onPaired, onLogout }) {
  const [invite, setInvite] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const createInvite = async () => {
    setBusy('create')
    setError('')
    try {
      setInvite(await api.createInvite())
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
      onPaired(await api.joinCouple(code))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const copyInvite = async () => {
    await navigator.clipboard.writeText(invite.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
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
          <p className="eyebrow">Oi, {user.name}</p>
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
            <p>Crie um código curto para enviar com carinho.</p>
            {invite ? (
              <div className="invite-code">
                <span>{invite.code}</span>
                <button onClick={copyInvite} aria-label="Copiar código">
                  {copied ? <Check size={19} /> : <Copy size={19} />}
                </button>
              </div>
            ) : (
              <button className="button primary" onClick={createInvite} disabled={busy}>
                {busy === 'create' ? 'Criando…' : 'Criar convite'}
              </button>
            )}
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
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
                placeholder="DENGO2"
                maxLength={6}
                aria-label="Código do convite"
                required
              />
              <button className="button dark" disabled={code.length !== 6 || busy}>
                {busy === 'join' ? 'Entrando…' : 'Entrar na dupla'}
              </button>
            </form>
          </article>
        </div>
        {error ? <p className="form-error centered">{error}</p> : null}
      </section>
    </main>
  )
}

function CoupleSetupScreen({ couple, onComplete, onLogout }) {
  const [relationshipStartedOn, setRelationshipStartedOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onComplete(
        await api.updateCouple(couple.currentObjective, relationshipStartedOn),
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="pairing-shell setup-shell">
      <header>
        <Brand />
        <button className="icon-text" onClick={onLogout}>
          <LogOut size={17} /> Sair
        </button>
      </header>
      <section className="pairing-card setup-card">
        <div className="pairing-heading">
          <span className="round-icon">
            <CalendarDays />
          </span>
          <p className="eyebrow">O primeiro dia de vocês</p>
          <h1>Que dia você começou a namorar com teu dengo?</h1>
          <p>
            A gente usa essa data para lembrar o dia de vocês todos os meses e
            deixar os momentos importantes organizados na agenda do casal.
          </p>
        </div>
        <form className="setup-form" onSubmit={submit}>
          <label>
            Nosso namoro começou em
            <input
              type="date"
              value={relationshipStartedOn}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setRelationshipStartedOn(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button primary wide" disabled={busy || !relationshipStartedOn}>
            {busy ? 'Guardando…' : 'Guardar nosso dia'}
            {!busy ? <ArrowRight size={18} /> : null}
          </button>
        </form>
      </section>
    </main>
  )
}

const challengeIcons = {
  book: BookOpen,
  calendar: CalendarDays,
  focus: Focus,
  target: Target,
}

const challengeCategories = [
  'Estudos',
  'Trabalho',
  'Projetos',
  'Saúde',
  'Organização',
  'Finanças',
  'Relacionamento',
  'Lazer',
  'Outros',
]

const initialChallenges = []

const challengeStorageKey = 'denguinho-challenges-v2'
const scoreStorageKey = 'denguinho-challenge-scores-v2'
const dynamicStorageKey = 'denguinho-dynamic-v2'
const currentMonthKey = new Date().toISOString().slice(0, 7)
const initialScores = { mine: 0, partner: 0, couple: 0 }
const initialDynamicState = {
  dengoActivity: null,
  focusSession: {
    task: '',
    duration: 25,
    remaining: 25 * 60,
    status: 'idle',
    partnerJoined: false,
    feeling: '',
    rewarded: false,
  },
  surprise: {
    monthKey: currentMonthKey,
    title: 'Encontro sem pressa',
    description: 'Escolham um lugar simples, guardem os celulares e curtam uma hora só de vocês.',
    accepted: false,
    completed: false,
  },
  lastReaction: null,
}

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextOccurrence(event) {
  const occurrence = parseLocalDate(event.eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (event.recurrence === 'MONTHLY') {
    occurrence.setFullYear(today.getFullYear(), today.getMonth())
    if (occurrence < today) occurrence.setMonth(occurrence.getMonth() + 1)
  }
  if (event.recurrence === 'YEARLY') {
    occurrence.setFullYear(today.getFullYear())
    if (occurrence < today) occurrence.setFullYear(occurrence.getFullYear() + 1)
  }
  return occurrence
}

function recurrenceLabel(recurrence) {
  if (recurrence === 'MONTHLY') return 'Todo mês'
  if (recurrence === 'YEARLY') return 'Todo ano'
  return 'Uma vez'
}

function getMonthWeekInfo(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return {
    current: Math.ceil((firstWeekday + date.getDate()) / 7),
    total: Math.ceil((firstWeekday + daysInMonth) / 7),
    month: date.toLocaleDateString('pt-BR', { month: 'long' }),
  }
}

const defaultEventDate = toDateInputValue(new Date(Date.now() + 86400000))
const currentMonthWeeks = getMonthWeekInfo(new Date())

function loadDemoChallenges() {
  if (!isDemoMode) return initialChallenges
  try {
    const savedChallenges = localStorage.getItem(challengeStorageKey)
    if (savedChallenges === null) return initialChallenges
    const stored = JSON.parse(savedChallenges)
    return Array.isArray(stored) ? stored : initialChallenges
  } catch {
    return initialChallenges
  }
}

function loadDemoScores() {
  if (!isDemoMode) return { mine: 0, partner: 0, couple: 0 }
  try {
    const stored = JSON.parse(localStorage.getItem(scoreStorageKey))
    return stored &&
      Number.isFinite(stored.mine) &&
      Number.isFinite(stored.partner) &&
      Number.isFinite(stored.couple)
      ? stored
      : initialScores
  } catch {
    return initialScores
  }
}

function loadDynamicState() {
  if (!isDemoMode) return initialDynamicState
  try {
    const stored = JSON.parse(localStorage.getItem(dynamicStorageKey))
    return stored
      ? {
          ...initialDynamicState,
          ...stored,
          focusSession: {
            ...initialDynamicState.focusSession,
            ...stored.focusSession,
          },
          surprise:
            stored.surprise?.monthKey === currentMonthKey
              ? {
                  ...initialDynamicState.surprise,
                  ...stored.surprise,
                }
              : initialDynamicState.surprise,
        }
      : initialDynamicState
  } catch {
    return initialDynamicState
  }
}

function formatFocusTime(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${`${minutes}`.padStart(2, '0')}:${`${remainder}`.padStart(2, '0')}`
}

function daysUntil(date) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target - today) / 86400000))
}

function getCompetitiveNote(scores, partnerName) {
  if (scores.mine > scores.partner) {
    return `${partnerName}, pode correr: eu tô na frente e não vou aliviar.`
  }
  if (scores.mine < scores.partner) {
    return 'Aproveita enquanto dá… já já eu vou passar.'
  }
  return `${partnerName}, empatou. O próximo avanço decide quem provoca quem.`
}

function SideNav({ active, onNavigate, user, avatarUrl, onOpenAccount, onLogout }) {
  const items = [
    ['home', Home, 'Início'],
    ['challenges', LayoutList, 'Desafios'],
    ['events', CalendarDays, 'Agenda do casal'],
    ['focus', Focus, 'Foco juntos'],
    ['journey', Trophy, 'Conquistas'],
  ]
  return (
    <aside className="side-nav">
      <Brand />
      <nav aria-label="Navegação principal">
        {items.map(([id, Icon, label]) => (
          <button
            key={id}
            className={active === id ? 'active' : ''}
            onClick={() => onNavigate(id)}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
      <div className="side-footer">
        <button className="account-trigger" onClick={onOpenAccount}>
          <span className="avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : user.name.slice(0, 1)}
          </span>
          <span className="account-trigger-copy">
            <strong>{user.name}</strong>
            <small>Minha conta</small>
          </span>
        </button>
        <button className="side-logout" aria-label="Sair" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}

function JourneyCard({ couple, imageUrl, onSettings }) {
  const names = couple.members.map((member) => member.name).join(' & ')
  const progress = isDemoMode ? couple.jointProgress : 0

  return (
    <article className="journey-card">
      <img
        src={imageUrl || fallbackJourneyImage}
        style={{
          objectPosition: `${couple.photoPositionX ?? 50}% ${couple.photoPositionY ?? 50}%`,
        }}
        onError={(event) => {
          event.currentTarget.src = fallbackJourneyImage
        }}
        alt="Imagem escolhida para representar a jornada da dupla"
      />
      <div className="journey-shade" />
      <button className="journey-settings" onClick={onSettings} aria-label="Abrir configurações">
        <Settings size={17} />
      </button>
      <div className="journey-content">
        <p className="eyebrow light">Nossa jornada</p>
        <h2>{names}</h2>
        <p className="journey-objective">{couple.currentObjective}</p>
        <div className="journey-progress-row">
          <span>Missão conjunta</span>
          <strong>{progress}%</strong>
        </div>
        <div
          className="progress-track on-dark"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="journey-note">
          {progress
            ? 'Vocês já fizeram a parte mais difícil: continuar escolhendo o próximo passo.'
            : 'A primeira missão em dupla chega na próxima etapa. O espaço de vocês já está pronto.'}
        </p>
      </div>
    </article>
  )
}

function ChallengeCard({ challenge, onOpen }) {
  const Icon = challengeIcons[challenge.icon] || Target
  return (
    <article className="challenge-card">
      <div className={`challenge-icon ${challenge.tone}`}>
        <Icon size={20} />
      </div>
      <div className="challenge-main">
        <div className="challenge-meta">
          <span>{challenge.period}</span>
          <span>{challenge.category}</span>
        </div>
        <h3>{challenge.title}</h3>
        <div className="progress-track">
          <span style={{ width: `${challenge.progress}%` }} />
        </div>
        <div className="challenge-detail">
          <span>{challenge.detail}</span>
          <span>{challenge.points} pts/avanço</span>
          <strong>{challenge.progress}%</strong>
        </div>
      </div>
      <button onClick={onOpen} aria-label={`Abrir ${challenge.title}`}>
        <ChevronRight size={18} />
      </button>
    </article>
  )
}

function ChallengeEmptyState({ scope = 'all', onCreate, compact = false }) {
  const scopeLabel =
    scope === 'couple'
      ? 'em casal'
      : scope === 'individual'
        ? 'individual'
        : 'individual ou em casal'

  return (
    <div className={`challenge-empty challenge-empty-guide${compact ? ' compact' : ''}`}>
      <div className="challenge-empty-heading">
        <span><Target size={22} /></span>
        <div>
          <small>Comece do zero</small>
          <h3>Nenhum desafio por aqui ainda.</h3>
          <p>Crie um desafio {scopeLabel} e transforme cada avanço em pontos.</p>
        </div>
      </div>
      <ol className="challenge-empty-steps" aria-label="Como começar nos desafios">
        <li><b>1</b><span>Escolha o tipo</span></li>
        <li><b>2</b><span>Defina uma meta</span></li>
        <li><b>3</b><span>Registre os avanços</span></li>
      </ol>
      <button type="button" className="button primary" onClick={onCreate}>
        <Plus size={16} />
        Criar primeiro desafio
      </button>
    </div>
  )
}

function DynamicMomentCard({
  dengoActivity,
  focusSession,
  nextEvent,
  relationshipStartedOn,
  partnerName,
  completedChallenges,
  onOpen,
}) {
  const relationshipDate = relationshipStartedOn
    ? parseLocalDate(relationshipStartedOn)
    : null
  const nextRelationshipDay = relationshipDate
    ? new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        relationshipDate.getDate(),
      )
    : null
  if (nextRelationshipDay && nextRelationshipDay < new Date()) {
    nextRelationshipDay.setMonth(nextRelationshipDay.getMonth() + 1)
  }

  let moment = {
    eyebrow: 'Próximo momento',
    title: nextEvent?.title || 'O dia de vocês está chegando',
    description: nextEvent
      ? `Faltam ${daysUntil(nextOccurrence(nextEvent))} dias para esse plano.`
      : `Faltam ${daysUntil(nextRelationshipDay)} dias para celebrar mais um mês.`,
    icon: CalendarDays,
    action: 'Abrir agenda',
    panel: 'events',
  }

  if (dengoActivity?.request && !dengoActivity.response) {
    moment = {
      eyebrow: 'Dengo no ar',
      title: `Esperando ${partnerName} responder`,
      description: `Você pediu: “${dengoActivity.request}”`,
      icon: MessageCircleHeart,
      action: 'Ver pedido',
      panel: 'notifications',
    }
  }

  if (dengoActivity?.response) {
    moment = {
      eyebrow: `${partnerName} respondeu`,
      title: dengoActivity.response,
      description: 'Seu pedido de dengo não ficou no vácuo.',
      icon: HeartHandshake,
      action: 'Responder com reação',
      panel: 'notifications',
    }
  }

  if (focusSession.status === 'running' || focusSession.status === 'paused') {
    moment = {
      eyebrow: focusSession.status === 'running' ? 'Foco acontecendo' : 'Foco pausado',
      title: focusSession.task,
      description: `${formatFocusTime(focusSession.remaining)} restantes · ${partnerName} está com você`,
      icon: Clock3,
      action: 'Voltar à sessão',
      panel: 'focus',
    }
  }

  const MomentIcon = moment.icon

  return (
    <section className="moment-card" aria-labelledby="moment-title">
      <div className="moment-heading">
        <span className="moment-live-dot" aria-hidden="true" />
        <p>Agora no Denguinho</p>
        <span>ao vivo</span>
      </div>
      <button className="moment-main" onClick={() => onOpen(moment.panel)}>
        <span className="moment-icon"><MomentIcon size={21} /></span>
        <span className="moment-copy">
          <small>{moment.eyebrow}</small>
          <strong id="moment-title">{moment.title}</strong>
          <span>{moment.description}</span>
        </span>
        <span className="moment-action">
          {moment.action}
          <ChevronRight size={17} />
        </span>
      </button>
      <div className="moment-glance" aria-label="Resumo rápido">
        <span>
          <CalendarDays size={15} />
          <b>{nextEvent ? daysUntil(nextOccurrence(nextEvent)) : daysUntil(nextRelationshipDay)}</b>
          dias para o próximo plano
        </span>
        <span>
          <Trophy size={15} />
          <b>{completedChallenges}</b>
          desafios concluídos
        </span>
        <button onClick={() => onOpen('recap')}>
          Ver semana <ArrowRight size={14} />
        </button>
      </div>
    </section>
  )
}

function SettingsPanel({
  couple,
  onClose,
  onUpdated,
  currentImage,
  theme,
  onThemeChange,
  preferences,
  onPreferenceChange,
}) {
  const [activeTab, setActiveTab] = useState('journey')
  const [objective, setObjective] = useState(couple.currentObjective)
  const [relationshipStartedOn, setRelationshipStartedOn] = useState(
    couple.relationshipStartedOn || '',
  )
  const [photoPosition, setPhotoPosition] = useState({
    x: couple.photoPositionX ?? 50,
    y: couple.photoPositionY ?? 50,
  })
  const [preview, setPreview] = useState(currentImage || fallbackJourneyImage)
  const [selected, setSelected] = useState(null)
  const [cropEditing, setCropEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const selectPhoto = (event) => {
    const file = event.target.files?.[0]
    setMessage('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Use uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('A imagem deve ter no máximo 5 MB.')
      return
    }
    setSelected(file)
    setPreview(URL.createObjectURL(file))
    setPhotoPosition({ x: 50, y: 50 })
    setCropEditing(true)
  }

  const save = async () => {
    setBusy('save')
    setMessage('')
    try {
      let updated = await api.updateCouple(
        objective,
        relationshipStartedOn,
        photoPosition.x,
        photoPosition.y,
      )
      if (selected) updated = await api.uploadPhoto(selected)
      onUpdated(updated, selected ? preview : currentImage)
      setMessage('Mudanças salvas.')
      setCropEditing(false)
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    setBusy('remove')
    try {
      const updated = await api.removePhoto()
      setPreview(fallbackJourneyImage)
      setSelected(null)
      setCropEditing(false)
      onUpdated(updated, fallbackJourneyImage)
      setMessage('Foto removida. O fallback público voltou a aparecer.')
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Denguinho do seu jeito</p>
            <h2 id="settings-title">Configurações</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar configurações">
            <X />
          </button>
        </header>

        <div className="settings-tabs" role="tablist" aria-label="Seções das configurações">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'journey'}
            className={activeTab === 'journey' ? 'active' : ''}
            onClick={() => setActiveTab('journey')}
          >
            Nossa jornada
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'app'}
            className={activeTab === 'app' ? 'active' : ''}
            onClick={() => setActiveTab('app')}
          >
            Aplicativo
          </button>
        </div>

        {activeTab === 'journey' ? (
          <div className="settings-tab-panel" role="tabpanel" aria-label="Nossa jornada">
            <div className="photo-editor crop-editor">
              <div className="crop-preview">
                <img
                  src={preview}
                  alt="Prévia do enquadramento da foto na jornada"
                  style={{ objectPosition: `${photoPosition.x}% ${photoPosition.y}%` }}
                />
                <span>Prévia do cartão</span>
              </div>
              <div className="photo-editor-copy">
                <div>
                  <h3>Foto de destaque</h3>
                  <p>Escolha a foto e ajuste o enquadramento antes de salvar.</p>
                </div>
                <div className="photo-actions">
                  {!cropEditing ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setCropEditing(true)}
                      aria-expanded="false"
                    >
                      <Pencil size={16} />
                      Ajustar foto
                    </button>
                  ) : null}
                  <label className="button secondary">
                    <ImagePlus size={17} />
                    Trocar foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={selectPhoto}
                    />
                  </label>
                  <button className="button ghost-danger" onClick={remove} disabled={busy}>
                    <Trash2 size={17} />
                    Remover
                  </button>
                </div>
              </div>
              {cropEditing ? (
                <div className="crop-controls">
                  <div className="crop-controls-heading">
                    <strong>Ajustar enquadramento</strong>
                    <div className="crop-controls-actions">
                      <button
                        type="button"
                        onClick={() => setPhotoPosition({ x: 50, y: 50 })}
                      >
                        Centralizar
                      </button>
                      <button
                        type="button"
                        className="finish-crop-button"
                        onClick={() => setCropEditing(false)}
                      >
                        Concluir ajuste
                      </button>
                    </div>
                  </div>
                  <div className="crop-axis">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPosition((current) => ({
                          ...current,
                          x: Math.max(0, current.x - 5),
                        }))
                      }
                    >
                      Esquerda
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoPosition.x}
                      onChange={(event) =>
                        setPhotoPosition((current) => ({
                          ...current,
                          x: Number(event.target.value),
                        }))
                      }
                      aria-label="Posição horizontal da foto"
                    />
                    <output>{photoPosition.x}%</output>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPosition((current) => ({
                          ...current,
                          x: Math.min(100, current.x + 5),
                        }))
                      }
                    >
                      Direita
                    </button>
                  </div>
                  <div className="crop-axis">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPosition((current) => ({
                          ...current,
                          y: Math.max(0, current.y - 5),
                        }))
                      }
                    >
                      Topo
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoPosition.y}
                      onChange={(event) =>
                        setPhotoPosition((current) => ({
                          ...current,
                          y: Number(event.target.value),
                        }))
                      }
                      aria-label="Posição vertical da foto"
                    />
                    <output>{photoPosition.y}%</output>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPosition((current) => ({
                          ...current,
                          y: Math.min(100, current.y + 5),
                        }))
                      }
                    >
                      Base
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <label className="objective-field">
              Objetivo atual da dupla
              <textarea
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                maxLength={160}
                rows={3}
              />
              <span>{objective.length}/160</span>
            </label>
            <label className="relationship-field">
              Que dia você começou a namorar com teu dengo?
              <input
                type="date"
                value={relationshipStartedOn}
                max={toDateInputValue(new Date())}
                onChange={(event) => setRelationshipStartedOn(event.target.value)}
                required
              />
              <small>Essa data vira o “nosso dia” na agenda do casal.</small>
            </label>
            {message ? <p className="panel-message">{message}</p> : null}
            <footer>
              <button className="button secondary" onClick={onClose}>
                Agora não
              </button>
              <button
                className="button primary"
                onClick={save}
                disabled={!objective.trim() || !relationshipStartedOn || busy}
              >
                {busy === 'save' ? 'Salvando…' : 'Salvar mudanças'}
              </button>
            </footer>
          </div>
        ) : (
          <div className="settings-tab-panel app-preferences" role="tabpanel" aria-label="Aplicativo">
            <section className="appearance-settings" aria-labelledby="appearance-title">
              <div className="appearance-copy">
                <span className="appearance-icon">
                  {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
                </span>
                <div>
                  <h3 id="appearance-title">Aparência</h3>
                  <p>Escolha como o Denguinho aparece neste celular.</p>
                </div>
              </div>
              <div className="theme-switcher" role="group" aria-label="Tema do aplicativo">
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  aria-pressed={theme === 'light'}
                  onClick={() => onThemeChange('light')}
                >
                  <Sun size={17} />
                  Claro
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  aria-pressed={theme === 'dark'}
                  onClick={() => onThemeChange('dark')}
                >
                  <Moon size={17} />
                  Escuro
                </button>
              </div>
            </section>

            <section className="preference-group" aria-labelledby="home-preferences-title">
              <div className="preference-group-heading">
                <div>
                  <h3 id="home-preferences-title">Tela inicial</h3>
                  <p>Escolha o que aparece quando você abre o Denguinho.</p>
                </div>
              </div>
              <PreferenceToggle
                icon={Medal}
                title="Mostrar placar"
                description="Exibe a pontuação individual e do casal no início."
                checked={preferences.showScore}
                onChange={(checked) => onPreferenceChange('showScore', checked)}
              />
              <PreferenceToggle
                icon={Sparkles}
                title="Lembretes gentis"
                description="Mantém as mensagens de pausa e cuidado."
                checked={preferences.showKindReminder}
                onChange={(checked) =>
                  onPreferenceChange('showKindReminder', checked)
                }
              />
            </section>

            <section className="preference-group" aria-labelledby="notification-preferences-title">
              <div className="preference-group-heading">
                <div>
                  <h3 id="notification-preferences-title">Notificações e interação</h3>
                  <p>Controle quanto conteúdo aparece e como o celular responde.</p>
                </div>
              </div>
              <PreferenceToggle
                icon={Bell}
                title="Mostrar prévia do dengo"
                description="Exibe o conteúdo recebido dentro das notificações."
                checked={preferences.notificationPreview}
                onChange={(checked) =>
                  onPreferenceChange('notificationPreview', checked)
                }
              />
              <PreferenceToggle
                icon={MessageCircleHeart}
                title="Vibrar ao enviar um dengo"
                description="Usa uma vibração curta quando o aparelho permitir."
                checked={preferences.vibration}
                onChange={(checked) => onPreferenceChange('vibration', checked)}
              />
            </section>

            <section className="preference-group" aria-labelledby="accessibility-preferences-title">
              <div className="preference-group-heading">
                <div>
                  <h3 id="accessibility-preferences-title">Acessibilidade</h3>
                  <p>Ajustes para deixar o aplicativo mais confortável.</p>
                </div>
              </div>
              <PreferenceToggle
                icon={Settings}
                title="Reduzir animações"
                description="Diminui transições e movimentos na interface."
                checked={preferences.reducedMotion}
                onChange={(checked) =>
                  onPreferenceChange('reducedMotion', checked)
                }
              />
            </section>

            <p className="preferences-saved-note">
              <Check size={16} />
              Preferências salvas automaticamente neste aparelho.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function AccountPanel({ user, avatarUrl, onClose, onUpdated }) {
  const [name, setName] = useState(user.name)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [localPreview, setLocalPreview] = useState(null)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [recoveryBusy, setRecoveryBusy] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0]
    setProfileMessage('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileMessage('Use uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage('A imagem deve ter no máximo 5 MB.')
      return
    }
    setSelectedAvatar(file)
    setLocalPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileBusy(true)
    setProfileMessage('')
    try {
      let updated = await api.updateProfile(name.trim())
      let nextAvatarUrl = avatarUrl
      if (selectedAvatar) {
        updated = await api.uploadAvatar(selectedAvatar)
        nextAvatarUrl = await api.getAvatarUrl()
      }
      onUpdated(updated, nextAvatarUrl)
      setSelectedAvatar(null)
      setLocalPreview(null)
      setProfileMessage('Perfil atualizado.')
    } catch (requestError) {
      setProfileMessage(requestError.message)
    } finally {
      setProfileBusy(false)
    }
  }

  const removeAvatar = async () => {
    setProfileBusy(true)
    setProfileMessage('')
    try {
      const updated = await api.removeAvatar()
      setSelectedAvatar(null)
      setLocalPreview(null)
      onUpdated(updated, null)
      setProfileMessage('Foto de perfil removida.')
    } catch (requestError) {
      setProfileMessage(requestError.message)
    } finally {
      setProfileBusy(false)
    }
  }

  const requestRecovery = async (event) => {
    event.preventDefault()
    setRecoveryMessage('')
    setRecoveryBusy(true)
    try {
      await api.requestPasswordRecovery(user.email)
      setRecoveryMessage(`Instruções enviadas para ${user.email}.`)
    } catch (requestError) {
      setRecoveryMessage(requestError.message)
    } finally {
      setRecoveryBusy(false)
    }
  }

  const preview = localPreview || avatarUrl

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel account-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Seu perfil</p>
            <h2 id="account-title">Minha conta</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar minha conta">
            <X />
          </button>
        </header>

        <div className="account-content">
          <form className="account-section" onSubmit={saveProfile}>
            <div className="account-section-heading">
              <UserRound size={19} />
              <div>
                <h3>Informações pessoais</h3>
                <p>É assim que seu nome e sua foto aparecem para o seu dengo.</p>
              </div>
            </div>

            <div className="avatar-editor">
              <span className="account-avatar">
                {preview ? <img src={preview} alt="Prévia da foto de perfil" /> : name.slice(0, 1)}
              </span>
              <div>
                <strong>Foto de perfil</strong>
                <p>JPG, PNG ou WebP. Até 5 MB.</p>
                <div className="photo-actions">
                  <label className="button secondary">
                    <ImagePlus size={16} />
                    Trocar foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={chooseAvatar}
                    />
                  </label>
                  <button
                    type="button"
                    className="button ghost-danger"
                    onClick={removeAvatar}
                    disabled={profileBusy || (!preview && !user.hasAvatar)}
                  >
                    <Trash2 size={16} />
                    Remover
                  </button>
                </div>
              </div>
            </div>

            <div className="account-fields">
              <label>
                Seu nome
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                E-mail
                <input value={user.email} readOnly aria-readonly="true" />
                <small>O e-mail continua sendo usado para entrar.</small>
              </label>
            </div>
            {profileMessage ? <p className="panel-message">{profileMessage}</p> : null}
            <button
              className="button primary account-submit"
              disabled={profileBusy || !name.trim()}
            >
              {profileBusy ? 'Salvando…' : 'Salvar perfil'}
            </button>
          </form>

          <section className="account-section security-section">
            <div className="account-section-heading">
              <KeyRound size={19} />
              <div>
                <h3>Recuperação da conta</h3>
                <p>As opções só aparecem quando você pedir ajuda para entrar.</p>
              </div>
            </div>
            {recoveryMessage ? <p className="panel-message">{recoveryMessage}</p> : null}
            {recoveryOpen ? (
              <form className="security-form recovery-form" onSubmit={requestRecovery}>
                <div className="recovery-destination">
                  <Mail size={18} />
                  <div>
                    <strong>Receber por e-mail</strong>
                    <p>Vamos enviar as instruções para <b>{user.email}</b>.</p>
                  </div>
                </div>
                <div className="security-form-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setRecoveryOpen(false)
                      setRecoveryMessage('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button className="button primary" disabled={recoveryBusy}>
                    {recoveryBusy ? 'Enviando…' : 'Enviar instruções'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="security-entry-button"
                onClick={() => {
                  setRecoveryMessage('')
                  setRecoveryOpen(true)
                }}
              >
                <span>Esqueci minha senha</span>
                <ChevronRight size={18} />
              </button>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

function ActionPanel({
  view,
  challenge,
  onClose,
  onOpen,
  onOpenSettings,
  onOpenAccount,
  onLogout,
  partnerName,
  lastDengoRequest,
  dynamicState,
  notificationPreview,
  onSendDengo,
  onRespondDengo,
  onReact,
  onStartFocus,
  onToggleFocus,
  onFinishFocus,
  onSetFocusFeeling,
  onAcceptSurprise,
  onCompleteSurprise,
  challenges,
  scores,
  userName,
  onAddChallenge,
  onAdvanceChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  events,
  relationshipStartedOn,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [selectedDengo, setSelectedDengo] = useState('')
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [focusTask, setFocusTask] = useState('')
  const [focusFeeling, setFocusFeeling] = useState('')
  const [message, setMessage] = useState('')
  const [challengeScope, setChallengeScope] = useState('individual')
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [editingEventId, setEditingEventId] = useState('')
  const [confirmingEventId, setConfirmingEventId] = useState('')
  const [editingChallenge, setEditingChallenge] = useState(false)
  const [confirmingChallengeDelete, setConfirmingChallengeDelete] = useState(false)
  const [challengeDraft, setChallengeDraft] = useState(() => ({
    title: challenge?.title || '',
    period: challenge?.period || 'Semanal',
    category: challenge?.category || 'Outros',
    goal: challenge?.goal || 1,
  }))
  const [eventBusy, setEventBusy] = useState('')
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    period: 'Semanal',
    goal: 4,
  })
  const [newEvent, setNewEvent] = useState({
    title: '',
    eventDate: defaultEventDate,
    recurrence: 'NONE',
  })
  const [eventDraft, setEventDraft] = useState({
    title: '',
    eventDate: defaultEventDate,
    recurrence: 'NONE',
  })

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const headings = {
    dengo: ['Denguinho', 'Tô precisando de dengo, não vê?'],
    notifications: ['Novidades de vocês', 'Notificações'],
    challenges: ['Metas em andamento', 'Todos os desafios'],
    challenge: ['Detalhes do desafio', challenge?.title || 'Desafio'],
    events: ['Tempo de vocês', 'Agenda do casal'],
    focus: ['Presença vale ponto', 'Preparar foco juntos'],
    journey: ['Caminho compartilhado', 'Conquistas'],
    recap: ['A semana de vocês', 'Retrospectiva'],
    surprise: ['Uma ideia só de vocês', 'Surpresa do mês'],
    more: ['Seu espaço', 'Mais opções'],
  }
  const [eyebrow, title] = headings[view] || headings.more
  const visibleChallenges = challenges.filter((item) => item.scope === challengeScope)
  const individualRanking = [
    { id: 'mine', name: userName, points: scores.mine, isMine: true },
    { id: 'partner', name: partnerName, points: scores.partner, isMine: false },
  ].sort((first, second) => second.points - first.points)
  const individualScoresTied = scores.mine === scores.partner
  const sortedEvents = [...events].sort(
    (first, second) => nextOccurrence(first) - nextOccurrence(second),
  )
  const relationshipDate = relationshipStartedOn
    ? parseLocalDate(relationshipStartedOn)
    : null
  const hasJourneyActivity =
    challenges.some((item) => item.current > 0) ||
    scores.mine + scores.partner + scores.couple > 0 ||
    dynamicState.focusSession.status === 'completed'

  const submitChallenge = (event) => {
    event.preventDefault()
    const trimmedTitle = newChallenge.title.trim()
    if (!trimmedTitle) return
    onAddChallenge({
      title: trimmedTitle,
      period: newChallenge.period,
      goal: Number(newChallenge.goal),
      scope: challengeScope,
    })
    setNewChallenge({ title: '', period: 'Semanal', goal: 4 })
    setCreatingChallenge(false)
    setMessage('Novo desafio adicionado.')
  }

  const submitEvent = async (event) => {
    event.preventDefault()
    setEventBusy('create')
    setMessage('')
    try {
      await onAddEvent(newEvent)
      setNewEvent({
        title: '',
        eventDate: defaultEventDate,
        recurrence: 'NONE',
      })
      setCreatingEvent(false)
      setMessage('Evento guardado na agenda de vocês.')
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setEventBusy('')
    }
  }

  const submitEventEdit = async (event) => {
    event.preventDefault()
    setEventBusy(editingEventId)
    setMessage('')
    try {
      await onUpdateEvent(editingEventId, eventDraft)
      setEditingEventId('')
      setMessage('Evento atualizado na agenda de vocês.')
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setEventBusy('')
    }
  }

  const submitChallengeEdit = (event) => {
    event.preventDefault()
    const trimmedTitle = challengeDraft.title.trim()
    if (!challenge || !trimmedTitle) return
    onUpdateChallenge(challenge.id, {
      title: trimmedTitle,
      period: challengeDraft.period,
      category: challengeDraft.category,
      goal: Number(challengeDraft.goal),
    })
    setEditingChallenge(false)
    setMessage('Alterações do desafio salvas.')
  }

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel action-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-panel-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="action-panel-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar painel">
            <X />
          </button>
        </header>

        <div className="action-panel-content">
          {view === 'dengo' ? (
            <>
              <p>Escolha um jeitinho de chamar seu dengo.</p>
              <div className="choice-grid" aria-label="Tipo de dengo">
                {['Um cheiro', 'Cadê meu denguinho?', 'Quando vou ver meu dengo?'].map((option) => (
                  <button
                    key={option}
                    className={selectedDengo === option ? 'selected' : ''}
                    onClick={() => {
                      setSelectedDengo(option)
                      setMessage('')
                    }}
                  >
                    <MessageCircleHeart size={19} />
                    {option}
                  </button>
                ))}
              </div>
              <button
                className="button primary wide"
                disabled={!selectedDengo}
                onClick={() => {
                  onSendDengo(selectedDengo)
                  setMessage(`${partnerName} recebeu uma notificação.`)
                }}
              >
                Avisar meu dengo
              </button>
            </>
          ) : null}

          {view === 'notifications' ? (
            <div className="notification-list">
              {lastDengoRequest ? (
                <article className="notification-dengo">
                  <span><MessageCircleHeart size={18} /></span>
                  <div>
                    <strong>Pedido de dengo enviado</strong>
                    <p>
                      {notificationPreview
                        ? `${partnerName} recebeu: “${lastDengoRequest}”`
                        : 'O conteúdo da mensagem está oculto.'}
                    </p>
                    {dynamicState.dengoActivity?.response ? (
                      <div className="dengo-response">
                        <small>{partnerName} respondeu</small>
                        <b>{dynamicState.dengoActivity.response}</b>
                      </div>
                    ) : (
                      <div className="quick-replies" aria-label="Respostas rápidas do dengo">
                        {['Tô indo', 'Um cheiro', 'Me chama'].map((reply) => (
                          <button key={reply} onClick={() => onRespondDengo(reply)}>
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="reaction-row" aria-label="Reagir ao dengo">
                      {[
                        ['❤️', 'Coração'],
                        ['🥰', 'Carinho'],
                        ['😂', 'Risada'],
                        ['✨', 'Comemoração'],
                      ].map(([emoji, label]) => (
                        <button
                          key={label}
                          aria-label={label}
                          className={dynamicState.dengoActivity?.reaction === emoji ? 'active' : ''}
                          onClick={() => onReact(emoji, 'dengo')}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ) : null}
              {dynamicState.focusSession.status === 'completed' ? (
                <article>
                  <span><PartyPopper size={18} /></span>
                  <div>
                    <strong>Foco concluído</strong>
                    <p>
                      Vocês terminaram “{dynamicState.focusSession.task}” e ganharam pontos em casal.
                    </p>
                  </div>
                </article>
              ) : null}
              {!lastDengoRequest && dynamicState.focusSession.status !== 'completed' ? (
                <div className="challenge-empty">
                  <Bell size={22} />
                  <p>Nenhuma novidade ainda. As interações de vocês aparecerão aqui.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {view === 'challenges' ? (
            <>
              <div className="challenge-score-grid" aria-label="Pontos dos desafios">
                {individualRanking.map((player, index) => (
                  <article
                    key={player.id}
                    className={!individualScoresTied && index === 0 ? 'ranking-leader' : ''}
                  >
                    <span className={`mini-avatar ${player.isMine ? '' : 'partner'}`}>
                      {player.name.slice(0, 1)}
                    </span>
                    <div>
                      <small>
                        {individualScoresTied ? 'Empate' : `${index + 1}º`} ·{' '}
                        {player.isMine ? 'Você' : 'Individual'}
                      </small>
                      <strong>{player.name}</strong>
                      <b>{player.points} pts</b>
                    </div>
                  </article>
                ))}
                <article className="couple-score-card">
                  <span className="mini-avatar partner"><HeartHandshake size={17} /></span>
                  <div>
                    <small>Pontos em casal</small>
                    <strong>{partnerName} & {userName}</strong>
                    <b>{scores.couple} pts</b>
                  </div>
                </article>
              </div>

              <div className="challenge-toolbar">
                <div className="challenge-tabs" role="tablist" aria-label="Tipo de desafio">
                  <button
                    role="tab"
                    aria-selected={challengeScope === 'individual'}
                    className={challengeScope === 'individual' ? 'active' : ''}
                    onClick={() => {
                      setChallengeScope('individual')
                      setCreatingChallenge(false)
                      setMessage('')
                    }}
                  >
                    Individuais
                  </button>
                  <button
                    role="tab"
                    aria-selected={challengeScope === 'couple'}
                    className={challengeScope === 'couple' ? 'active' : ''}
                    onClick={() => {
                      setChallengeScope('couple')
                      setCreatingChallenge(false)
                      setMessage('')
                    }}
                  >
                    Em casal
                  </button>
                </div>
                <button
                  className="new-challenge-button"
                  onClick={() => {
                    setCreatingChallenge((current) => !current)
                    setMessage('')
                  }}
                >
                  <Plus size={16} />
                  Novo desafio
                </button>
              </div>

              {creatingChallenge ? (
                <form className="new-challenge-form" onSubmit={submitChallenge}>
                  <label>
                    Nome do desafio
                    <input
                      value={newChallenge.title}
                      onChange={(event) =>
                        setNewChallenge((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder={
                        challengeScope === 'couple'
                          ? 'Ex.: Cozinhar juntos'
                          : 'Ex.: Ler 20 páginas'
                      }
                      maxLength={80}
                      required
                    />
                  </label>
                  <div className="challenge-form-row">
                    <label>
                      Frequência
                      <select
                        value={newChallenge.period}
                        onChange={(event) =>
                          setNewChallenge((current) => ({ ...current, period: event.target.value }))
                        }
                      >
                        <option>Semanal</option>
                        <option>Mensal</option>
                      </select>
                    </label>
                    <label>
                      Qual é a meta?
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newChallenge.goal}
                        onChange={(event) =>
                          setNewChallenge((current) => ({ ...current, goal: event.target.value }))
                        }
                        required
                      />
                      <small className="field-hint">
                        Ex.: 4 aulas, 3 sessões ou 8 tarefas.
                      </small>
                    </label>
                  </div>
                  <p>
                    Cada avanço vale {challengeScope === 'couple' ? 40 : 25} pontos no placar{' '}
                    {challengeScope === 'couple' ? 'do casal' : 'individual'}.
                  </p>
                  <div className="challenge-form-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setCreatingChallenge(false)}
                    >
                      Cancelar
                    </button>
                    <button className="button primary">Adicionar desafio</button>
                  </div>
                </form>
              ) : (
                <div className="challenge-list panel-challenges" role="tabpanel">
                  {visibleChallenges.length ? (
                    visibleChallenges.map((item) => (
                      <ChallengeCard
                        key={item.id}
                        challenge={item}
                        onOpen={() => onOpen('challenge', item)}
                      />
                    ))
                  ) : (
                    <ChallengeEmptyState
                      scope={challengeScope}
                      onCreate={() => {
                        setCreatingChallenge(true)
                        setMessage('')
                      }}
                    />
                  )}
                </div>
              )}
            </>
          ) : null}

          {view === 'events' ? (
            <>
              {relationshipDate ? (
                <article className="relationship-date-card">
                  <span className="relationship-day">
                    {`${relationshipDate.getDate()}`.padStart(2, '0')}
                  </span>
                  <div>
                    <p>Nosso dia</p>
                    <h3>
                      Todo dia {relationshipDate.getDate()}, mais um mês da história de vocês.
                    </h3>
                    <span>
                      Desde{' '}
                      {relationshipDate.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <HeartHandshake size={23} />
                </article>
              ) : null}

              <div className="agenda-toolbar">
                <div>
                  <strong>Próximos momentos</strong>
                  <span>{events.length} {events.length === 1 ? 'evento' : 'eventos'}</span>
                </div>
                <button
                  className="new-challenge-button"
                  onClick={() => {
                    setCreatingEvent((current) => !current)
                    setEditingEventId('')
                    setConfirmingEventId('')
                    setMessage('')
                  }}
                >
                  <Plus size={16} />
                  Novo evento
                </button>
              </div>

              {creatingEvent ? (
                <form className="new-challenge-form event-form" onSubmit={submitEvent}>
                  <label>
                    O que vocês vão fazer?
                    <input
                      value={newEvent.title}
                      onChange={(event) =>
                        setNewEvent((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Ex.: Ir à praia"
                      maxLength={100}
                      required
                    />
                  </label>
                  <div className="challenge-form-row">
                    <label>
                      Quando?
                      <input
                        type="date"
                        value={newEvent.eventDate}
                        onChange={(event) =>
                          setNewEvent((current) => ({
                            ...current,
                            eventDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Vai se repetir?
                      <select
                        value={newEvent.recurrence}
                        onChange={(event) =>
                          setNewEvent((current) => ({
                            ...current,
                            recurrence: event.target.value,
                          }))
                        }
                      >
                        <option value="NONE">Não repete</option>
                        <option value="MONTHLY">Todo mês</option>
                        <option value="YEARLY">Todo ano</option>
                      </select>
                    </label>
                  </div>
                  <div className="challenge-form-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setCreatingEvent(false)}
                    >
                      Cancelar
                    </button>
                    <button className="button primary" disabled={eventBusy === 'create'}>
                      {eventBusy === 'create' ? 'Guardando…' : 'Adicionar à agenda'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {editingEventId ? (
                    <form
                      className="new-challenge-form event-form event-edit-form"
                      onSubmit={submitEventEdit}
                    >
                      <div className="event-edit-heading">
                        <div>
                          <strong>Editar evento</strong>
                          <span>Atualize os detalhes desse momento.</span>
                        </div>
                        <Pencil size={18} />
                      </div>
                      <label>
                        O que vocês vão fazer?
                        <input
                          value={eventDraft.title}
                          onChange={(event) =>
                            setEventDraft((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          maxLength={100}
                          required
                        />
                      </label>
                      <div className="challenge-form-row">
                        <label>
                          Quando?
                          <input
                            type="date"
                            value={eventDraft.eventDate}
                            onChange={(event) =>
                              setEventDraft((current) => ({
                                ...current,
                                eventDate: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Vai se repetir?
                          <select
                            value={eventDraft.recurrence}
                            onChange={(event) =>
                              setEventDraft((current) => ({
                                ...current,
                                recurrence: event.target.value,
                              }))
                            }
                          >
                            <option value="NONE">Não repete</option>
                            <option value="MONTHLY">Todo mês</option>
                            <option value="YEARLY">Todo ano</option>
                          </select>
                        </label>
                      </div>
                      <div className="challenge-form-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setEditingEventId('')}
                        >
                          Cancelar
                        </button>
                        <button
                          className="button primary"
                          disabled={eventBusy === editingEventId}
                        >
                          {eventBusy === editingEventId ? 'Salvando…' : 'Salvar evento'}
                        </button>
                      </div>
                    </form>
                  ) : null}
                  <div className="agenda-list">
                    {sortedEvents.length ? (
                      sortedEvents.map((event) => {
                        const occurrence = nextOccurrence(event)
                        return (
                          <article className="agenda-event" key={event.id}>
                            <time dateTime={toDateInputValue(occurrence)}>
                              <strong>{`${occurrence.getDate()}`.padStart(2, '0')}</strong>
                              <span>
                                {occurrence
                                  .toLocaleDateString('pt-BR', { month: 'short' })
                                  .replace('.', '')}
                              </span>
                            </time>
                            <div>
                              <h3>{event.title}</h3>
                              <p>
                                <CalendarDays size={14} />
                                {recurrenceLabel(event.recurrence)}
                              </p>
                            </div>
                            <div className="agenda-actions">
                              <button
                                className="agenda-edit"
                                aria-label={`Editar ${event.title}`}
                                onClick={() => {
                                  setEditingEventId(event.id)
                                  setConfirmingEventId('')
                                  setEventDraft({
                                    title: event.title,
                                    eventDate: event.eventDate,
                                    recurrence: event.recurrence,
                                  })
                                  setMessage('')
                                }}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="agenda-delete"
                                aria-label={`Excluir ${event.title}`}
                                disabled={eventBusy === event.id}
                                onClick={() => {
                                  setConfirmingEventId(event.id)
                                  setEditingEventId('')
                                  setMessage('')
                                }}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                            {confirmingEventId === event.id ? (
                              <div className="event-delete-confirmation" role="alert">
                                <div>
                                  <strong>Excluir “{event.title}”?</strong>
                                  <span>Essa ação remove o evento da agenda do casal.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingEventId('')}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="confirm-delete"
                                  onClick={async () => {
                                    setEventBusy(event.id)
                                    try {
                                      await onDeleteEvent(event.id)
                                      setConfirmingEventId('')
                                      setMessage('Evento excluído da agenda.')
                                    } catch (requestError) {
                                      setMessage(requestError.message)
                                    } finally {
                                      setEventBusy('')
                                    }
                                  }}
                                >
                                  {eventBusy === event.id ? 'Excluindo…' : 'Excluir'}
                                </button>
                              </div>
                            ) : null}
                          </article>
                        )
                      })
                    ) : (
                      <div className="challenge-empty">
                        <CalendarDays size={22} />
                        <p>A agenda está livre. Qual vai ser o primeiro rolê?</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}

          {view === 'challenge' && challenge ? (
            <>
              <div className="challenge-detail-toolbar">
                <span>
                  {challenge.scope === 'couple' ? 'Desafio em casal' : 'Desafio individual'}
                </span>
                <div className="challenge-detail-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChallenge((current) => !current)
                      setConfirmingChallengeDelete(false)
                      setMessage('')
                    }}
                  >
                    <Settings size={16} />
                    {editingChallenge ? 'Fechar edição' : 'Editar desafio'}
                  </button>
                  <button
                    type="button"
                    className="challenge-delete-trigger"
                    aria-label={`Excluir ${challenge.title}`}
                    onClick={() => {
                      setConfirmingChallengeDelete(true)
                      setEditingChallenge(false)
                      setMessage('')
                    }}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
              {confirmingChallengeDelete ? (
                <div className="event-delete-confirmation challenge-delete-confirmation" role="alert">
                  <div>
                    <strong>Excluir “{challenge.title}”?</strong>
                    <span>O desafio será removido, mas os pontos conquistados continuam no placar.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingChallengeDelete(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="confirm-delete"
                    onClick={() => {
                      onDeleteChallenge(challenge.id)
                      onClose()
                    }}
                  >
                    Excluir desafio
                  </button>
                </div>
              ) : null}
              {editingChallenge ? (
                <form
                  className="new-challenge-form challenge-edit-form"
                  onSubmit={submitChallengeEdit}
                >
                  <label>
                    Nome do desafio
                    <input
                      value={challengeDraft.title}
                      onChange={(event) =>
                        setChallengeDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      maxLength={80}
                      required
                    />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={challengeDraft.category}
                      onChange={(event) =>
                        setChallengeDraft((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    >
                      {challengeCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <div className="challenge-form-row">
                    <label>
                      Frequência
                      <select
                        value={challengeDraft.period}
                        onChange={(event) =>
                          setChallengeDraft((current) => ({
                            ...current,
                            period: event.target.value,
                          }))
                        }
                      >
                        <option>Semanal</option>
                        <option>Mensal</option>
                      </select>
                    </label>
                    <label>
                      Meta total
                      <input
                        type="number"
                        min={Math.max(1, challenge.current)}
                        max="20"
                        value={challengeDraft.goal}
                        onChange={(event) =>
                          setChallengeDraft((current) => ({
                            ...current,
                            goal: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                  </div>
                  <small className="challenge-edit-note">
                    O progresso atual será mantido. A meta não pode ficar abaixo dos avanços já registrados.
                  </small>
                  <div className="challenge-edit-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setChallengeDraft({
                          title: challenge.title,
                          period: challenge.period,
                          category: challenge.category,
                          goal: challenge.goal,
                        })
                        setEditingChallenge(false)
                      }}
                    >
                      Cancelar
                    </button>
                    <button className="button primary">
                      <Check size={17} />
                      Salvar alterações
                    </button>
                  </div>
                </form>
              ) : null}
              <div className="challenge-summary">
                <span>{challenge.period}</span>
                <strong>{challenge.progress}% concluído</strong>
                <div className="progress-track">
                  <span style={{ width: `${challenge.progress}%` }} />
                </div>
                <p>{challenge.detail}. Cada avanço conta.</p>
              </div>
              <button
                className="button primary wide"
                disabled={challenge.current >= challenge.goal}
                onClick={() => {
                  const advanced = onAdvanceChallenge(challenge.id)
                  setMessage(
                    advanced
                      ? `Avanço registrado: +${challenge.points} pontos.`
                      : 'Esse desafio já foi concluído.',
                  )
                }}
              >
                <Check size={18} />
                {challenge.current >= challenge.goal ? 'Desafio concluído' : 'Registrar avanço'}
              </button>
              <div className="challenge-reactions">
                <span>Mandar energia para esse desafio</span>
                <div className="reaction-row">
                  {['👏', '🔥', '💛'].map((emoji) => (
                    <button
                      key={emoji}
                      aria-label={`Reagir com ${emoji}`}
                      onClick={() => {
                        onReact(emoji, challenge.title)
                        setMessage(`Reação ${emoji} enviada para ${partnerName}.`)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {view === 'focus' ? (
            <>
              {dynamicState.focusSession.status === 'idle' ||
              dynamicState.focusSession.status === 'completed' ? (
                <>
                  <p>Escolham uma tarefa, definam o tempo e façam companhia um ao outro.</p>
                  <label className="focus-task-field">
                    No que vocês vão focar?
                    <input
                      value={focusTask}
                      onChange={(event) => setFocusTask(event.target.value)}
                      placeholder="Ex.: organizar as próximas tarefas"
                      maxLength={90}
                    />
                  </label>
                  <div className="focus-options" aria-label="Duração da sessão">
                    {[15, 25, 45].map((minutes) => (
                      <button
                        key={minutes}
                        className={focusMinutes === minutes ? 'selected' : ''}
                        onClick={() => {
                          setFocusMinutes(minutes)
                          setMessage('')
                        }}
                      >
                        <strong>{minutes}</strong>
                        <span>min</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="button primary wide"
                    disabled={!focusTask.trim()}
                    onClick={() => {
                      onStartFocus(focusTask.trim(), focusMinutes)
                      setMessage(`${partnerName} entrou na sessão com você.`)
                    }}
                  >
                    <Focus size={18} />
                    Começar juntos
                  </button>
                </>
              ) : (
                <div className="focus-live">
                  <div className={`focus-live-orbit ${dynamicState.focusSession.status}`}>
                    <span>{formatFocusTime(dynamicState.focusSession.remaining)}</span>
                    <small>{dynamicState.focusSession.status === 'paused' ? 'pausado' : 'juntos'}</small>
                  </div>
                  <p className="focus-live-task">{dynamicState.focusSession.task}</p>
                  <div className="partner-presence">
                    <span>{partnerName.slice(0, 1)}</span>
                    <div>
                      <strong>{partnerName} está nessa com você</strong>
                      <small>Presença confirmada agora</small>
                    </div>
                  </div>
                  <div className="focus-live-actions">
                    <button className="button secondary" onClick={onToggleFocus}>
                      {dynamicState.focusSession.status === 'paused' ? (
                        <><Play size={17} /> Continuar</>
                      ) : (
                        <><Pause size={17} /> Pausar</>
                      )}
                    </button>
                    <button className="button primary" onClick={onFinishFocus}>
                      <Check size={17} /> Concluir
                    </button>
                  </div>
                </div>
              )}
              {dynamicState.focusSession.status === 'completed' ? (
                <div className="focus-feeling">
                  <PartyPopper size={20} />
                  <div>
                    <strong>+25 pontos para o casal</strong>
                    <p>Como você se sentiu nessa sessão?</p>
                  </div>
                  <div className="feeling-options">
                    {['Leve', 'Focado', 'Cansado'].map((feeling) => (
                      <button
                        key={feeling}
                        className={
                          (focusFeeling || dynamicState.focusSession.feeling) === feeling
                            ? 'active'
                            : ''
                        }
                        onClick={() => {
                          setFocusFeeling(feeling)
                          onSetFocusFeeling(feeling)
                        }}
                      >
                        {feeling}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {view === 'journey' ? (
            <div className="achievement-list">
              {scores.mine + scores.partner + scores.couple > 0 ? (
                <article>
                  <Medal size={22} />
                  <div>
                    <strong>Primeiros pontos</strong>
                    <p>Os avanços de vocês já começaram a movimentar o placar.</p>
                  </div>
                </article>
              ) : null}
              {challenges.some((item) => item.progress === 100) ? (
                <article>
                  <Flame size={22} />
                  <div>
                    <strong>Desafio concluído</strong>
                    <p>Uma meta já saiu da lista e virou conquista.</p>
                  </div>
                </article>
              ) : null}
              {events.length ? (
                <article>
                  <Trophy size={22} />
                  <div>
                    <strong>Primeiro plano em dupla</strong>
                    <p>A agenda de vocês já ganhou um momento especial.</p>
                  </div>
                </article>
              ) : null}
              {!hasJourneyActivity && !events.length ? (
                <div className="challenge-empty">
                  <Trophy size={22} />
                  <p>Nenhuma conquista ainda. Os primeiros momentos aparecerão aqui.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {view === 'recap' ? (
            <div className="recap-content">
              <section className="recap-hero">
                <span><PartyPopper size={24} /></span>
                <div>
                  <p className="eyebrow">Resumo da semana</p>
                  <h3>
                    {hasJourneyActivity
                      ? 'Vocês continuaram escolhendo o próximo passo.'
                      : 'A primeira semana de vocês começa agora.'}
                  </h3>
                </div>
              </section>
              <div className="recap-stats">
                <article>
                  <strong>{challenges.filter((item) => item.progress === 100).length}</strong>
                  <span>desafios concluídos</span>
                </article>
                <article>
                  <strong>{scores.mine + scores.partner}</strong>
                  <span>pontos individuais</span>
                </article>
                <article>
                  <strong>{scores.couple}</strong>
                  <span>pontos em casal</span>
                </article>
              </div>
              <section className="recap-highlight">
                <Medal size={20} />
                <div>
                  <strong>Momento da semana</strong>
                  <p>
                    {dynamicState.focusSession.status === 'completed'
                      ? `A sessão “${dynamicState.focusSession.task}” virou presença e ponto.`
                      : hasJourneyActivity
                        ? 'Cada avanço registrado ajuda a contar a história desta semana.'
                        : 'Quando vocês registrarem o primeiro avanço, ele aparecerá aqui.'}
                  </p>
                </div>
              </section>
              <button className="button secondary wide" onClick={() => onReact('💛', 'semana')}>
                <SmilePlus size={18} />
                Guardar com um coração
              </button>
            </div>
          ) : null}

          {view === 'surprise' ? (
            <div className="surprise-content">
              <div className="surprise-seal">
                <Gift size={34} />
                <span>{new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
              </div>
              <p className="eyebrow">Uma ideia fora da rotina</p>
              <h3>{dynamicState.surprise.title}</h3>
              <p>{dynamicState.surprise.description}</p>
              <div className="surprise-rules">
                <span>Sem pontuação</span>
                <span>Sem cobrança</span>
                <span>Só vocês</span>
              </div>
              {!dynamicState.surprise.accepted ? (
                <button className="button primary wide" onClick={onAcceptSurprise}>
                  <HeartHandshake size={18} />
                  Topamos essa
                </button>
              ) : (
                <div className="surprise-accepted">
                  <Check size={20} />
                  <div>
                    <strong>Combinado guardado</strong>
                    <p>Agora é só escolher quando e aproveitar.</p>
                  </div>
                  {!dynamicState.surprise.completed ? (
                    <button onClick={onCompleteSurprise}>Já fizemos</button>
                  ) : (
                    <span>Feito 💛</span>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {view === 'more' ? (
            <div className="more-actions">
              <button onClick={onOpenAccount}>
                <UserRound size={20} />
                <span><strong>Minha conta</strong><small>Foto, nome e senha</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => onOpen('journey')}>
                <Trophy size={20} />
                <span><strong>Conquistas</strong><small>Relembre o progresso de vocês</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => onOpen('recap')}>
                <PartyPopper size={20} />
                <span><strong>Retrospectiva</strong><small>O melhor da semana de vocês</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => onOpen('surprise')}>
                <Gift size={20} />
                <span><strong>Surpresa do mês</strong><small>Uma ideia leve para fazer juntos</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={onOpenSettings}>
                <Settings size={20} />
                <span><strong>Configurações</strong><small>Jornada, aparência e preferências</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => onOpen('notifications')}>
                <Bell size={20} />
                <span><strong>Notificações</strong><small>Veja as novidades de vocês</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={onLogout}>
                <LogOut size={20} />
                <span><strong>Sair</strong><small>Voltar para a entrada</small></span>
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}

          {message ? <p className="panel-message success-message" role="status">{message}</p> : null}
        </div>
      </section>
    </div>
  )
}

function MobileNav({ active, onNavigate }) {
  const items = [
    ['home', Home, 'Início'],
    ['challenges', LayoutList, 'Desafios'],
    ['events', CalendarDays, 'Agenda'],
    ['focus', Focus, 'Foco'],
    ['more', Menu, 'Mais'],
  ]

  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {items.map(([id, Icon, label]) => (
        <button
          key={id}
          className={`${id === 'focus' ? 'focus-mobile ' : ''}${active === id ? 'active' : ''}`.trim()}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function Dashboard({
  user,
  initialCouple,
  onLogout,
  theme,
  onThemeChange,
  preferences,
  onPreferenceChange,
}) {
  const [currentUser, setCurrentUser] = useState(user)
  const [couple, setCouple] = useState(initialCouple)
  const [imageUrl, setImageUrl] = useState(fallbackJourneyImage)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [panel, setPanel] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [dynamicState, setDynamicState] = useState(loadDynamicState)
  const [lastDengoRequest, setLastDengoRequest] = useState(
    dynamicState.dengoActivity?.request || '',
  )
  const [challenges, setChallenges] = useState(loadDemoChallenges)
  const [scores, setScores] = useState(loadDemoScores)
  const [events, setEvents] = useState([])

  const sendDengoRequest = (request) => {
    setLastDengoRequest(request)
    setDynamicState((current) => ({
      ...current,
      dengoActivity: {
        request,
        response: '',
        reaction: '',
        sentAt: Date.now(),
      },
    }))
    if (preferences.vibration && 'vibrate' in navigator) {
      navigator.vibrate(45)
    }
  }

  const respondDengo = (response) => {
    setDynamicState((current) => ({
      ...current,
      dengoActivity: {
        ...current.dengoActivity,
        response,
        respondedAt: Date.now(),
      },
    }))
  }

  const reactToMoment = (reaction, target) => {
    setDynamicState((current) => ({
      ...current,
      dengoActivity:
        target === 'dengo' && current.dengoActivity
          ? { ...current.dengoActivity, reaction }
          : current.dengoActivity,
      lastReaction: {
        reaction,
        target,
        sentAt: Date.now(),
      },
    }))
  }

  const startFocus = (task, duration) => {
    setDynamicState((current) => ({
      ...current,
      focusSession: {
        task,
        duration,
        remaining: duration * 60,
        status: 'running',
        partnerJoined: true,
        feeling: '',
        rewarded: false,
      },
    }))
  }

  const toggleFocus = () => {
    setDynamicState((current) => ({
      ...current,
      focusSession: {
        ...current.focusSession,
        status: current.focusSession.status === 'paused' ? 'running' : 'paused',
      },
    }))
  }

  const finishFocus = () => {
    setDynamicState((current) => ({
      ...current,
      focusSession: {
        ...current.focusSession,
        remaining: 0,
        status: 'completed',
      },
    }))
  }

  const setFocusFeeling = (feeling) => {
    setDynamicState((current) => ({
      ...current,
      focusSession: {
        ...current.focusSession,
        feeling,
      },
    }))
  }

  const acceptSurprise = () => {
    setDynamicState((current) => ({
      ...current,
      surprise: { ...current.surprise, accepted: true },
    }))
  }

  const completeSurprise = () => {
    setDynamicState((current) => ({
      ...current,
      surprise: { ...current.surprise, completed: true },
    }))
  }

  useEffect(() => {
    let objectUrl
    if (couple.hasCustomPhoto) {
      api.getPhotoUrl().then((url) => {
        if (url) {
          objectUrl = url
          setImageUrl(url)
        }
      })
    }
    return () => {
      if (objectUrl?.startsWith('blob:')) URL.revokeObjectURL(objectUrl)
    }
  }, [couple.hasCustomPhoto])

  useEffect(() => {
    let objectUrl
    if (currentUser.hasAvatar) {
      api.getAvatarUrl().then((url) => {
        if (url) {
          objectUrl = url
          setAvatarUrl(url)
        }
      })
    }
    return () => {
      if (!isDemoMode && objectUrl?.startsWith('blob:')) URL.revokeObjectURL(objectUrl)
    }
  }, [currentUser.hasAvatar])

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(challengeStorageKey, JSON.stringify(challenges))
    }
  }, [challenges])

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(scoreStorageKey, JSON.stringify(scores))
    }
  }, [scores])

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(dynamicStorageKey, JSON.stringify(dynamicState))
    }
  }, [dynamicState])

  useEffect(() => {
    if (dynamicState.focusSession.status !== 'running') return undefined
    const timer = window.setInterval(() => {
      setDynamicState((current) => {
        if (current.focusSession.status !== 'running') return current
        const remaining = Math.max(0, current.focusSession.remaining - 1)
        return {
          ...current,
          focusSession: {
            ...current.focusSession,
            remaining,
            status: remaining === 0 ? 'completed' : 'running',
          },
        }
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [dynamicState.focusSession.status])

  useEffect(() => {
    if (
      dynamicState.focusSession.status !== 'completed' ||
      dynamicState.focusSession.rewarded
    ) {
      return undefined
    }
    const rewardTimer = window.setTimeout(() => {
      setScores((current) => ({ ...current, couple: current.couple + 25 }))
      setDynamicState((current) => ({
        ...current,
        focusSession: { ...current.focusSession, rewarded: true },
      }))
    }, 0)
    return () => window.clearTimeout(rewardTimer)
  }, [dynamicState.focusSession.rewarded, dynamicState.focusSession.status])

  useEffect(() => {
    let active = true
    api.listEvents()
      .then((items) => {
        if (active) setEvents(items)
      })
      .catch(() => {
        if (active) setEvents([])
      })
    return () => {
      active = false
    }
  }, [])

  const partnerName =
    couple.members.find((member) => member.id !== currentUser.id)?.name?.split(' ')[0] ||
    'Seu dengo'
  const individualRanking = [
    {
      id: 'mine',
      name: currentUser.name.split(' ')[0],
      points: scores.mine,
      isMine: true,
    },
    { id: 'partner', name: partnerName, points: scores.partner, isMine: false },
  ].sort((first, second) => second.points - first.points)
  const individualScoresTied = scores.mine === scores.partner
  const competitiveNote = getCompetitiveNote(scores, partnerName)
  const nextEvent = [...events].sort(
    (first, second) => nextOccurrence(first) - nextOccurrence(second),
  )[0]
  const completedChallenges = challenges.filter((challenge) => challenge.progress === 100).length

  const addChallenge = ({ title, period, goal, scope }) => {
    const normalizedGoal = Math.min(20, Math.max(1, Number(goal)))
    const challenge = {
      id: `challenge-${Date.now()}`,
      icon: 'target',
      tone: scope === 'couple' ? 'rose' : 'gold',
      period,
      category: scope === 'couple' ? 'Em casal' : 'Pessoal',
      title,
      progress: 0,
      current: 0,
      goal: normalizedGoal,
      detail: `0 de ${normalizedGoal} avanços`,
      scope,
      points: scope === 'couple' ? 40 : 25,
    }
    setChallenges((current) => [challenge, ...current])
  }

  const advanceChallenge = (challengeId) => {
    const currentChallenge = challenges.find((item) => item.id === challengeId)
    if (!currentChallenge || currentChallenge.current >= currentChallenge.goal) return false

    const nextCurrent = currentChallenge.current + 1
    const nextProgress = Math.min(100, Math.round((nextCurrent / currentChallenge.goal) * 100))
    setChallenges((current) =>
      current.map((item) =>
        item.id === challengeId
          ? {
              ...item,
              current: nextCurrent,
              progress: nextProgress,
              detail: `${nextCurrent} de ${item.goal} avanços`,
            }
          : item,
      ),
    )
    const scoreKey = currentChallenge.scope === 'couple' ? 'couple' : 'mine'
    setScores((current) => ({
      ...current,
      [scoreKey]: current[scoreKey] + currentChallenge.points,
    }))
    return true
  }

  const updateChallenge = (challengeId, updates) => {
    setChallenges((current) =>
      current.map((challenge) => {
        if (challenge.id !== challengeId) return challenge
        const goal = Math.min(
          20,
          Math.max(challenge.current, Math.max(1, Number(updates.goal))),
        )
        const progress = Math.min(100, Math.round((challenge.current / goal) * 100))
        return {
          ...challenge,
          ...updates,
          goal,
          progress,
          detail: `${challenge.current} de ${goal} avanços`,
        }
      }),
    )
  }

  const deleteChallenge = (challengeId) => {
    setChallenges((current) =>
      current.filter((challenge) => challenge.id !== challengeId),
    )
    setSelectedChallenge(null)
  }

  const addEvent = async (event) => {
    const created = await api.createEvent(event)
    setEvents((current) => [...current, created])
  }

  const updateEvent = async (eventId, event) => {
    const updated = await api.updateEvent(eventId, event)
    setEvents((current) =>
      current.map((item) => (item.id === eventId ? updated : item)),
    )
  }

  const deleteEvent = async (eventId) => {
    await api.deleteEvent(eventId)
    setEvents((current) => current.filter((event) => event.id !== eventId))
  }

  const openPanel = (nextPanel, challenge = null) => {
    if (['challenges', 'events', 'focus', 'journey', 'more'].includes(nextPanel)) {
      setActiveNav(nextPanel)
    } else if (nextPanel === 'challenge') {
      setActiveNav('challenges')
    }
    setSelectedChallenge(challenge)
    setPanel(nextPanel)
  }

  const navigate = (destination) => {
    if (destination === 'home') {
      setActiveNav('home')
      setPanel(null)
      window.scrollTo({ top: 0 })
      return
    }
    openPanel(destination)
  }

  const closePanel = () => {
    setPanel(null)
    setActiveNav('home')
  }

  return (
    <div className="app-shell">
      <SideNav
        active={activeNav}
        onNavigate={navigate}
        user={currentUser}
        avatarUrl={avatarUrl}
        onOpenAccount={() => setAccountOpen(true)}
        onLogout={onLogout}
      />
      <main className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="today-label">Segunda-feira, 27 de julho</p>
            <h1>
              Boa tarde, meu denguinho. <em>Vamos começar?</em>
            </h1>
          </div>
          <div className="header-actions">
            <button className="dengo-button" onClick={() => openPanel('dengo')}>
              <MessageCircleHeart size={18} />
              Preciso de dengo
            </button>
            <button
              className="icon-button notification-trigger"
              aria-label="Notificações"
              onClick={() => openPanel('notifications')}
            >
              <Bell size={19} />
              {dynamicState.dengoActivity?.response ? (
                <span className="notification-badge" aria-label="Nova resposta">1</span>
              ) : null}
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="main-column">
            <JourneyCard couple={couple} imageUrl={imageUrl} onSettings={() => setSettingsOpen(true)} />

            <DynamicMomentCard
              dengoActivity={dynamicState.dengoActivity}
              focusSession={dynamicState.focusSession}
              nextEvent={nextEvent}
              relationshipStartedOn={couple.relationshipStartedOn}
              partnerName={partnerName}
              completedChallenges={completedChallenges}
              onOpen={openPanel}
            />

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Metas em andamento</p>
                  <h2>Desafios ativos</h2>
                </div>
                <button onClick={() => openPanel('challenges')}>
                  Ver todos <ArrowRight size={16} />
                </button>
              </div>
              {isDemoMode ? (
                <div className="challenge-list">
                  {challenges.length ? (
                    challenges.slice(0, 3).map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onOpen={() => openPanel('challenge', challenge)}
                      />
                    ))
                  ) : (
                    <ChallengeEmptyState
                      compact
                      onCreate={() => openPanel('challenges')}
                    />
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <Target size={25} />
                  <div>
                    <h3>O espaço para os desafios está pronto.</h3>
                    <p>Semanais e mensais chegam na etapa 2 — nunca desafios diários.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-aside">
            {preferences.showScore ? <section className="score-card">
              <div className="score-heading">
                <div>
                  <p className="eyebrow">Placar de {currentMonthWeeks.month}</p>
                  <h2>
                    Semana {currentMonthWeeks.current} de {currentMonthWeeks.total}
                  </h2>
                </div>
                <Medal size={22} />
              </div>
              <div className="score-people">
                {individualRanking.map((player, index) => (
                  <div
                    key={player.id}
                    className={`score-person ${
                      !individualScoresTied && index === 0 ? 'leading' : ''
                    }`}
                  >
                    <span className={`mini-avatar ${player.isMine ? '' : 'partner'}`}>
                      {player.name.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{player.name}</strong>
                      <small>
                        {individualScoresTied ? 'Empate' : `${index + 1}º lugar`}
                        {player.isMine ? ' · Você' : ''}
                      </small>
                    </div>
                    <b>{player.points}<small> pts</small></b>
                  </div>
                ))}
              </div>
              <div className="title-badge">
                <HeartHandshake size={18} />
                <div>
                  <span>Pontos em casal</span>
                  <strong>
                    {scores.couple} pts · {partnerName} & {currentUser.name.split(' ')[0]}
                  </strong>
                </div>
              </div>
              <p className="score-note" aria-live="polite">{competitiveNote}</p>
            </section> : null}

            <section className="focus-card">
              <div className="focus-illustration">
                <span>
                  {dynamicState.focusSession.status === 'running' ||
                  dynamicState.focusSession.status === 'paused'
                    ? formatFocusTime(dynamicState.focusSession.remaining)
                    : '25'}
                </span>
                <small>
                  {dynamicState.focusSession.status === 'running'
                    ? 'ao vivo'
                    : dynamicState.focusSession.status === 'paused'
                      ? 'pausado'
                      : 'min'}
                </small>
              </div>
              <div>
                <p className="eyebrow light">Presença vale ponto</p>
                <h2>
                  {dynamicState.focusSession.status === 'running' ||
                  dynamicState.focusSession.status === 'paused'
                    ? dynamicState.focusSession.task
                    : 'Foco juntos'}
                </h2>
                <p>
                  {dynamicState.focusSession.status === 'running' ||
                  dynamicState.focusSession.status === 'paused'
                    ? `${partnerName} está focando com você.`
                    : 'Escolham uma tarefa e façam companhia um ao outro.'}
                </p>
                <button onClick={() => openPanel('focus')}>
                  {dynamicState.focusSession.status === 'running' ||
                  dynamicState.focusSession.status === 'paused'
                    ? 'Abrir sessão'
                    : 'Preparar sessão'}{' '}
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            {preferences.showKindReminder ? <section className="kind-note">
              <Sparkles size={19} />
              <div>
                <strong>Um lembrete gentil</strong>
                <p>Descansar também ajuda vocês a chegar mais longe.</p>
              </div>
            </section> : null}
          </aside>
        </div>
        <footer className="app-credit">
          Developed by <strong>ANAIV</strong>
        </footer>
      </main>
      <MobileNav active={activeNav} onNavigate={navigate} />
      {panel ? (
        <ActionPanel
          key={panel}
          view={panel}
          challenge={
            challenges.find((item) => item.id === selectedChallenge?.id) || selectedChallenge
          }
          onClose={closePanel}
          onOpen={openPanel}
          onOpenSettings={() => {
            setPanel(null)
            setActiveNav('home')
            setSettingsOpen(true)
          }}
          onOpenAccount={() => {
            setPanel(null)
            setActiveNav('home')
            setAccountOpen(true)
          }}
          onLogout={onLogout}
          partnerName={partnerName}
          lastDengoRequest={lastDengoRequest}
          dynamicState={dynamicState}
          notificationPreview={preferences.notificationPreview}
          onSendDengo={sendDengoRequest}
          onRespondDengo={respondDengo}
          onReact={reactToMoment}
          onStartFocus={startFocus}
          onToggleFocus={toggleFocus}
          onFinishFocus={finishFocus}
          onSetFocusFeeling={setFocusFeeling}
          onAcceptSurprise={acceptSurprise}
          onCompleteSurprise={completeSurprise}
          challenges={challenges}
          scores={scores}
          userName={currentUser.name}
          onAddChallenge={addChallenge}
          onAdvanceChallenge={advanceChallenge}
          onUpdateChallenge={updateChallenge}
          onDeleteChallenge={deleteChallenge}
          events={events}
          relationshipStartedOn={couple.relationshipStartedOn}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsPanel
          couple={couple}
          currentImage={imageUrl}
          theme={theme}
          onThemeChange={onThemeChange}
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
          onClose={() => setSettingsOpen(false)}
          onUpdated={(updated, nextImage) => {
            setCouple(updated)
            if (nextImage) setImageUrl(nextImage)
          }}
        />
      ) : null}
      {accountOpen ? (
        <AccountPanel
          user={currentUser}
          avatarUrl={avatarUrl}
          onClose={() => setAccountOpen(false)}
          onUpdated={(updated, nextAvatarUrl) => {
            setCurrentUser(updated)
            setAvatarUrl(nextAvatarUrl)
            setCouple((current) => ({
              ...current,
              members: current.members.map((member) =>
                member.id === updated.id ? updated : member,
              ),
            }))
          }}
        />
      ) : null}
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light',
  )
  const [preferences, setPreferences] = useState(loadPreferences)
  const [state, setState] = useState(() => ({
    status: localStorage.getItem('denguinho-token') ? 'loading' : 'guest',
    user: null,
    couple: null,
  }))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('denguinho-theme-v1', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0908' : '#f7f3eb')
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = `${preferences.reducedMotion}`
    localStorage.setItem(preferencesKey, JSON.stringify(preferences))
  }, [preferences])

  const updatePreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    const token = localStorage.getItem('denguinho-token')
    if (!token) return
    Promise.all([api.me(), api.getCouple()])
      .then(([user, couple]) =>
        setState({
          status: couple.relationshipStartedOn ? 'ready' : 'setup',
          user,
          couple,
        }),
      )
      .catch(() => {
        api.me()
          .then((user) => setState({ status: 'pairing', user, couple: null }))
          .catch(() => {
            localStorage.removeItem('denguinho-token')
            setState({ status: 'guest', user: null, couple: null })
          })
      })
  }, [])

  const logout = () => {
    localStorage.removeItem('denguinho-token')
    setState({ status: 'guest', user: null, couple: null })
  }

  const handleAuthenticated = async (user) => {
    if (!user.coupleId) {
      setState({ status: 'pairing', user, couple: null })
      return
    }
    try {
      const couple = await api.getCouple()
      setState({
        status: couple.relationshipStartedOn ? 'ready' : 'setup',
        user,
        couple,
      })
    } catch {
      setState({ status: 'pairing', user, couple: null })
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="loading-screen">
        <Brand />
        <span>Preparando o espaço de vocês…</span>
      </div>
    )
  }

  if (state.status === 'guest') {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (state.status === 'pairing') {
    return (
      <PairingScreen
        user={state.user}
        onPaired={(couple) =>
          setState({
            status: couple.relationshipStartedOn ? 'ready' : 'setup',
            user: state.user,
            couple,
          })
        }
        onLogout={logout}
      />
    )
  }

  if (state.status === 'setup') {
    return (
      <CoupleSetupScreen
        couple={state.couple}
        onComplete={(couple) => setState({ status: 'ready', user: state.user, couple })}
        onLogout={logout}
      />
    )
  }

  return (
    <Dashboard
      user={state.user}
      initialCouple={state.couple}
      onLogout={logout}
      theme={theme}
      onThemeChange={setTheme}
      preferences={preferences}
      onPreferenceChange={updatePreference}
    />
  )
}
