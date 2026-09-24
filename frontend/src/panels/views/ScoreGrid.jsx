import { HeartHandshake } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { rankMembers } from '../../lib/scoreboard'

export function ScoreGrid({ scoreboard, userId, partnerName, userFirstName, monthName }) {
  const ranking = rankMembers(scoreboard?.month, userId)
  return (
    <div className="challenge-score-grid" aria-label={`Pontos de ${monthName}`}>
      {ranking.sorted.map((player, index) => (
        <article
          key={player.userId}
          className={!ranking.tied && index === 0 ? 'ranking-leader' : ''}
        >
          <Avatar name={player.firstName} className={`mini-avatar ${player.isMine ? '' : 'partner'}`} />
          <div>
            <small>
              {ranking.tied ? 'Empate' : `${index + 1}º`} · {player.isMine ? 'Você' : 'Individual'}
            </small>
            <strong>{player.firstName}</strong>
            <b>{player.points} pts</b>
          </div>
        </article>
      ))}
      <article className="couple-score-card">
        <span className="mini-avatar partner">
          <HeartHandshake size={17} />
        </span>
        <div>
          <small>Pontos em casal em {monthName}</small>
          <strong>
            {partnerName} & {userFirstName}
          </strong>
          <b>{scoreboard?.month.couplePoints ?? 0} pts</b>
        </div>
      </article>
    </div>
  )
}
