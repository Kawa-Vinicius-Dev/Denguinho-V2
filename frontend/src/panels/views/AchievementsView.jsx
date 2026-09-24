import { CalendarDays, Flame, Focus, Gift, HeartHandshake, Lock, Medal, Sparkles, Trophy } from 'lucide-react'
import { computeAchievements } from '../../lib/achievements'

const icons = {
  medal: Medal,
  flame: Flame,
  calendar: CalendarDays,
  focus: Focus,
  heart: HeartHandshake,
  sparkles: Sparkles,
  trophy: Trophy,
  gift: Gift,
}

export function AchievementsView({ app }) {
  const achievements = computeAchievements({
    scoreboard: app.scoreboard,
    challenges: app.challenges,
    events: app.events,
    relationshipStartedOn: app.couple.relationshipStartedOn,
    today: app.today,
  })
  const unlocked = achievements.filter((achievement) => achievement.unlocked)
  const locked = achievements.filter((achievement) => !achievement.unlocked)

  return (
    <>
      <p className="achievement-summary">
        <b>{unlocked.length}</b> de {achievements.length} conquistas desbloqueadas.
        {unlocked.length ? '' : ' Os primeiros momentos de vocês aparecerão aqui.'}
      </p>
      <div className="achievement-list">
        {[...unlocked, ...locked].map((achievement) => {
          const Icon = icons[achievement.icon] || Trophy
          return (
            <article key={achievement.id} className={achievement.unlocked ? '' : 'locked'}>
              {achievement.unlocked ? <Icon size={22} /> : <Lock size={20} />}
              <div>
                <strong>{achievement.title}</strong>
                <p>{achievement.description}</p>
              </div>
              {!achievement.unlocked ? <span className="achievement-lock">A conquistar</span> : null}
            </article>
          )
        })}
      </div>
    </>
  )
}
