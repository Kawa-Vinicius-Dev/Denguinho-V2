import { useState } from 'react'
import { Check, History, Settings, Target, Trash2, Undo2 } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressBar'
import {
  canAdvance,
  isOwnedBy,
  periodLabel,
  periodNoun,
  progressPercent,
  restartLabel,
} from '../../lib/challenges'
import { formatPeriodRange } from '../../lib/dates'
import { cheerEmojis } from '../../lib/dengos'
import { ChallengeForm } from '../ChallengeForm'
import { ConfirmBox } from '../ConfirmBox'

export function ChallengeDetailView({ app, challengeId }) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const challenge = app.challenges.find((item) => item.id === challengeId)

  if (!challenge) {
    return (
      <div className="challenge-empty">
        <Target size={22} />
        <p>Esse desafio não está mais na lista de vocês.</p>
        <button type="button" className="button secondary" onClick={() => app.openPanel('challenges')}>
          Ver todos os desafios
        </button>
      </div>
    )
  }

  const userId = app.user.id
  const owned = isOwnedBy(challenge, userId)
  const mineIndividual = challenge.scope === 'INDIVIDUAL' && challenge.ownerId === userId
  const percent = progressPercent(challenge)
  const inThisPeriod = periodNoun(challenge.period) === 'semana' ? 'nesta semana' : 'neste mês'
  const remaining = Math.max(0, challenge.goal - challenge.progress)
  const scopeLabel =
    challenge.scope === 'COUPLE'
      ? 'Desafio em casal'
      : mineIndividual
        ? 'Seu desafio individual'
        : `Desafio individual de ${app.partnerName}`

  const update = async (draft) => {
    await app.actions.updateChallenge(challenge.id, {
      title: draft.title,
      category: draft.category,
      period: draft.period,
      goal: draft.goal,
    })
    setEditing(false)
    app.notify('Alterações do desafio salvas.')
  }

  const remove = async () => {
    try {
      await app.actions.deleteChallenge(challenge.id)
      app.notify('Desafio excluído. Os pontos continuam no placar.')
      app.closePanel()
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    }
  }

  const cheer = async (emoji) => {
    try {
      await app.actions.sendDengo({ kind: 'CHEER', message: emoji, subject: challenge.title })
      app.notify(`Energia ${emoji} enviada para ${app.partnerName}.`)
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    }
  }

  return (
    <>
      <div className="challenge-detail-toolbar">
        <span>{scopeLabel}</span>
        {owned ? (
          <div className="challenge-detail-actions">
            <button
              type="button"
              aria-expanded={editing}
              onClick={() => {
                setEditing((current) => !current)
                setConfirmingDelete(false)
              }}
            >
              <Settings size={16} />
              {editing ? 'Fechar edição' : 'Editar desafio'}
            </button>
            <button
              type="button"
              className="challenge-delete-trigger"
              aria-label={`Excluir ${challenge.title}`}
              onClick={() => {
                setConfirmingDelete(true)
                setEditing(false)
              }}
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        ) : null}
      </div>

      {confirmingDelete ? (
        <ConfirmBox
          className="challenge-delete-confirmation"
          title={`Excluir “${challenge.title}”?`}
          description="O desafio sai da lista, mas os pontos conquistados continuam no placar."
          confirmLabel="Excluir desafio"
          busyLabel="Excluindo…"
          onConfirm={remove}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : null}

      {editing ? (
        <ChallengeForm
          mode="edit"
          scope={challenge.scope}
          initial={challenge}
          minGoal={challenge.progress}
          onSubmit={update}
          onCancel={() => setEditing(false)}
        />
      ) : null}

      <div className={`challenge-summary${challenge.completed ? ' is-complete' : ''}`}>
        <span>
          {periodLabel(challenge.period)} · {formatPeriodRange(challenge.periodStartsOn, challenge.periodEndsOn)}
        </span>
        <strong>{challenge.completed ? `Meta batida ${inThisPeriod}!` : `${percent}% concluído`}</strong>
        <ProgressBar value={percent} label={`Progresso de ${challenge.title}`} />
        <p>
          {challenge.progress} de {challenge.goal} avanços {inThisPeriod}.{' '}
          {challenge.completed
            ? `${restartLabel(challenge.period)}.`
            : `${remaining === 1 ? 'Falta 1 avanço' : `Faltam ${remaining} avanços`} para a meta.`}{' '}
          Cada avanço vale {challenge.pointsPerAdvance} pontos.
        </p>
      </div>

      <div className="challenge-primary-actions">
        <button
          className={`button wide ${!owned ? 'secondary' : challenge.completed ? 'success' : 'primary'}`}
          disabled={!canAdvance(challenge, userId) || app.advancingId === challenge.id}
          onClick={() => app.advanceChallenge(challenge)}
        >
          <Check size={18} />
          {!owned
            ? `Só ${app.partnerName} registra avanços aqui`
            : challenge.completed
              ? `Meta batida ${inThisPeriod}`
              : app.advancingId === challenge.id
                ? 'Registrando…'
                : 'Registrar avanço'}
        </button>
        {owned && challenge.lastProgressId ? (
          <button
            type="button"
            className="link-button"
            onClick={() => app.undoProgress(challenge.id, challenge.lastProgressId)}
          >
            <Undo2 size={15} />
            Desfazer meu último avanço
          </button>
        ) : null}
      </div>

      <section className="challenge-history" aria-labelledby="challenge-history-title">
        <h3 id="challenge-history-title">
          <History size={16} />
          Histórico
        </h3>
        {challenge.history?.length ? (
          <ol>
            {challenge.history.map((period) => (
              <li key={period.startsOn} className={period.completed ? 'done' : ''}>
                <span>{formatPeriodRange(period.startsOn, period.endsOn)}</span>
                <b>
                  {period.progress}/{challenge.goal}
                </b>
                {period.completed ? <Check size={15} aria-label="Meta batida" /> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p>
            O histórico aparece quando {challenge.period === 'MONTHLY' ? 'este mês' : 'esta semana'}{' '}
            terminar.
          </p>
        )}
      </section>

      {!mineIndividual ? (
        <div className="challenge-reactions">
          <span>Mandar energia para {app.partnerName}</span>
          <div className="reaction-row">
            {cheerEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Mandar ${emoji} para ${app.partnerName}`}
                onClick={() => cheer(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
