import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, isDemoMode } from '../api'

// Em produção, 30 s bastam para ver o que a outra pessoa fez; na demonstração a
// "parceira" responde em segundos.
const POLL_INTERVAL_MS = isDemoMode ? 3_000 : 30_000

function replaceById(list, item) {
  return list.map((current) => (current.id === item.id ? item : current))
}

function upsert(list, item, { prepend = false } = {}) {
  if (list.some((current) => current.id === item.id)) return replaceById(list, item)
  return prepend ? [item, ...list] : [...list, item]
}

export function useCoupleData({ onCoupleLoaded }) {
  const [challenges, setChallenges] = useState([])
  const [scoreboard, setScoreboard] = useState(null)
  const [events, setEvents] = useState([])
  const [dengos, setDengos] = useState([])
  const [status, setStatus] = useState('loading')
  const [syncFailed, setSyncFailed] = useState(false)
  const onCoupleLoadedRef = useRef(onCoupleLoaded)
  const mountedRef = useRef(true)
  // Conta alterações em andamento: uma sincronização que cruzou uma alteração
  // pode trazer dados de antes dela e desfazer o que a pessoa acabou de fazer.
  const mutationsRef = useRef(0)
  const refreshRef = useRef(null)

  useEffect(() => {
    onCoupleLoadedRef.current = onCoupleLoaded
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    const version = mutationsRef.current
    const [nextChallenges, nextScoreboard, nextEvents, nextDengos, nextCouple] =
      await Promise.allSettled([
        api.listChallenges(),
        api.getScoreboard(),
        api.listEvents(),
        api.listDengos(),
        api.getCouple(),
      ])
    if (!mountedRef.current) return
    if (mutationsRef.current !== version) {
      window.setTimeout(() => void refreshRef.current?.(), 400)
      return
    }
    if (nextChallenges.status === 'fulfilled') setChallenges(nextChallenges.value)
    if (nextScoreboard.status === 'fulfilled') setScoreboard(nextScoreboard.value)
    if (nextEvents.status === 'fulfilled') setEvents(nextEvents.value)
    if (nextDengos.status === 'fulfilled') setDengos(nextDengos.value)
    if (nextCouple.status === 'fulfilled') onCoupleLoadedRef.current?.(nextCouple.value)
    const results = [nextChallenges, nextScoreboard, nextEvents, nextDengos]
    const failed = results.some((result) => result.status === 'rejected')
    setSyncFailed(failed)
    setStatus((current) => {
      if (!failed) return 'ready'
      return current === 'loading' && results.every((result) => result.status === 'rejected')
        ? 'error'
        : current === 'loading'
          ? 'ready'
          : current
    })
  }, [])

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  const refreshScoreboard = useCallback(async () => {
    try {
      const next = await api.getScoreboard()
      if (mountedRef.current) setScoreboard(next)
    } catch {
      // O placar volta a ser sincronizado na próxima atualização periódica.
    }
  }, [])

  useEffect(() => {
    const syncIfVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const firstLoad = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(syncIfVisible, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', syncIfVisible)
    window.addEventListener('online', syncIfVisible)
    return () => {
      window.clearTimeout(firstLoad)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', syncIfVisible)
      window.removeEventListener('online', syncIfVisible)
    }
  }, [refresh])

  const actions = useMemo(() => {
    const mutation =
      (run) =>
      async (...args) => {
        mutationsRef.current += 1
        try {
          return await run(...args)
        } finally {
          mutationsRef.current += 1
        }
      }

    return {
      refresh,
      retry: async () => {
        setStatus('loading')
        await refresh()
      },

      createChallenge: mutation(async (data) => {
        const created = await api.createChallenge(data)
        setChallenges((current) => upsert(current, created))
        return created
      }),
      updateChallenge: mutation(async (challengeId, data) => {
        const updated = await api.updateChallenge(challengeId, data)
        setChallenges((current) => replaceById(current, updated))
        return updated
      }),
      deleteChallenge: mutation(async (challengeId) => {
        await api.deleteChallenge(challengeId)
        setChallenges((current) => current.filter((item) => item.id !== challengeId))
      }),
      advanceChallenge: mutation(async (challengeId) => {
        const result = await api.advanceChallenge(challengeId)
        setChallenges((current) => replaceById(current, result.challenge))
        void refreshScoreboard()
        return result
      }),
      undoChallengeProgress: mutation(async (challengeId, progressId) => {
        await api.undoChallengeProgress(challengeId, progressId)
        const [nextChallenges] = await Promise.all([api.listChallenges(), refreshScoreboard()])
        if (mountedRef.current) setChallenges(nextChallenges)
      }),

      createEvent: mutation(async (event) => {
        const created = await api.createEvent(event)
        setEvents((current) => upsert(current, created))
        return created
      }),
      updateEvent: mutation(async (eventId, event) => {
        const updated = await api.updateEvent(eventId, event)
        setEvents((current) => replaceById(current, updated))
        return updated
      }),
      deleteEvent: mutation(async (eventId) => {
        await api.deleteEvent(eventId)
        setEvents((current) => current.filter((item) => item.id !== eventId))
      }),

      sendDengo: mutation(async (dengo) => {
        const created = await api.sendDengo(dengo)
        setDengos((current) => upsert(current, created, { prepend: true }))
        void refreshScoreboard()
        return created
      }),
      respondDengo: mutation(async (dengoId, response) => {
        const updated = await api.respondDengo(dengoId, response)
        setDengos((current) => replaceById(current, updated))
        return updated
      }),
      reactToDengo: mutation(async (dengoId, reaction) => {
        const updated = await api.reactToDengo(dengoId, reaction)
        setDengos((current) => replaceById(current, updated))
        return updated
      }),

      registerFocusSession: mutation(async (focusSession) => {
        const saved = await api.registerFocusSession(focusSession)
        void refreshScoreboard()
        return saved
      }),
    }
  }, [refresh, refreshScoreboard])

  return { challenges, scoreboard, events, dengos, status, syncFailed, actions }
}
