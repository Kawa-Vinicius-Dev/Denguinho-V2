import { Bell, ChevronRight, Gift, LogOut, PartyPopper, Settings, Trophy, UserRound } from 'lucide-react'

export function MoreView({ app }) {
  const items = [
    [UserRound, 'Minha conta', 'Foto, nome e senha', app.openAccount],
    [Trophy, 'Conquistas', 'Relembre o progresso de vocês', () => app.openPanel('journey')],
    [PartyPopper, 'Retrospectiva', 'O melhor da semana de vocês', () => app.openPanel('recap')],
    [Gift, 'Surpresa do mês', 'Uma ideia leve para fazer juntos', () => app.openPanel('surprise')],
    [Settings, 'Configurações', 'Jornada, aparência e preferências', app.openSettings],
    [Bell, 'Notificações', 'Veja as novidades de vocês', () => app.openPanel('notifications')],
    [LogOut, 'Sair', 'Voltar para a entrada', app.onLogout],
  ]
  return (
    <div className="more-actions">
      {items.map(([Icon, title, description, onClick]) => (
        <button key={title} onClick={onClick}>
          <Icon size={20} />
          <span>
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  )
}
