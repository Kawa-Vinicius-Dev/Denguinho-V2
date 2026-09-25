import { useMemo, useState } from 'react'
import { ArrowRight, Bell, MessageCircleHeart, RefreshCw, Sparkles, WifiOff } from 'lucide-react'
import { api } from '../api'
import { InstallAppCard } from '../components/InstallApp'
import { ChallengeCard } from '../dashboard/ChallengeCard'
import { ChallengeEmptyState } from '../dashboard/ChallengeEmptyState'
import { FocusCard } from '../dashboard/FocusCard'
import { JourneyCard } from '../dashboard/JourneyCard'
import { MomentCard } from '../dashboard/MomentCard'
import { MobileNav, SideNav } from '../dashboard/Navigation'
import { ScoreCard } from '../dashboard/ScoreCard'
import { useCoupleData } from '../hooks/useCoupleData'
import { useFocusSession } from '../hooks/useFocusSession'
import { useNow } from '../hooks/useNow'
import { usePersistentState } from '../hooks/usePersistentState'
import { useProtectedImage } from '../hooks/useProtectedImage'
import { useToast } from '../hooks/useToast'
import { canAdvance, jointProgress, sortChallenges } from '../lib/challenges'
import {
  daysBetween,
  formatLongDate,
  greetingFor,
  nextMonthiversary,
  parseLocalDate,
  toDateInputValue,
  upcomingEvents,
} from '../lib/dates'
import { summarizeDengos } from '../lib/dengos'
import { kindReminderFor } from '../lib/ideas'
import { pickMoment } from '../lib/moments'
import { firstName } from '../lib/text'
import { AccountPanel } from '../panels/AccountPanel'
import { ActionPanel } from '../panels/ActionPanel'
import { SettingsPanel } from '../panels/SettingsPanel'

const navigationSection = {
  challenges: 'challenges',
  challenge: 'challenges',
  events: 'events',
  focus: 'focus',
  journey: 'journey',
  more: 'more',
  recap: 'more',
  surprise: 'more',
}

const DASHBOARD_CHALLENGES = 3

