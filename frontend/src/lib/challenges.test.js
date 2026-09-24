import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canAdvance, currentPeriod, jointProgress, sortChallenges } from './challenges.js'

const challenge = (overrides) => ({
  id: 'c',
  scope: 'INDIVIDUAL',
  ownerId: 'me',
  goal: 4,
  progress: 0,
  completed: false,
  createdAt: '2026-09-01T12:00:00Z',
  ...overrides,
})

describe('desafios', () => {
  it('só deixa avançar desafios próprios ou do casal que ainda não bateram a meta', () => {
    assert.equal(canAdvance(challenge(), 'me'), true)
    assert.equal(canAdvance(challenge({ ownerId: 'partner' }), 'me'), false)
    assert.equal(canAdvance(challenge({ scope: 'COUPLE', ownerId: null }), 'me'), true)
    assert.equal(canAdvance(challenge({ completed: true }), 'me'), false)
  })

  it('ordena pendentes que a pessoa pode avançar antes dos demais', () => {
    const sorted = sortChallenges(
      [
        challenge({ id: 'done', completed: true }),
        challenge({ id: 'partner', ownerId: 'partner' }),
        challenge({ id: 'couple', scope: 'COUPLE', ownerId: null, createdAt: '2026-09-02T12:00:00Z' }),
        challenge({ id: 'mine' }),
      ],
      'me',
    )
    assert.deepEqual(sorted.map((item) => item.id), ['mine', 'couple', 'partner', 'done'])
  })

  it('calcula a missão conjunta só com desafios em casal', () => {
    assert.equal(jointProgress([challenge()]), null)
    assert.equal(
      jointProgress([
        challenge({ scope: 'COUPLE', progress: 2, goal: 4 }),
        challenge({ scope: 'COUPLE', progress: 3, goal: 3 }),
        challenge({ progress: 4, goal: 4 }),
      ]),
      75,
    )
  })

  it('usa semanas de segunda a domingo e meses completos', () => {
    const today = new Date(2026, 8, 24)
    assert.deepEqual(
      [currentPeriod('WEEKLY', today).startsOn, currentPeriod('WEEKLY', today).endsOn],
      ['2026-09-21', '2026-09-27'],
    )
    assert.deepEqual(
      [currentPeriod('MONTHLY', today).startsOn, currentPeriod('MONTHLY', today).endsOn],
      ['2026-09-01', '2026-09-30'],
    )
  })
})
