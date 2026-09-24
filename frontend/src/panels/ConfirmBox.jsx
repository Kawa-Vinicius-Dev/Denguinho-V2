import { useState } from 'react'

export function ConfirmBox({ title, description, confirmLabel, busyLabel, onConfirm, onCancel, className = '' }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className={`event-delete-confirmation ${className}`.trim()} role="alert">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button type="button" onClick={onCancel} disabled={busy}>
        Cancelar
      </button>
      <button
        type="button"
        className="confirm-delete"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onConfirm()
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? busyLabel : confirmLabel}
      </button>
    </div>
  )
}
