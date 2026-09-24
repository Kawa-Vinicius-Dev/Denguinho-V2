import { HeartHandshake, Medal } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { monthWeekInfo } from '../lib/dates'
import { competitiveNote, rankMembers } from '../lib/scoreboard'

export function ScoreCard({ scoreboard, userId, partnerName, userFirstName, today }) {
  const weeks = monthWeekInfo(today)
  const ranking = rankMembers(scoreboard?.month, userId)

  return (
    <section className="score-card" aria-busy={!scoreboard}>
      <div className="score-heading">
        <div>
          <p className="eyebrow">Placar de {weeks.month}</p>
          <h2>
            Semana {weeks.current} de {weeks.total}
          </h2>
        </div>
        <Medal size={22} />
      </div>
      {scoreboard ? (
        <>
          <div className="score-people">
            {ranking.sorted.map((player, index) => (
              <div
                key={player.userId}
                className={`score-person ${!ranking.tied && index === 0 ? 'leading' : ''}`}
              >
                <Avatar
                  name={player.firstName}
                  className={`mini-avatar ${player.isMine ? '' : 'partner'}`}
                />
                <div>
                  <strong>{player.firstName}</strong>
                  <small>
                    {ranking.tied ? 'Empate' : `${index + 1}º lugar`}
                    {player.isMine ? ' · Você' : ''}
                  </small>
                </div>
                <b>
                  {player.points}
                  <small> pts</small>
                </b>
              </div>
            ))}
          </div>
          <div className="title-badge">
            <HeartHandshake size={18} />
            <div>
              <span>Pontos em casal</span>
              <strong>
                {scoreboard.month.couplePoints} pts · {partnerName} & {userFirstName}
              </strong>
            </div>
          </div>
          <p className="score-note" aria-live="polite">
            {competitiveNote(ranking, partnerName)}
          </p>
        </>
      ) : (
        <div className="score-skeleton" aria-label="Carregando placar">
          <span />
          <span />
          <span />
        </div>
      )}
    </section>
  )
}
