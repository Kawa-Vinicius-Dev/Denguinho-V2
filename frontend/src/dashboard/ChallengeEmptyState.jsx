import { Plus, Target } from 'lucide-react'

export function ChallengeEmptyState({ scope = 'all', onCreate, compact = false }) {
  const scopeLabel =
    scope === 'COUPLE' ? 'em casal' : scope === 'INDIVIDUAL' ? 'individual' : 'individual ou em casal'

  return (
    <div className={`challenge-empty challenge-empty-guide${compact ? ' compact' : ''}`}>
      <div className="challenge-empty-heading">
        <span>
          <Target size={22} />
        </span>
        <div>
          <small>Comece do zero</small>
          <h3>Nenhum desafio por aqui ainda.</h3>
          <p>Crie um desafio {scopeLabel} e transforme cada avanço em pontos.</p>
        </div>
      </div>
      <ol className="challenge-empty-steps" aria-label="Como começar nos desafios">
        <li>
          <b>1</b>
          <span>Escolha o tipo</span>
        </li>
        <li>
          <b>2</b>
          <span>Defina uma meta</span>
        </li>
        <li>
          <b>3</b>
          <span>Registre os avanços</span>
        </li>
      </ol>
      <button type="button" className="button primary" onClick={onCreate}>
        <Plus size={16} />
        Criar primeiro desafio
      </button>
    </div>
  )
}
