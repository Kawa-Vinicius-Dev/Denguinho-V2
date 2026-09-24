import { firstName } from './text.js'

export function rankMembers(periodScore, userId) {
  const members = (periodScore?.members || []).map((member) => ({
    ...member,
    firstName: firstName(member.name),
    isMine: member.userId === userId,
  }))
  const sorted = [...members].sort(
    (first, second) => second.points - first.points || Number(second.isMine) - Number(first.isMine),
  )
  const tied = members.length > 1 && members.every((member) => member.points === members[0].points)
  return { sorted, tied }
}

export function competitiveNote(ranking, partnerName) {
  const mine = ranking.sorted.find((member) => member.isMine)
  const partner = ranking.sorted.find((member) => !member.isMine)
  if (!mine || !partner) return 'Assim que seu dengo entrar, o placar ganha graça.'
  if (ranking.tied) {
    return mine.points === 0
      ? `${partnerName}, empatou. O próximo avanço decide quem provoca quem.`
      : `Empate em ${mine.points} pontos. Quem avança primeiro?`
  }
  if (mine.points > partner.points) {
    return `${partnerName}, pode correr: eu tô na frente e não vou aliviar.`
  }
  return 'Aproveita enquanto dá… já já eu vou passar.'
}