export function Dashboard({
  user,
  couple,
  onUserChange,
  onCoupleChange,
  onLogout,
  theme,
  onThemeChange,
  preferences,
  onPreferenceChange,
}) {
  const notify = useToast()
  const now = useNow()
  const dayKey = toDateInputValue(now)
  const today = useMemo(() => parseLocalDate(dayKey), [dayKey])
  const { challenges, scoreboard, events, dengos, status, syncFailed, actions } = useCoupleData({
    onCoupleLoaded: onCoupleChange,
  })
  const focus = useFocusSession(user.id, { onComplete: actions.registerFocusSession })
  const [lastSeenAt, setLastSeenAt] = usePersistentState(
    `denguinho-notifications-seen-v1:${user.id}`,
    null,
  )
  const [panel, setPanel] = useState(null)
  const [settingsTab, setSettingsTab] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [advancingId, setAdvancingId] = useState('')
  const [photoUrl, reloadPhoto] = useProtectedImage(couple.hasCustomPhoto, api.getPhotoUrl)
  const [avatarUrl, reloadAvatar] = useProtectedImage(user.hasAvatar, api.getAvatarUrl)

  const partner = couple.members.find((member) => member.id !== user.id)
  const partnerName = firstName(partner?.name) || 'Seu dengo'
  const userFirstName = firstName(user.name)
  const dengoSummary = summarizeDengos(dengos, user.id, lastSeenAt, now)
  const moment = pickMoment({
    dengoSummary,
    focus,
    events,
    relationshipStartedOn: couple.relationshipStartedOn,
    partnerName,
    today,
  })
  const nextEvent = upcomingEvents(events, today)[0]
  const monthiversary = nextMonthiversary(couple.relationshipStartedOn, today)
  const nextPlanDays = Math.min(
    nextEvent ? daysBetween(today, nextEvent.date) : Infinity,
    monthiversary ? monthiversary.days : Infinity,
  )
  const sortedChallenges = sortChallenges(challenges, user.id)
  const completedChallenges = challenges.filter((challenge) => challenge.completed).length
  const hasPendingAdvance = challenges.some((challenge) => canAdvance(challenge, user.id))
  const subtitle =
    status === 'loading' || !challenges.length
      ? 'Vamos começar?'
      : hasPendingAdvance
        ? 'Bora pro próximo passo?'
        : 'Tudo em dia por aqui.'

  const openPanel = (view, options = {}) => {
    if (view === 'notifications') {
      setPanel({ view, seenBefore: lastSeenAt })
      setLastSeenAt(new Date().toISOString())
      return
    }
    setPanel({ view, ...options })
  }

  const closePanel = () => {
    if (panel?.view === 'notifications') setLastSeenAt(new Date().toISOString())
    setPanel(null)
  }

  const navigate = (destination) => {
    if (destination === 'home') {
      closePanel()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    openPanel(destination)
  }

  const undoProgress = async (challengeId, progressId) => {
    try {
      await actions.undoChallengeProgress(challengeId, progressId)
      notify('Avanço desfeito.', { key: 'challenge-progress' })
    } catch (requestError) {
      notify(requestError.message, { tone: 'error', key: 'challenge-progress' })
    }
  }

  const advanceChallenge = async (challenge) => {
    if (advancingId) return
    setAdvancingId(challenge.id)
    try {
      const result = await actions.advanceChallenge(challenge.id)
      notify(
        result.challenge.completed
          ? `Meta batida! +${result.points} pontos 🎉`
          : `Avanço registrado: +${result.points} pontos.`,
        {
          key: 'challenge-progress',
          action: { label: 'Desfazer', onClick: () => undoProgress(challenge.id, result.id) },
        },
      )
    } catch (requestError) {
      notify(requestError.message, { tone: 'error', key: 'challenge-progress' })
    } finally {
      setAdvancingId('')
    }
  }

  const app = {
    user,
    couple,
    partnerName,
    userFirstName,
    today,
    now,
    challenges,
    scoreboard,
    events,
    dengos,
    dataStatus: status,
    actions,
    focus,
    dengoSummary,
    notify,
    preferences,
    advancingId,
    advanceChallenge,
    undoProgress,
    openPanel,
    closePanel,
    onLogout,
    openSettings: () => {
      setPanel(null)
      setSettingsTab('journey')
    },
    openInstall: () => {
      setPanel(null)
      setSettingsTab('app')
    },
    openAccount: () => {
      setPanel(null)
      setAccountOpen(true)
    },
  }

  return (
    <div className="app-shell">
      <SideNav
        active={panel ? navigationSection[panel.view] || 'home' : 'home'}
        onNavigate={navigate}
        user={user}
        avatarUrl={avatarUrl}
        onOpenAccount={app.openAccount}
        onLogout={onLogout}
      />
      <main className="dashboard">
        {syncFailed && status !== 'error' ? (
          <p className="sync-banner" role="status">
            <WifiOff size={16} />
            Sem conexão com o servidor agora. Mostrando os dados mais recentes.
          </p>
        ) : null}
        <header className="dashboard-header">
          <div>
            <p className="today-label">{formatLongDate(now)}</p>
            <h1>
              {greetingFor(now)}, meu denguinho. <em>{subtitle}</em>
            </h1>
          </div>
          <div className="header-actions">
            <button
              className="dengo-button"
              aria-label="Preciso de dengo"
              onClick={() => openPanel('dengo')}
            >
              <MessageCircleHeart size={18} />
              <span>Preciso de dengo</span>
            </button>
            <button
              className="icon-button notification-trigger"
              aria-label={
                dengoSummary.unseenCount
                  ? `Notificações, ${dengoSummary.unseenCount} novas`
                  : 'Notificações'
              }
              onClick={() => openPanel('notifications')}
            >
              <Bell size={19} />
              {dengoSummary.unseenCount ? (
                <span className="notification-badge" aria-hidden="true">
                  {dengoSummary.unseenCount > 9 ? '9+' : dengoSummary.unseenCount}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="main-column">
            <InstallAppCard />

            <JourneyCard
              couple={couple}
              imageUrl={photoUrl}
              jointProgress={jointProgress(challenges)}
              today={today}
              onSettings={() => setSettingsTab('journey')}
            />

            <MomentCard
              moment={moment}
              nextPlanDays={nextPlanDays}
              completedChallenges={completedChallenges}
              onOpen={openPanel}
            />

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Metas em andamento</p>
                  <h2>Desafios ativos</h2>
                </div>
                <button onClick={() => openPanel('challenges')} aria-label="Ver todos os desafios">
                  Ver todos <ArrowRight size={16} />
                </button>
              </div>
              {status === 'loading' ? (
                <div className="challenge-list list-skeleton" aria-label="Carregando desafios">
                  <span />
                  <span />
                  <span />
                </div>
              ) : status === 'error' ? (
                <div className="empty-state error-state" role="alert">
                  <WifiOff size={25} />
                  <div>
                    <h3>Não conseguimos carregar os desafios.</h3>
                    <p>Confira a conexão e tente de novo.</p>
                  </div>
                  <button className="button secondary" onClick={actions.retry}>
                    <RefreshCw size={16} />
                    Tentar de novo
                  </button>
                </div>
              ) : (
                <div className="challenge-list">
                  {sortedChallenges.length ? (
                    <>
                      {sortedChallenges.slice(0, DASHBOARD_CHALLENGES).map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userId={user.id}
                          partnerName={partnerName}
                          busy={advancingId === challenge.id}
                          onOpen={() => openPanel('challenge', { challengeId: challenge.id })}
                          onAdvance={() => advanceChallenge(challenge)}
                        />
                      ))}
                      {sortedChallenges.length > DASHBOARD_CHALLENGES ? (
                        <button
                          type="button"
                          className="challenge-list-more"
                          onClick={() => openPanel('challenges')}
                        >
                          Ver mais {sortedChallenges.length - DASHBOARD_CHALLENGES}{' '}
                          {sortedChallenges.length - DASHBOARD_CHALLENGES === 1 ? 'desafio' : 'desafios'}
                          <ArrowRight size={15} />
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <ChallengeEmptyState compact onCreate={() => openPanel('challenges')} />
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-aside">
            {preferences.showScore ? (
              <ScoreCard
                scoreboard={scoreboard}
                userId={user.id}
                partnerName={partnerName}
                userFirstName={userFirstName}
                today={today}
              />
            ) : null}

            <FocusCard focus={focus} onOpen={() => openPanel('focus')} />

            {preferences.showKindReminder ? (
              <section className="kind-note">
                <Sparkles size={19} />
                <div>
                  <strong>Um lembrete gentil</strong>
                  <p>{kindReminderFor(today)}</p>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
        <footer className="app-credit">
          Developed by <strong>ANAIV</strong>
        </footer>
      </main>
      <MobileNav active={panel ? navigationSection[panel.view] || 'home' : 'home'} onNavigate={navigate} />
      {panel ? (
        <ActionPanel key={`${panel.view}-${panel.challengeId || ''}`} panel={panel} app={app} />
      ) : null}
      {settingsTab ? (
        <SettingsPanel
          initialTab={settingsTab}
          couple={couple}
          currentImage={photoUrl}
          theme={theme}
          onThemeChange={onThemeChange}
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
          notify={notify}
          onClose={() => setSettingsTab(null)}
          onUpdated={(updated, { photoChanged }) => {
            onCoupleChange(updated)
            if (photoChanged) reloadPhoto()
          }}
        />
      ) : null}
      {accountOpen ? (
        <AccountPanel
          user={user}
          avatarUrl={avatarUrl}
          notify={notify}
          onClose={() => setAccountOpen(false)}
          onUpdated={(updated, { avatarChanged }) => {
            onUserChange(updated)
            if (avatarChanged) reloadAvatar()
          }}
        />
      ) : null}
    </div>
  )
}
