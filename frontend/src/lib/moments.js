import { daysBetween, nextMonthiversary, upcomingEvents } from './dates.js'

function daysLabel(days) {
  if (days === 0) return 'É hoje!'
  if (days === 1) return 'É amanhã.'
  return `Faltam ${days} dias.`
}

// Escolhe o que aparece no cartão "Agora no Denguinho", do mais urgente ao mais
// distante: um pedido de dengo esperando resposta vence um plano daqui a 20 dias.
export function pickMoment({ dengoSummary, focus, events, relationshipStartedOn, partnerName, today }) {
  const request = dengoSummary.pendingForMe[0]
  if (request) {
    return {
      kind: 'dengo-request',
      eyebrow: `${partnerName} pediu dengo`,
      title: `“${request.message}”`,
      description: 'Responda com um toque — seu dengo vai ver na hora.',
      action: 'Responder',
      panel: 'notifications',
    }
  }

  if (focus.status === 'running' || focus.status === 'paused') {
    return {
      kind: 'focus',
      eyebrow: focus.status === 'running' ? 'Foco acontecendo' : 'Foco pausado',
      title: focus.task,
      description: `${focus.remainingLabel} restantes. Cada minuto conta para o casal.`,
      action: 'Voltar à sessão',
      panel: 'focus',
    }
  }

  const answer = dengoSummary.newAnswers[0]
  if (answer) {
    return {
      kind: 'dengo-answer',
      eyebrow: `${partnerName} respondeu`,
      title: answer.response,
      description: `Seu pedido “${answer.message}” não ficou no vácuo.`,
      action: 'Ver resposta',
      panel: 'notifications',
    }
  }

  if (dengoSummary.waitingPartner) {
    return {
      kind: 'dengo-waiting',
      eyebrow: 'Dengo no ar',
      title: `Esperando ${partnerName} responder`,
      description: `Você pediu: “${dengoSummary.waitingPartner.message}”`,
      action: 'Ver pedido',
      panel: 'notifications',
    }
  }

  const nextEvent = upcomingEvents(events, today)[0]
  const monthiversary = nextMonthiversary(relationshipStartedOn, today)
  const eventDays = nextEvent ? daysBetween(today, nextEvent.date) : Infinity
  const monthiversaryDays = monthiversary ? monthiversary.days : Infinity

  if (monthiversary && monthiversaryDays <= eventDays) {
    return {
      kind: 'monthiversary',
      eyebrow: monthiversaryDays === 0 ? 'Dia de vocês' : 'Próximo momento',
      title:
        monthiversaryDays === 0
          ? `Hoje vocês completam ${monthiversary.months} meses 💛`
          : 'O dia de vocês está chegando',
      description:
        monthiversaryDays === 0
          ? 'Que tal um carinho extra hoje?'
          : `${daysLabel(monthiversaryDays)} São ${monthiversary.months} meses de história.`,
      action: 'Abrir agenda',
      panel: 'events',
      days: monthiversaryDays,
    }
  }

  if (nextEvent) {
    return {
      kind: 'event',
      eyebrow: 'Próximo momento',
      title: nextEvent.event.title,
      description: daysLabel(eventDays),
      action: 'Abrir agenda',
      panel: 'events',
      days: eventDays,
    }
  }

  return {
    kind: 'empty',
    eyebrow: 'Próximo momento',
    title: 'A agenda de vocês está livre',
    description: 'Guardem um plano para ter algo bom para esperar.',
    action: 'Criar plano',
    panel: 'events',
  }
}
