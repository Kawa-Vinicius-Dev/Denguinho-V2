import { X } from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { AchievementsView } from './views/AchievementsView'
import { ChallengeDetailView } from './views/ChallengeDetailView'
import { ChallengesView } from './views/ChallengesView'
import { DengoView } from './views/DengoView'
import { EventsView } from './views/EventsView'
import { FocusView } from './views/FocusView'
import { MoreView } from './views/MoreView'
import { NotificationsView } from './views/NotificationsView'
import { RecapView } from './views/RecapView'
import { SurpriseView } from './views/SurpriseView'

const headings = {
  dengo: ['Denguinho', 'Tô precisando de dengo, não vê?'],
  notifications: ['Novidades de vocês', 'Notificações'],
  challenges: ['Metas em andamento', 'Todos os desafios'],
  challenge: ['Detalhes do desafio', 'Desafio'],
  events: ['Tempo de vocês', 'Agenda do casal'],
  focus: ['Presença vale ponto', 'Foco juntos'],
  journey: ['Caminho compartilhado', 'Conquistas'],
  recap: ['A semana de vocês', 'Retrospectiva'],
  surprise: ['Uma ideia só de vocês', 'Surpresa do mês'],
  more: ['Seu espaço', 'Mais opções'],
}

function PanelView({ panel, app }) {
  switch (panel.view) {
    case 'dengo':
      return <DengoView app={app} />
    case 'notifications':
      return <NotificationsView app={app} seenBefore={panel.seenBefore} />
    case 'challenges':
      return <ChallengesView app={app} />
    case 'challenge':
      return <ChallengeDetailView app={app} challengeId={panel.challengeId} />
    case 'events':
      return <EventsView app={app} draft={panel.draft} />
    case 'focus':
      return <FocusView app={app} />
    case 'journey':
      return <AchievementsView app={app} />
    case 'recap':
      return <RecapView app={app} />
    case 'surprise':
      return <SurpriseView app={app} />
    default:
      return <MoreView app={app} />
  }
}

export function ActionPanel({ panel, app }) {
  const [eyebrow, fallbackTitle] = headings[panel.view] || headings.more
  const title =
    panel.view === 'challenge'
      ? app.challenges.find((item) => item.id === panel.challengeId)?.title || fallbackTitle
      : fallbackTitle

  return (
    <Dialog labelledBy="action-panel-title" className="action-panel" onClose={app.closePanel}>
      <header>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="action-panel-title">{title}</h2>
        </div>
        <button className="icon-button" onClick={app.closePanel} aria-label="Fechar painel">
          <X />
        </button>
      </header>
      <div className="action-panel-content">
        <PanelView panel={panel} app={app} />
      </div>
    </Dialog>
  )
}
