import { ChevronRight } from 'lucide-react'

export function FocusCard({ focus, onOpen }) {
  const active = focus.status === 'running' || focus.status === 'paused'
  return (
    <section className="focus-card">
      <div className="focus-illustration">
        <span>{active ? focus.remainingLabel : focus.duration}</span>
        <small>{focus.status === 'running' ? 'ao vivo' : focus.status === 'paused' ? 'pausado' : 'min'}</small>
      </div>
      <div>
        <p className="eyebrow light">Presença vale ponto</p>
        <h2>{active ? focus.task : 'Foco juntos'}</h2>
        <p>
          {active
            ? 'Cada minuto dessa sessão vira ponto para o casal.'
            : 'Escolham uma tarefa, façam companhia um ao outro e somem pontos juntos.'}
        </p>
        <button onClick={onOpen}>
          {active ? 'Abrir sessão' : 'Preparar sessão'} <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}
