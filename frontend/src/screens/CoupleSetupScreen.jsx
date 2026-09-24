import { useState } from 'react'
import { ArrowRight, CalendarDays, LogOut } from 'lucide-react'
import { api } from '../api'
import { Brand } from '../components/Brand'
import { formatDuration, relationshipDuration, startOfDay, toDateInputValue } from '../lib/dates'

export function CoupleSetupScreen({ couple, onComplete, onLogout }) {
  const [relationshipStartedOn, setRelationshipStartedOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [today] = useState(() => startOfDay())
  const duration = relationshipDuration(relationshipStartedOn, today)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onComplete(
        await api.updateCouple({
          currentObjective: couple.currentObjective,
          relationshipStartedOn,
        }),
      )
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <main className="pairing-shell setup-shell">
      <header>
        <Brand />
        <button className="icon-text" onClick={onLogout}>
          <LogOut size={17} /> Sair
        </button>
      </header>
      <section className="pairing-card setup-card">
        <div className="pairing-heading">
          <span className="round-icon">
            <CalendarDays />
          </span>
          <p className="eyebrow">O primeiro dia de vocês</p>
          <h1>Que dia você começou a namorar com teu dengo?</h1>
          <p>
            A gente usa essa data para lembrar o dia de vocês todos os meses e
            deixar os momentos importantes organizados na agenda do casal.
          </p>
        </div>
        <form className="setup-form" onSubmit={submit}>
          <label>
            Nosso namoro começou em
            <input
              type="date"
              value={relationshipStartedOn}
              min="1950-01-01"
              max={toDateInputValue(today)}
              onChange={(event) => setRelationshipStartedOn(event.target.value)}
              required
            />
          </label>
          {duration ? (
            <p className="setup-duration" role="status">
              {duration.totalDays === 0
                ? 'Começou hoje! Que venham muitos meses. 💛'
                : `Isso dá ${formatDuration(duration, { withDays: duration.totalMonths < 1 })} de história. 💛`}
            </p>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button primary wide" disabled={busy || !duration}>
            {busy ? 'Guardando…' : 'Guardar nosso dia'}
            {!busy ? <ArrowRight size={18} /> : null}
          </button>
        </form>
      </section>
    </main>
  )
}
