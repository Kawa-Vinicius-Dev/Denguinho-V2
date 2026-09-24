import { Check, ChevronRight, Plus } from 'lucide-react'
import { ChallengeIcon } from '../components/ChallengeIcon'
import { ProgressBar } from '../components/ProgressBar'
import {
  canAdvance,
  categoryLabel,
  challengeTone,
  isOwnedBy,
  periodLabel,
  periodNoun,
  progressPercent,
} from '../lib/challenges'

export function ChallengeCard({ challenge, userId, partnerName, busy, onOpen, onAdvance }) {
  const percent = progressPercent(challenge)
  const ownedByPartner = !isOwnedBy(challenge, userId)
  const inThisPeriod = periodNoun(challenge.period) === 'semana' ? 'nesta semana' : 'neste mês'

  return (
    <article className={`challenge-card${challenge.completed ? ' is-complete' : ''}`}>
      <ChallengeIcon category={challenge.category} tone={challengeTone(challenge, userId)} />
      <div className="challenge-main">
        <div className="challenge-meta">
          <span>{periodLabel(challenge.period)}</span>
          <span>{categoryLabel(challenge.category)}</span>
          {challenge.scope === 'COUPLE' ? <span>Em casal</span> : null}
          {ownedByPartner ? <span>De {partnerName}</span> : null}
        </div>
        <h3>{challenge.title}</h3>
        <ProgressBar value={percent} label={`Progresso de ${challenge.title}`} />
        <div className="challenge-detail">
          <span>
            {challenge.progress} de {challenge.goal} {inThisPeriod}
          </span>
          <span>{challenge.pointsPerAdvance} pts/avanço</span>
          <strong>{percent}%</strong>
        </div>
      </div>
      <div className="challenge-card-actions">
        {canAdvance(challenge, userId) ? (
          <button
            type="button"
            className="challenge-quick-advance"
            aria-label={`Registrar avanço em ${challenge.title}`}
            disabled={busy}
            onClick={onAdvance}
          >
            <Plus size={18} />
          </button>
        ) : challenge.completed ? (
          <span className="challenge-done-badge" title="Meta batida no período">
            <Check size={17} />
          </span>
        ) : null}
        <button type="button" onClick={onOpen} aria-label={`Abrir ${challenge.title}`}>
          <ChevronRight size={18} />
        </button>
      </div>
    </article>
  )
}
