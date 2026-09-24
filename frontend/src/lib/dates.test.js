import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addMonthsClamped,
  formatDuration,
  formatLongDate,
  formatPeriodRange,
  formatRelativeTime,
  greetingFor,
  isPastEvent,
  monthWeekInfo,
  nextMonthiversary,
  nextOccurrence,
  relationshipDuration,
  toDateInputValue,
  upcomingEvents,
} from './dates.js'

const day = (value) => new Date(`${value}T00:00:00`)
const iso = (date) => toDateInputValue(date)

describe('addMonthsClamped', () => {
  it('usa o último dia quando o mês é mais curto', () => {
    assert.equal(iso(addMonthsClamped(day('2026-08-31'), 1)), '2026-09-30')
    assert.equal(iso(addMonthsClamped(day('2026-01-31'), 1)), '2026-02-28')
    assert.equal(iso(addMonthsClamped(day('2024-02-29'), 12)), '2025-02-28')
  })
})

describe('nextOccurrence', () => {
  const today = day('2026-09-24')

  it('mantém eventos únicos na data marcada', () => {
    assert.equal(iso(nextOccurrence({ eventDate: '2026-10-02', recurrence: 'NONE' }, today)), '2026-10-02')
  })

  it('não antecipa um evento recorrente que ainda vai começar', () => {
    const event = { eventDate: '2026-12-15', recurrence: 'MONTHLY' }
    assert.equal(iso(nextOccurrence(event, today)), '2026-12-15')
  })

  it('repete todo mês sem transbordar para o mês seguinte', () => {
    const event = { eventDate: '2026-01-31', recurrence: 'MONTHLY' }
    assert.equal(iso(nextOccurrence(event, today)), '2026-09-30')
    assert.equal(iso(nextOccurrence(event, day('2026-10-01'))), '2026-10-31')
  })

  it('considera o próprio dia como próxima ocorrência', () => {
    const event = { eventDate: '2025-03-24', recurrence: 'MONTHLY' }
    assert.equal(iso(nextOccurrence(event, today)), '2026-09-24')
  })

  it('repete todo ano, inclusive em 29 de fevereiro', () => {
    assert.equal(iso(nextOccurrence({ eventDate: '2020-06-10', recurrence: 'YEARLY' }, today)), '2027-06-10')
    assert.equal(iso(nextOccurrence({ eventDate: '2024-02-29', recurrence: 'YEARLY' }, today)), '2027-02-28')
  })
})

describe('eventos passados', () => {
  const today = day('2026-09-24')
  const events = [
    { id: 'praia', eventDate: '2026-09-01', recurrence: 'NONE' },
    { id: 'jantar', eventDate: '2026-10-05', recurrence: 'NONE' },
    { id: 'mesversario', eventDate: '2024-06-26', recurrence: 'MONTHLY' },
  ]

  it('não trata um evento único que já passou como próximo plano', () => {
    assert.equal(isPastEvent(events[0], today), true)
    assert.deepEqual(
      upcomingEvents(events, today).map(({ event }) => event.id),
      ['mesversario', 'jantar'],
    )
  })
})

describe('nextMonthiversary', () => {
  it('conta os meses completos e os dias que faltam', () => {
    assert.deepEqual(nextMonthiversary('2024-06-26', day('2026-09-24')), {
      date: day('2026-09-26'),
      months: 27,
      days: 2,
    })
  })

  it('reconhece o próprio dia', () => {
    const result = nextMonthiversary('2024-06-26', day('2026-09-26'))
    assert.equal(result.days, 0)
    assert.equal(result.months, 27)
  })

  it('usa o último dia do mês para quem começou num dia 31', () => {
    const result = nextMonthiversary('2026-01-31', day('2026-09-24'))
    assert.equal(iso(result.date), '2026-09-30')
    assert.equal(result.months, 8)
  })
})

describe('relationshipDuration', () => {
  it('descreve o tempo juntos em anos, meses e dias', () => {
    const duration = relationshipDuration('2024-06-26', day('2026-09-24'))
    assert.deepEqual(
      { years: duration.years, months: duration.months, days: duration.days },
      { years: 2, months: 2, days: 29 },
    )
    assert.equal(formatDuration(duration), '2 anos, 2 meses e 29 dias')
    assert.equal(formatDuration(duration, { withDays: false }), '2 anos e 2 meses')
  })

  it('usa o singular e trata o primeiro dia', () => {
    assert.equal(formatDuration(relationshipDuration('2025-08-23', day('2026-09-24'))), '1 ano, 1 mês e 1 dia')
    assert.equal(formatDuration(relationshipDuration('2026-09-24', day('2026-09-24'))), 'hoje')
  })
})

describe('textos de data', () => {
  it('escolhe a saudação pela hora', () => {
    assert.equal(greetingFor(new Date(2026, 8, 24, 7)), 'Bom dia')
    assert.equal(greetingFor(new Date(2026, 8, 24, 15)), 'Boa tarde')
    assert.equal(greetingFor(new Date(2026, 8, 24, 22)), 'Boa noite')
    assert.equal(greetingFor(new Date(2026, 8, 24, 2)), 'Boa noite')
  })

  it('escreve a data do cabeçalho com só a primeira letra maiúscula', () => {
    assert.equal(formatLongDate(new Date(2026, 8, 24)), 'Quinta-feira, 24 de setembro')
  })

  it('conta as semanas do mês a partir de segunda-feira', () => {
    assert.deepEqual(monthWeekInfo(new Date(2026, 8, 24)), { current: 4, total: 5, month: 'setembro' })
    assert.deepEqual(monthWeekInfo(new Date(2026, 6, 27)), { current: 5, total: 5, month: 'julho' })
  })

  it('resume o intervalo de um período', () => {
    assert.equal(formatPeriodRange('2026-09-21', '2026-09-27'), '21 a 27 set')
    assert.equal(formatPeriodRange('2026-09-28', '2026-10-04'), '28 set a 4 out')
    assert.equal(formatPeriodRange('2026-09-01', '2026-09-30'), 'Setembro')
  })

  it('mostra há quanto tempo algo aconteceu', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    assert.equal(formatRelativeTime(new Date(2026, 8, 24, 14, 59, 30), now), 'agora')
    assert.equal(formatRelativeTime(new Date(2026, 8, 24, 14, 40), now), 'há 20 min')
    assert.equal(formatRelativeTime(new Date(2026, 8, 24, 9, 0), now), 'há 6 h')
    assert.equal(formatRelativeTime(new Date(2026, 8, 23, 23, 0), now), 'ontem')
    assert.equal(formatRelativeTime(new Date(2026, 8, 10, 12, 0), now), '10 set')
  })
})
