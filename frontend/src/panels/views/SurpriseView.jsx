import { CalendarPlus, Check, Gift, HeartHandshake } from 'lucide-react'
import { usePersistentState } from '../../hooks/usePersistentState'
import { formatMonthName } from '../../lib/dates'
import { surpriseForMonth } from '../../lib/ideas'

export function SurpriseView({ app }) {
  const idea = surpriseForMonth(app.today)
  const monthKey = `${app.today.getFullYear()}-${`${app.today.getMonth() + 1}`.padStart(2, '0')}`
  const [state, setState] = usePersistentState(
    `denguinho-surprise-v2:${app.couple.id}:${monthKey}`,
    { accepted: false, completed: false },
  )

  return (
    <div className="surprise-content">
      <div className="surprise-seal">
        <Gift size={34} />
        <span>{formatMonthName(app.today)}</span>
      </div>
      <p className="eyebrow">Uma ideia fora da rotina</p>
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <div className="surprise-rules">
        <span>Sem pontuação</span>
        <span>Sem cobrança</span>
        <span>Só vocês</span>
      </div>
      {!state.accepted ? (
        <button
          className="button primary wide"
          onClick={() => setState((current) => ({ ...current, accepted: true }))}
        >
          <HeartHandshake size={18} />
          Topamos essa
        </button>
      ) : (
        <>
          <div className="surprise-accepted">
            <Check size={20} />
            <div>
              <strong>Combinado guardado</strong>
              <p>Agora é só escolher quando e aproveitar.</p>
            </div>
            {!state.completed ? (
              <button onClick={() => setState((current) => ({ ...current, completed: true }))}>
                Já fizemos
              </button>
            ) : (
              <span>Feito 💛</span>
            )}
          </div>
          {!state.completed ? (
            <button
              className="button secondary wide"
              onClick={() => app.openPanel('events', { draft: { title: idea.title } })}
            >
              <CalendarPlus size={18} />
              Marcar na agenda
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
