import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { addDays, startOfDay, toDateInputValue } from '../lib/dates'
import { recurrenceOptions } from '../lib/events'

export function EventForm({ initial, heading, submitLabel, busyLabel, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    title: initial?.title || '',
    eventDate: initial?.eventDate || toDateInputValue(addDays(startOfDay(), 1)),
    recurrence: initial?.recurrence || 'NONE',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title || !draft.eventDate) return
    setBusy(true)
    setError('')
    try {
      await onSubmit({ ...draft, title })
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <form
      className={`new-challenge-form event-form${heading ? ' event-edit-form' : ''}`}
      onSubmit={submit}
    >
      {heading ? (
        <div className="event-edit-heading">
          <div>
            <strong>{heading}</strong>
            <span>Atualize os detalhes desse momento.</span>
          </div>
          <Pencil size={18} />
        </div>
      ) : null}
      <label>
        O que vocês vão fazer?
        <input
          value={draft.title}
          onChange={field('title')}
          placeholder="Ex.: Ir à praia"
          maxLength={100}
          required
          autoFocus
        />
      </label>
      <div className="challenge-form-row">
        <label>
          Quando?
          <input type="date" value={draft.eventDate} onChange={field('eventDate')} required />
        </label>
        <label>
          Vai se repetir?
          <select value={draft.recurrence} onChange={field('recurrence')}>
            {recurrenceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="challenge-form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
