import { useState } from 'react'
import { Check, Focus, LoaderCircle, MessageCircleHeart, PartyPopper, Pause, Play, RefreshCw } from 'lucide-react'
import { MIN_FOCUS_MINUTES, focusDurations } from '../../hooks/useFocusSession'

const feelings = ['Leve', 'Focado', 'Cansado']

function FocusResult({ app }) {
  const { focus } = app
  const result = focus.result || {}
  return (
    <>
      <div className="focus-feeling">
        {result.state === 'saving' ? <LoaderCircle size={20} className="spin" /> : <PartyPopper size={20} />}
        <div>
          {result.state === 'saved' ? (
            <>
              <strong>+{result.points} pontos para o casal</strong>
              <p>
                {result.minutes} min de foco em “{focus.task}”. Como você se sentiu nessa sessão?
              </p>
            </>
          ) : result.state === 'saving' ? (
            <>
              <strong>Guardando os pontos…</strong>
              <p>{result.minutes} min de foco em “{focus.task}”.</p>
            </>
          ) : result.state === 'error' ? (
            <>
              <strong>Não consegui guardar os pontos</strong>
              <p>A sessão ficou salva aqui. Tente de novo quando a conexão voltar.</p>
            </>
          ) : (
            <>
              <strong>Sessão encerrada</strong>
              <p>
                Sessões com menos de {MIN_FOCUS_MINUTES} minutos não somam pontos. Na próxima
                vai!
              </p>
            </>
          )}
        </div>
        {result.state === 'error' ? (
          <button type="button" className="button secondary focus-retry" onClick={focus.retrySave}>
            <RefreshCw size={16} />
            Tentar de novo
          </button>
        ) : null}
        {result.state === 'saved' ? (
          <div className="feeling-options" role="group" aria-label="Como você se sentiu">
            {feelings.map((feeling) => (
              <button
                key={feeling}
                type="button"
                aria-pressed={result.feeling === feeling}
                className={result.feeling === feeling ? 'active' : ''}
                onClick={() => focus.setFeeling(feeling)}
              >
                {feeling}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button className="button secondary wide" onClick={focus.reset}>
        <Focus size={17} />
        Nova sessão
      </button>
    </>
  )
}

export function FocusView({ app }) {
  const { focus } = app
  const [task, setTask] = useState(focus.task || '')
  const [duration, setDuration] = useState(focus.duration || 25)
  const [inviting, setInviting] = useState(false)

  if (focus.status === 'completed') return <FocusResult app={app} />

  if (focus.status === 'running' || focus.status === 'paused') {
    return (
      <div className="focus-live">
        <div
          className={`focus-live-orbit ${focus.status}`}
          style={{ '--focus-progress': `${focus.elapsedPercent}%` }}
          role="timer"
          aria-label={`Tempo restante: ${focus.remainingLabel}`}
        >
          <span>{focus.remainingLabel}</span>
          <small>{focus.status === 'paused' ? 'pausado' : 'restantes'}</small>
        </div>
        <p className="focus-live-task">{focus.task}</p>
        <p className="focus-live-note">
          Quando a sessão terminar, cada minuto vira ponto para vocês. Pode fechar o app: o
          tempo continua contando.
        </p>
        <div className="focus-live-actions">
          <button className="button secondary" onClick={focus.status === 'paused' ? focus.resume : focus.pause}>
            {focus.status === 'paused' ? (
              <>
                <Play size={17} /> Continuar
              </>
            ) : (
              <>
                <Pause size={17} /> Pausar
              </>
            )}
          </button>
          <button className="button primary" onClick={focus.finish}>
            <Check size={17} /> Concluir
          </button>
        </div>
      </div>
    )
  }

  const invite = async () => {
    setInviting(true)
    try {
      const message = `Bora focar juntos?${task.trim() ? ` ${task.trim()}` : ''}`.slice(0, 80)
      await app.actions.sendDengo({ kind: 'REQUEST', message })
      app.notify(`Convite enviado para ${app.partnerName}.`)
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
    } finally {
      setInviting(false)
    }
  }

  return (
    <>
      <p>
        Escolham uma tarefa, definam o tempo e façam companhia um ao outro. Cada minuto
        concluído vira ponto para o casal.
      </p>
      <label className="focus-task-field">
        No que vocês vão focar?
        <input
          value={task}
          onChange={(event) => setTask(event.target.value)}
          placeholder="Ex.: organizar as próximas tarefas"
          maxLength={90}
        />
      </label>
      <div className="focus-options" role="group" aria-label="Duração da sessão">
        {focusDurations.map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={duration === minutes}
            className={duration === minutes ? 'selected' : ''}
            onClick={() => setDuration(minutes)}
          >
            <strong>{minutes}</strong>
            <span>min</span>
          </button>
        ))}
      </div>
      <button
        className="button primary wide"
        disabled={!task.trim()}
        onClick={() => focus.start(task.trim(), duration)}
      >
        <Focus size={18} />
        Começar juntos
      </button>
      <button className="button secondary wide" disabled={inviting} onClick={invite}>
        <MessageCircleHeart size={18} />
        {inviting ? 'Chamando…' : `Chamar ${app.partnerName} para focar junto`}
      </button>
    </>
  )
}
