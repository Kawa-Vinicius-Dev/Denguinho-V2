import { useEffect } from 'react'
import { usePwaState } from '../hooks/usePwa'
import { useToast } from '../hooks/useToast'

const UPDATE_NOTICE_MS = 10 * 60_000

// Um deploy novo chegou enquanto o app estava aberto: oferece recarregar,
// sem interromper o que a pessoa está fazendo.
export function AppUpdateNotice() {
  const { updateReady } = usePwaState()
  const notify = useToast()

  useEffect(() => {
    if (!updateReady) return
    notify('Chegou uma versão nova do Denguinho.', {
      key: 'app-update',
      duration: UPDATE_NOTICE_MS,
      action: { label: 'Atualizar', onClick: () => window.location.reload() },
    })
  }, [updateReady, notify])

  return null
}
