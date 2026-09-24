import { useCallback, useEffect, useRef, useState } from 'react'
import { isDemoMode } from '../api'

function release(url) {
  if (url && url.startsWith('blob:') && !isDemoMode) URL.revokeObjectURL(url)
}

// Fotos privadas só saem da API com o token, então viram blob URLs locais. A URL
// antiga só é liberada depois que a nova chega, para a imagem não piscar.
export function useProtectedImage(enabled, load) {
  const [url, setUrl] = useState(null)
  const [version, setVersion] = useState(0)
  const currentRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    load()
      .then((next) => {
        if (!active) {
          release(next)
          return
        }
        const previous = currentRef.current
        currentRef.current = next
        setUrl(next)
        if (previous !== next) release(previous)
      })
      .catch(() => {
        // Sem a foto, o cartão usa a ilustração padrão.
      })
    return () => {
      active = false
    }
  }, [enabled, load, version])

  useEffect(() => () => release(currentRef.current), [])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  return [enabled ? url : null, reload]
}
