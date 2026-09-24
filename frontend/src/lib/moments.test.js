import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { summarizeDengos } from './dengos.js'
import { pickMoment } from './moments.js'

const today = new Date(2026, 8, 24)
const idleFocus = { status: 'idle' }
const base = {
  focus: idleFocus,
  events: [],
  relationshipStartedOn: '2024-06-26',
  partnerName: 'Rilary',
  today,
}

describe('summarizeDengos', () => {
  const dengos = [
    { id: '1', kind: 'REQUEST', senderId: 'partner', message: 'Um cheiro', createdAt: '2026-09-24T10:00:00Z' },
    { id: '2', kind: 'REQUEST', senderId: 'me', message: 'Cadê?', response: 'Tô indo', respondedAt: '2026-09-24T11:00:00Z', createdAt: '2026-09-24T09:00:00Z' },
    { id: '3', kind: 'CHEER', senderId: 'partner', message: '🔥', subject: 'Ler', createdAt: '2026-09-24T08:00:00Z' },
  ]

  it('conta pedidos pendentes, respostas e energia ainda não vistas', () => {
    const summary = summarizeDengos(dengos, 'me', '2026-09-24T08:30:00Z')
    assert.deepEqual(summary.pendingForMe.map((item) => item.id), ['1'])
    assert.deepEqual(summary.newAnswers.map((item) => item.id), ['2'])
    assert.deepEqual(summary.newCheers, [])
    assert.equal(summary.unseenCount, 2)
  })

  it('pedidos pendentes continuam contando até serem respondidos', () => {
    assert.equal(summarizeDengos(dengos, 'me', '2026-09-24T12:00:00Z').unseenCount, 1)
  })

  it('para de esperar resposta de um pedido antigo', () => {
    const mine = [{ id: 'm', kind: 'REQUEST', senderId: 'me', message: 'Oi', createdAt: '2026-09-24T08:00:00Z' }]
    assert.equal(summarizeDengos(mine, 'me', null, new Date('2026-09-24T12:00:00Z')).waitingPartner.id, 'm')
    assert.equal(summarizeDengos(mine, 'me', null, new Date('2026-09-25T09:00:00Z')).waitingPartner, undefined)
  })
})

describe('pickMoment', () => {
  const noDengos = summarizeDengos([], 'me', null)

  it('prioriza um pedido de dengo esperando resposta', () => {
    const summary = summarizeDengos(
      [{ id: '1', kind: 'REQUEST', senderId: 'partner', message: 'Um cheiro', createdAt: '2026-09-24T10:00:00Z' }],
      'me',
      null,
    )
    const moment = pickMoment({ ...base, dengoSummary: summary })
    assert.equal(moment.kind, 'dengo-request')
    assert.equal(moment.eyebrow, 'Rilary pediu dengo')
  })

  it('mostra o mêsversário quando ele vem antes do próximo plano', () => {
    const moment = pickMoment({
      ...base,
      dengoSummary: noDengos,
      events: [{ id: 'e', title: 'Jantar', eventDate: '2026-10-02', recurrence: 'NONE' }],
    })
    assert.equal(moment.kind, 'monthiversary')
    assert.equal(moment.description, 'Faltam 2 dias. São 27 meses de história.')
  })

  it('ignora planos que já passaram', () => {
    const moment = pickMoment({
      ...base,
      dengoSummary: noDengos,
      relationshipStartedOn: '2024-06-23',
      events: [
        { id: 'old', title: 'Praia', eventDate: '2026-09-01', recurrence: 'NONE' },
        { id: 'next', title: 'Cinema', eventDate: '2026-09-25', recurrence: 'NONE' },
      ],
    })
    assert.equal(moment.kind, 'event')
    assert.equal(moment.title, 'Cinema')
    assert.equal(moment.description, 'É amanhã.')
  })

  it('comemora no próprio dia', () => {
    const moment = pickMoment({ ...base, dengoSummary: noDengos, relationshipStartedOn: '2024-06-24' })
    assert.equal(moment.title, 'Hoje vocês completam 27 meses 💛')
  })
})
