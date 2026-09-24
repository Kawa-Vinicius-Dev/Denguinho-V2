import { useState } from 'react'
import { CalendarDays, HeartHandshake, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  daysBetween,
  formatDuration,
  formatFullDate,
  formatShortDate,
  nextMonthiversary,
  parseLocalDate,
  pastEvents,
  relationshipDuration,
  relativeDays,
  toDateInputValue,
  upcomingEvents,
} from '../../lib/dates'
import { recurrenceLabel } from '../../lib/events'
import { plural } from '../../lib/text'
import { ConfirmBox } from '../ConfirmBox'
import { EventForm } from '../EventForm'

function RelationshipCard({ startedOn, today }) {
  const start = parseLocalDate(startedOn)
  if (!start) return null
  const day = start.getDate()
  const duration = relationshipDuration(startedOn, today)
  const next = nextMonthiversary(startedOn, today)
  return (
    <article className="relationship-date-card">
      <span className="relationship-day">{`${day}`.padStart(2, '0')}</span>
      <div>
        <p>Nosso dia</p>
        <h3>
          Todo dia {day}
          {day > 28 ? ' (ou o último dia do mês)' : ''}, mais um mês da história de vocês.
        </h3>
        <span>
          Desde {formatFullDate(start)}
          {duration && duration.totalMonths > 0
            ? ` · ${formatDuration(duration, { withDays: false })} juntos`
            : ''}
        </span>
        {next ? (
          <span className="relationship-next">
            {next.days === 0
              ? `Hoje vocês completam ${next.months} meses 💛`
              : `Próximo: ${formatShortDate(next.date)}, ${relativeDays(next.days)} · ${next.months} meses`}
          </span>
        ) : null}
      </div>
      <HeartHandshake size={23} />
    </article>
  )
}

export function EventsView({ app, draft }) {
  const [creating, setCreating] = useState(Boolean(draft?.title))
  const [editingId, setEditingId] = useState('')
  const [confirmingId, setConfirmingId] = useState('')
  const upcoming = upcomingEvents(app.events, app.today)
  const past = pastEvents(app.events, app.today)

  const create = async (event) => {
    await app.actions.createEvent(event)
    setCreating(false)
    app.notify('Evento guardado na agenda de vocês.')
  }

  const update = async (eventId, event) => {
    await app.actions.updateEvent(eventId, event)
    setEditingId('')
    app.notify('Evento atualizado na agenda de vocês.')
  }

  const remove = async (eventId) => {
    try {
      await app.actions.deleteEvent(eventId)
      setConfirmingId('')
      app.notify('Evento excluído da agenda.')
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    }
  }

  const renderEvent = ({ event, date }, isPast) => {
    if (editingId === event.id) {
      return (
        <EventForm
          key={event.id}
          heading="Editar evento"
          initial={event}
          submitLabel="Salvar evento"
          busyLabel="Salvando…"
          onSubmit={(changes) => update(event.id, changes)}
          onCancel={() => setEditingId('')}
        />
      )
    }
    const days = daysBetween(app.today, date)
    return (
      <article className={`agenda-event${isPast ? ' is-past' : ''}${days === 0 ? ' is-today' : ''}`} key={event.id}>
        <time dateTime={toDateInputValue(date)}>
          <strong>{`${date.getDate()}`.padStart(2, '0')}</strong>
          <span>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
        </time>
        <div>
          <h3>{event.title}</h3>
          <p>
            <CalendarDays size={14} />
            {recurrenceLabel(event.recurrence)} · {relativeDays(days)}
          </p>
        </div>
        <div className="agenda-actions">
          <button
            className="agenda-edit"
            aria-label={`Editar ${event.title}`}
            onClick={() => {
              setEditingId(event.id)
              setConfirmingId('')
              setCreating(false)
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            className="agenda-delete"
            aria-label={`Excluir ${event.title}`}
            onClick={() => {
              setConfirmingId(event.id)
              setEditingId('')
            }}
          >
            <Trash2 size={17} />
          </button>
        </div>
        {confirmingId === event.id ? (
          <ConfirmBox
            title={`Excluir “${event.title}”?`}
            description="Essa ação remove o evento da agenda do casal."
            confirmLabel="Excluir"
            busyLabel="Excluindo…"
            onConfirm={() => remove(event.id)}
            onCancel={() => setConfirmingId('')}
          />
        ) : null}
      </article>
    )
  }

  return (
    <>
      <RelationshipCard startedOn={app.couple.relationshipStartedOn} today={app.today} />

      <div className="agenda-toolbar">
        <div>
          <strong>Próximos momentos</strong>
          <span>{plural(upcoming.length, 'evento', 'eventos')}</span>
        </div>
        <button
          className="new-challenge-button"
          aria-expanded={creating}
          onClick={() => {
            setCreating((current) => !current)
            setEditingId('')
            setConfirmingId('')
          }}
        >
          <Plus size={16} />
          Novo evento
        </button>
      </div>

      {creating ? (
        <EventForm
          initial={draft}
          submitLabel="Adicionar à agenda"
          busyLabel="Guardando…"
          onSubmit={create}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      <div className="agenda-list">
        {app.dataStatus === 'loading' ? (
          <div className="list-skeleton" aria-label="Carregando agenda">
            <span />
            <span />
          </div>
        ) : upcoming.length ? (
          upcoming.map((item) => renderEvent(item, false))
        ) : (
          <div className="challenge-empty">
            <CalendarDays size={22} />
            <p>A agenda está livre. Qual vai ser o primeiro rolê?</p>
          </div>
        )}
      </div>

      {past.length ? (
        <details className="agenda-past">
          <summary>Momentos que já passaram ({past.length})</summary>
          <div className="agenda-list">{past.map((item) => renderEvent(item, true))}</div>
        </details>
      ) : null}
    </>
  )
}
