import { LogOut, RefreshCw, WifiOff } from 'lucide-react'
import { Brand } from '../components/Brand'

export function LoadingScreen({ error, onRetry, onLogout }) {
  if (!error) {
    return (
      <div className="loading-screen" role="status">
        <Brand />
        <span>Preparando o espaço de vocês…</span>
      </div>
    )
  }

  return (
    <div className="loading-screen offline-screen" role="alert">
      <Brand />
      <WifiOff size={26} />
      <strong>Não conseguimos carregar o espaço de vocês.</strong>
      <span>{error}</span>
      <div className="offline-actions">
        <button className="button primary" onClick={onRetry}>
          <RefreshCw size={17} />
          Tentar de novo
        </button>
        <button className="button secondary" onClick={onLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </div>
  )
}
