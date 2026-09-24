import { relationshipDuration } from './dates.js'

export function computeAchievements({ scoreboard, challenges, events, relationshipStartedOn, today }) {
  const totals = scoreboard?.totals || { points: 0, advances: 0, focusSessions: 0, dengos: 0 }
  const weekAdvances = scoreboard?.week?.advances || 0
  const completedAny = challenges.some(
    (challenge) =>
      challenge.completed || challenge.history?.some((period) => period.completed),
  )
  const duration = relationshipDuration(relationshipStartedOn, today)

  return [
    {
      id: 'first-points',
      icon: 'medal',
      title: 'Primeiros pontos',
      description: 'O primeiro avanço registrado movimentou o placar.',
      unlocked: totals.points > 0,
    },
    {
      id: 'challenge-complete',
      icon: 'flame',
      title: 'Meta batida',
      description: 'Um desafio chegou à meta dentro do período.',
      unlocked: completedAny,
    },
    {
      id: 'first-plan',
      icon: 'calendar',
      title: 'Primeiro plano em dupla',
      description: 'A agenda do casal ganhou um momento especial.',
      unlocked: events.length > 0,
    },
    {
      id: 'focus',
      icon: 'focus',
      title: 'Presença vale ponto',
      description: 'Uma sessão de foco foi até o fim.',
      unlocked: totals.focusSessions > 0,
    },
    {
      id: 'dengo',
      icon: 'heart',
      title: 'Dengo em dia',
      description: 'Vocês já trocaram o primeiro dengo por aqui.',
      unlocked: totals.dengos > 0,
    },
    {
      id: 'busy-week',
      icon: 'sparkles',
      title: 'Semana cheia',
      description: 'Cinco avanços na mesma semana.',
      unlocked: weekAdvances >= 5,
    },
    {
      id: 'hundred',
      icon: 'trophy',
      title: '100 pontos juntos',
      description: 'Somando tudo o que vocês já conquistaram.',
      unlocked: totals.points >= 100,
    },
    {
      id: 'one-year',
      icon: 'gift',
      title: 'Um ano de história',
      description: 'Doze meses desde o primeiro dia de vocês.',
      unlocked: Boolean(duration && duration.totalMonths >= 12),
    },
  ]
}
