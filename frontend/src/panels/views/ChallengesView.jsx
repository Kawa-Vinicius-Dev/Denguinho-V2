import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ChallengeCard } from '../../dashboard/ChallengeCard'
import { ChallengeEmptyState } from '../../dashboard/ChallengeEmptyState'
import { sortChallenges } from '../../lib/challenges'
import { formatMonthName } from '../../lib/dates'
import { ChallengeForm } from '../ChallengeForm'
import { ScoreGrid } from './ScoreGrid'

const scopes = [
  ['INDIVIDUAL', 'Individuais'],
  ['COUPLE', 'Em casal'],
]

export function ChallengesView({ app }) {
  const [scope, setScope] = useState('INDIVIDUAL')
  const [creating, setCreating] = useState(false)
  const visible = sortChallenges(
    app.challenges.filter((challenge) => challenge.scope === scope),
    app.user.id,
  )

  const create = async (draft) => {
    await app.actions.createChallenge({ ...draft, scope })
    app.notify('Novo desafio adicionado.')
    setCreating(false)
  }

  return (
    <>
      <ScoreGrid
        scoreboard={app.scoreboard}
        userId={app.user.id}
        partnerName={app.partnerName}
        userFirstName={app.userFirstName}
        monthName={formatMonthName(app.today)}
      />

      <div className="challenge-toolbar">
        <div className="challenge-tabs" role="tablist" aria-label="Tipo de desafio">
          {scopes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={scope === value}
              className={scope === value ? 'active' : ''}
              onClick={() => {
                setScope(value)
                setCreating(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="new-challenge-button"
          aria-expanded={creating}
          onClick={() => setCreating((current) => !current)}
        >
          <Plus size={16} />
          Novo desafio
        </button>
      </div>

      {creating ? (
        <ChallengeForm scope={scope} onSubmit={create} onCancel={() => setCreating(false)} />
      ) : (
        <div className="challenge-list panel-challenges" role="tabpanel">
          {app.dataStatus === 'loading' ? (
            <div className="list-skeleton" aria-label="Carregando desafios">
              <span />
              <span />
            </div>
          ) : visible.length ? (
            visible.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={app.user.id}
                partnerName={app.partnerName}
                busy={app.advancingId === challenge.id}
                onOpen={() => app.openPanel('challenge', { challengeId: challenge.id })}
                onAdvance={() => app.advanceChallenge(challenge)}
              />
            ))
          ) : (
            <ChallengeEmptyState scope={scope} onCreate={() => setCreating(true)} />
          )}
        </div>
      )}
    </>
  )
}
