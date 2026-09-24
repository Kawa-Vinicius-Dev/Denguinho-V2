import { useEffect, useState } from 'react'

// Mantém datas e saudações corretas mesmo com o app aberto de um dia para o outro.
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}
