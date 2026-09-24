import { useState } from 'react'
import { Bell, HeartHandshake, MessageCircleHeart, Send, Sparkles } from 'lucide-react'
import { dengoQuickReplies, dengoReactions } from '../../lib/dengos'
import { formatRelativeTime } from '../../lib/dates'

const cheerThanks = [
  ['💛', 'Coração amarelo'],
  ['🥰', 'Carinho'],
  ['👏', 'Aplausos'],
]

function isNew(value, seenBefore) {
  return Boolean(value) && (!seenBefore || new Date(value) > new Date(seenBefore))
}

function ReactionRow({ options, active, label, onReact }) {
  return (
    <div className="reaction-row" role="group" aria-label={label}>
      {options.map(([emoji, name]) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          aria-pressed={active === emoji}
          className={active === emoji ? 'active' : ''}
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

function ReplyForm({ onReply }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const reply = async (value) => {
    setBusy(true)
    try {
      await onReply(value)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="quick-replies" role="group" aria-label="Respostas rápidas do dengo">
        {dengoQuickReplies.map((option) => (
          <button key={option} type="button" disabled={busy} onClick={() => reply(option)}>
            {option}
          </button>
        ))}
      </div>
      <form
        className="custom-reply"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.trim()) void reply(text.trim())
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ou responda do seu jeito"
          aria-label="Resposta personalizada"
          maxLength={40}
        />
        <button type="submit" aria-label="Enviar resposta" disabled={busy || !text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </>
  )
}

export function NotificationsView({ app, seenBefore }) {
  const { dengos, partnerName, user, now } = app
  const pending = app.dengoSummary.pendingForMe
  const history = dengos.filter((dengo) => !pending.includes(dengo))

  const run = async (action, success) => {
    try {
      await action()
      if (success) app.notify(success)
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    }
  }

  if (!dengos.length) {
    return (
      <div className="challenge-empty">
        <Bell size={22} />
        <p>Nenhuma novidade ainda. Os dengos de vocês aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div className="notification-list">
      {pending.length ? <p className="notification-section-title">Para você responder</p> : null}
      {pending.map((dengo) => (
        <article key={dengo.id} className="notification-dengo needs-reply">
          <span>
            <MessageCircleHeart size={18} />
          </span>
          <div>
            <strong>{partnerName} pediu dengo</strong>
            <p>
              {app.preferences.notificationPreview
                ? `“${dengo.message}”`
                : 'Conteúdo oculto pelas suas preferências.'}{' '}
              <time dateTime={dengo.createdAt}>{formatRelativeTime(dengo.createdAt, now)}</time>
            </p>
            <ReplyForm
              onReply={(response) =>
                run(
                  () => app.actions.respondDengo(dengo.id, response),
                  `Resposta enviada para ${partnerName}.`,
                )
              }
            />
          </div>
        </article>
      ))}

      {history.length ? <p className="notification-section-title">Atividade recente</p> : null}
      {history.map((dengo) => {
        const mine = dengo.senderId === user.id
        const preview = app.preferences.notificationPreview
        if (dengo.kind === 'CHEER') {
          return (
            <article key={dengo.id} className={isNew(dengo.createdAt, seenBefore) && !mine ? 'is-new' : ''}>
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <strong>
                  {mine ? `Você mandou energia para ${partnerName}` : `${partnerName} mandou energia`}{' '}
                  {dengo.message}
                </strong>
                <p>
                  {dengo.subject ? `Para “${dengo.subject}”. ` : ''}
                  <time dateTime={dengo.createdAt}>{formatRelativeTime(dengo.createdAt, now)}</time>
                </p>
                {mine ? (
                  dengo.reaction ? (
                    <p className="dengo-reaction-note">
                      {partnerName} agradeceu {dengo.reaction}
                    </p>
                  ) : null
                ) : (
                  <ReactionRow
                    options={cheerThanks}
                    active={dengo.reaction}
                    label="Agradecer a energia"
                    onReact={(emoji) => run(() => app.actions.reactToDengo(dengo.id, emoji))}
                  />
                )}
              </div>
            </article>
          )
        }
        return (
          <article
            key={dengo.id}
            className={`notification-dengo${mine && isNew(dengo.respondedAt, seenBefore) ? ' is-new' : ''}`}
          >
            <span>{mine ? <MessageCircleHeart size={18} /> : <HeartHandshake size={18} />}</span>
            <div>
              <strong>{mine ? 'Você pediu dengo' : `${partnerName} pediu dengo`}</strong>
              <p>
                {preview || mine ? `“${dengo.message}” ` : 'Conteúdo oculto pelas suas preferências. '}
                <time dateTime={dengo.createdAt}>{formatRelativeTime(dengo.createdAt, now)}</time>
              </p>
              {dengo.response ? (
                <div className="dengo-response">
                  <small>{mine ? `${partnerName} respondeu` : 'Você respondeu'}</small>
                  <b>{dengo.response}</b>
                </div>
              ) : (
                <p className="dengo-waiting">Esperando {partnerName} responder…</p>
              )}
              {mine && dengo.response ? (
                <ReactionRow
                  options={dengoReactions}
                  active={dengo.reaction}
                  label="Reagir à resposta"
                  onReact={(emoji) => run(() => app.actions.reactToDengo(dengo.id, emoji))}
                />
              ) : null}
              {!mine && dengo.reaction ? (
                <p className="dengo-reaction-note">
                  {partnerName} reagiu {dengo.reaction}
                </p>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
