import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { ToastContext } from '../hooks/useToast'

let nextToastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  // Avisos com a mesma chave (ou o mesmo texto) substituem o anterior: um
  // "Desfazer" antigo não fica na tela depois que o avanço já foi desfeito.
  const notify = useCallback(
    (message, { tone = 'success', action, duration, key = message } = {}) => {
      nextToastId += 1
      const id = nextToastId
      setToasts((current) => [
        ...current.filter((toast) => toast.key !== key).slice(-1),
        { id, key, message, tone, action },
      ])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration ?? (action ? 7000 : 4200)),
      )
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`}>
            {toast.tone === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <p>{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.action.onClick()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="toast-close"
              aria-label="Fechar aviso"
              onClick={() => dismiss(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
