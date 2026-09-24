import { CalendarDays, Focus, Home, LayoutList, LogOut, Menu, Trophy } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Brand } from '../components/Brand'

const sideItems = [
  ['home', Home, 'Início'],
  ['challenges', LayoutList, 'Desafios'],
  ['events', CalendarDays, 'Agenda do casal'],
  ['focus', Focus, 'Foco juntos'],
  ['journey', Trophy, 'Conquistas'],
]

const mobileItems = [
  ['home', Home, 'Início'],
  ['challenges', LayoutList, 'Desafios'],
  ['events', CalendarDays, 'Agenda'],
  ['focus', Focus, 'Foco'],
  ['more', Menu, 'Mais'],
]

export function SideNav({ active, onNavigate, user, avatarUrl, onOpenAccount, onLogout }) {
  return (
    <aside className="side-nav">
      <Brand />
      <nav aria-label="Navegação principal">
        {sideItems.map(([id, Icon, label]) => (
          <button
            key={id}
            className={active === id ? 'active' : ''}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
      <div className="side-footer">
        <button className="account-trigger" onClick={onOpenAccount}>
          <Avatar name={user.name} imageUrl={avatarUrl} />
          <span className="account-trigger-copy">
            <strong>{user.name}</strong>
            <small>Minha conta</small>
          </span>
        </button>
        <button className="side-logout" aria-label="Sair" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}

export function MobileNav({ active, onNavigate }) {
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {mobileItems.map(([id, Icon, label]) => (
        <button
          key={id}
          className={`${id === 'focus' ? 'focus-mobile ' : ''}${active === id ? 'active' : ''}`.trim()}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
