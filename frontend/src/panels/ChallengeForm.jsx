import { useState } from 'react'
import { Check } from 'lucide-react'
import { MAX_GOAL, categoryOptions, periodOptions, pointsPerAdvance } from '../lib/challenges'

export function ChallengeForm({ mode = 'create', scope, initial, minGoal = 1, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    title: initial?.title || '',
    category: initial?.category || 'OTHER',
    period: initial?.period || 'WEEKLY',
    goal: initial?.goal || 4,
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isEdit = mode === 'edit'
  const periodHint = periodOptions.find(([value]) => value === draft.period)?.[2]
  const field = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    const goal = Number(draft.goal)
    if (!title) return
    if (!Number.isInteger(goal) || goal < Math.max(1, minGoal) || goal > MAX_GOAL) {
      setError(`A meta precisa ficar entre ${Math.max(1, minGoal)} e ${MAX_GOAL}.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ ...draft, title, goal })
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <form
      className={`new-challenge-form${isEdit ? ' challenge-edit-form' : ''}`}
      onSubmit={submit}
      noValidate
    >
      <label>
        Nome do desafio
        <input
          value={draft.title}
          onChange={field('title')}
          placeholder={scope === 'COUPLE' ? 'Ex.: Cozinhar juntos' : 'Ex.: Ler 20 páginas'}
          maxLength={80}
          required
          autoFocus={!isEdit}
        />
      </label>
      <label>
        Categoria
        <select value={draft.category} onChange={field('category')}>
          {categoryOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="challenge-form-row">
        <label>
          Frequência
          <select value={draft.period} onChange={field('period')}>
            {periodOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <small className="field-hint">{periodHint}.</small>
        </label>
        <label>
          {isEdit ? 'Meta total' : 'Qual é a meta?'}
          <input
            type="number"
            inputMode="numeric"
            min={Math.max(1, minGoal)}
            max={MAX_GOAL}
            value={draft.goal}
            onChange={field('goal')}
            required
          />
          <small className="field-hint">
            {draft.period === 'MONTHLY' ? 'Avanços por mês' : 'Avanços por semana'}, ex.: 4 aulas.
          </small>
        </label>
      </div>
      {isEdit ? (
        <small className="challenge-edit-note">
          O progresso atual é mantido. A meta não pode ficar abaixo dos avanços já
          registrados neste período.
        </small>
      ) : (
        <p>
          Cada avanço vale {pointsPerAdvance[scope]} pontos no placar{' '}
          {scope === 'COUPLE' ? 'do casal' : 'individual'}.
        </p>
      )}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className={isEdit ? 'challenge-edit-actions' : 'challenge-form-actions'}>
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy || !draft.title.trim()}>
          {isEdit ? <Check size={17} /> : null}
          {busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar desafio'}
        </button>
      </div>
    </form>
  )
}
