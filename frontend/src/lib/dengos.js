export const dengoRequestOptions = ['Um cheiro', 'Cadê meu denguinho?', 'Quando vou ver meu dengo?']
export const dengoQuickReplies = ['Tô indo', 'Um cheiro', 'Me chama']
export const dengoReactions = [
  ['❤️', 'Coração'],
  ['🥰', 'Carinho'],
  ['😂', 'Risada'],
  ['✨', 'Comemoração'],
]
export const cheerEmojis = ['👏', '🔥', '💛']

// Depois disso, um pedido sem resposta deixa de ocupar o cartão "Agora no Denguinho".
const WAITING_WINDOW_MS = 12 * 3_600_000

function isAfter(value, reference) {
  return Boolean(value) && (!reference || new Date(value) > new Date(reference))
}

// O que merece atenção de quem está usando o app agora.
export function summarizeDengos(dengos, userId, lastSeenAt, now = new Date()) {
  const fromPartner = dengos.filter((dengo) => dengo.senderId !== userId)
  const mine = dengos.filter((dengo) => dengo.senderId === userId)
  const pendingForMe = fromPartner.filter((dengo) => dengo.kind === 'REQUEST' && !dengo.response)
  const newAnswers = mine.filter(
    (dengo) => dengo.kind === 'REQUEST' && isAfter(dengo.respondedAt, lastSeenAt),
  )
  const newCheers = fromPartner.filter(
    (dengo) => dengo.kind === 'CHEER' && isAfter(dengo.createdAt, lastSeenAt),
  )
  const waitingPartner = mine.find(
    (dengo) =>
      dengo.kind === 'REQUEST' &&
      !dengo.response &&
      now - new Date(dengo.createdAt) < WAITING_WINDOW_MS,
  )
  return {
    pendingForMe,
    newAnswers,
    newCheers,
    waitingPartner,
    unseenCount: pendingForMe.length + newAnswers.length + newCheers.length,
  }
}
