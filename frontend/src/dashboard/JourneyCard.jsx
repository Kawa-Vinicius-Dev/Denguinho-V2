import { HeartHandshake, Settings } from 'lucide-react'
import { ProgressBar } from '../components/ProgressBar'
import { formatDuration, relationshipDuration } from '../lib/dates'
import { firstName } from '../lib/text'

const fallbackJourneyImage = '/journey-fallback.webp'

export function JourneyCard({ couple, imageUrl, jointProgress, today, onSettings }) {
  const names = couple.members.map((member) => firstName(member.name)).join(' & ')
  const duration = relationshipDuration(couple.relationshipStartedOn, today)
  const progress = jointProgress ?? 0

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
        {duration && duration.totalDays > 0 ? (
          <p className="journey-together">
            <HeartHandshake size={15} />
            Juntos há {formatDuration(duration, { withDays: duration.totalMonths < 1 })}
          </p>
        ) : null}
        <p className="journey-objective">{couple.currentObjective}</p>
        <div className="journey-progress-row">
          <span>Missão conjunta</span>
          <strong>{progress}%</strong>
        </div>
        <ProgressBar value={progress} label="Missão conjunta" onDark />
        <p className="journey-note">
          {jointProgress === null
            ? 'Criem um desafio em casal para dar vida à missão conjunta.'
            : progress >= 100
              ? 'Missão do período cumprida. Vocês mandaram bem demais.'
              : progress > 0
                ? 'Vocês já fizeram a parte mais difícil: continuar escolhendo o próximo passo.'
                : 'A missão conjunta deste período começa no primeiro avanço.'}
        </p>
      </div>
    </article>
  )
}
