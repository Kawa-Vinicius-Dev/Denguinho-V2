import { addDays, monthStart, toDateInputValue, weekStart } from './dates.js'

export const MAX_GOAL = 20

export const categoryOptions = [
  ['STUDIES', 'Estudos'],
  ['WORK', 'Trabalho'],
  ['PROJECTS', 'Projetos'],
  ['HEALTH', 'Saúde'],
  ['ORGANIZATION', 'Organização'],
  ['FINANCES', 'Finanças'],
  ['RELATIONSHIP', 'Relacionamento'],
  ['LEISURE', 'Lazer'],
  ['OTHER', 'Outros'],
]

const categoryLabels = Object.fromEntries(categoryOptions)

export const periodOptions = [
  ['WEEKLY', 'Semanal', 'Recomeça toda segunda-feira'],
  ['MONTHLY', 'Mensal', 'Recomeça todo dia 1º'],
]

export const pointsPerAdvance = { INDIVIDUAL: 25, COUPLE: 40 }

export function categoryLabel(category) {
  return categoryLabels[category] || 'Outros'
}

export function periodLabel(period) {
  return period === 'MONTHLY' ? 'Mensal' : 'Semanal'
}

export function periodNoun(period) {
  return period === 'MONTHLY' ? 'mês' : 'semana'
}

export function restartLabel(period) {
  return period === 'MONTHLY' ? 'Recomeça no dia 1º' : 'Recomeça na segunda-feira'
}

export function isOwnedBy(challenge, userId) {
  return challenge.scope === 'COUPLE' || challenge.ownerId === userId
}

export function challengeTone(challenge, userId) {
  if (challenge.scope === 'COUPLE') return 'rose'
  return challenge.ownerId === userId ? 'gold' : 'plum'
}

export function canAdvance(challenge, userId) {
  return isOwnedBy(challenge, userId) && !challenge.completed
}

export function progressPercent(challenge) {
  if (!challenge.goal) return 0
  return Math.min(100, Math.round((challenge.progress / challenge.goal) * 100))
}

// Pendentes primeiro; entre eles, os que a pessoa pode avançar agora.
export function sortChallenges(challenges, userId) {
  const rank = (challenge) => {
    if (challenge.completed) return 2
    return isOwnedBy(challenge, userId) ? 0 : 1
  }
  return [...challenges].sort(
    (first, second) =>
      rank(first) - rank(second) ||
      String(first.createdAt).localeCompare(String(second.createdAt)),
  )
}

// "Missão conjunta": quanto dos desafios em casal deste período já foi feito.
export function jointProgress(challenges) {
  const shared = challenges.filter((challenge) => challenge.scope === 'COUPLE')
  if (!shared.length) return null
  const total = shared.reduce(
    (sum, challenge) => sum + Math.min(1, challenge.progress / challenge.goal),
    0,
  )
  return Math.round((total / shared.length) * 100)
}

export function currentPeriod(period, today) {
  const start = period === 'MONTHLY' ? monthStart(today) : weekStart(today)
  const next =
    period === 'MONTHLY'
      ? new Date(start.getFullYear(), start.getMonth() + 1, 1)
      : addDays(start, 7)
  return {
    start,
    next,
    startsOn: toDateInputValue(start),
    endsOn: toDateInputValue(addDays(next, -1)),
  }
}

export function previousPeriodStart(period, start) {
  return period === 'MONTHLY'
    ? new Date(start.getFullYear(), start.getMonth() - 1, 1)
    : addDays(start, -7)
}
