import {
  ArrowRight,
  CalendarDays,
  CalendarHeart,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MessageCircleHeart,
  Trophy,
} from 'lucide-react'

const icons = {
  'dengo-request': MessageCircleHeart,
  'dengo-answer': HeartHandshake,
  'dengo-waiting': MessageCircleHeart,
  focus: Clock3,
  monthiversary: CalendarHeart,
  event: CalendarDays,
  empty: CalendarDays,
}

function nextPlanLabel(days) {
  if (days === undefined || days === Infinity) return null
  if (days === 0) return <><b>Hoje</b> tem momento especial</>
  return <><b>{days}</b> {days === 1 ? 'dia' : 'dias'} para o próximo momento</>
}

export function MomentCard({ moment, nextPlanDays, completedChallenges, onOpen }) {
  const MomentIcon = icons[moment.kind] || CalendarDays
  const planLabel = nextPlanLabel(nextPlanDays)

  return (
    <section className={`moment-card moment-${moment.kind}`} aria-labelledby="moment-title">
      <div className="moment-heading">
        <span className="moment-live-dot" aria-hidden="true" />
        <p>Agora no Denguinho</p>
        <span>ao vivo</span>
      </div>
      <button className="moment-main" onClick={() => onOpen(moment.panel)}>
        <span className="moment-icon">
          <MomentIcon size={21} />
        </span>
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
          {planLabel || 'Nenhum plano marcado'}
        </span>
        <span>
          <Trophy size={15} />
          <b>{completedChallenges}</b>
          {completedChallenges === 1 ? 'meta batida' : 'metas batidas'} no período
        </span>
        <button onClick={() => onOpen('recap')}>
          Ver semana <ArrowRight size={14} />
        </button>
      </div>
    </section>
  )
}
