import { Medal, PartyPopper, SmilePlus } from 'lucide-react'
import { formatPeriodRange } from '../../lib/dates'
import { rankMembers } from '../../lib/scoreboard'
import { plural } from '../../lib/text'

export function RecapView({ app }) {
  const week = app.scoreboard?.week
  const completed = app.challenges.filter(
    (challenge) => challenge.period === 'WEEKLY' && challenge.completed,
  ).length
  const individualPoints = week?.members.reduce((sum, member) => sum + member.points, 0) ?? 0
  const hasActivity = Boolean(week && week.advances + week.focusSessions + week.dengos > 0)
  const ranking = rankMembers(week, app.user.id)
  const leader = !ranking.tied && ranking.sorted[0]?.advances ? ranking.sorted[0] : null

  const highlight = !week
    ? 'Carregando a semana de vocês…'
    : leader
      ? `${leader.isMine ? 'Você puxou' : `${leader.firstName} puxou`} a semana com ${leader.advances} ${leader.advances === 1 ? 'avanço' : 'avanços'}.`
      : week.focusMinutes
        ? `Vocês somaram ${week.focusMinutes} minutos de foco nesta semana.`
        : hasActivity
          ? 'Cada avanço registrado ajuda a contar a história desta semana.'
          : 'Quando vocês registrarem o primeiro avanço, ele aparecerá aqui.'

  const sendLove = async () => {
    try {
      await app.actions.sendDengo({ kind: 'CHEER', message: '💛', subject: 'Nossa semana' })
      app.notify(`Um 💛 pela semana foi para ${app.partnerName}.`)
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    }
  }

  return (
    <div className="recap-content">
      <section className="recap-hero">
        <span>
          <PartyPopper size={24} />
        </span>
        <div>
          <p className="eyebrow">Resumo da semana</p>
          <h3>
            {hasActivity
              ? 'Vocês continuaram escolhendo o próximo passo.'
              : 'A semana de vocês começa agora.'}
          </h3>
          {week ? <small>{formatPeriodRange(week.startsOn, week.endsOn)}</small> : null}
        </div>
      </section>
      <div className="recap-stats">
        <article>
          <strong>{completed}</strong>
          <span>{completed === 1 ? 'meta semanal batida' : 'metas semanais batidas'}</span>
        </article>
        <article>
          <strong>{individualPoints}</strong>
          <span>pontos individuais</span>
        </article>
        <article>
          <strong>{week?.couplePoints ?? 0}</strong>
          <span>pontos em casal</span>
        </article>
      </div>
      <ul className="recap-extra" aria-label="Mais números da semana">
        <li>{plural(week?.advances ?? 0, 'avanço', 'avanços')}</li>
        <li>{week?.focusMinutes ?? 0} min de foco</li>
        <li>{plural(week?.dengos ?? 0, 'dengo trocado', 'dengos trocados')}</li>
      </ul>
      <section className="recap-highlight">
        <Medal size={20} />
        <div>
          <strong>Momento da semana</strong>
          <p>{highlight}</p>
        </div>
      </section>
      <button className="button secondary wide" onClick={sendLove}>
        <SmilePlus size={18} />
        Mandar um 💛 pela semana
      </button>
    </div>
  )
}
