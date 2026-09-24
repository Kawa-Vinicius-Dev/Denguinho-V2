import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock } from '../lib/dates'
import { readJson, writeJson } from '../lib/storage'

export const MIN_FOCUS_MINUTES = 5
export const focusDurations = [15, 25, 45]

const idleSession = {
  status: 'idle',
  task: '',
  duration: 25,
  startedAt: null,
  endsAt: null,
  remainingMs: 0,
  result: null,
}

function normalize(stored) {
  if (!stored || typeof stored !== 'object' || !stored.status) return idleSession
  return { ...idleSession, ...stored }
}

// O cronômetro guarda o horário de término em vez de contar segundos: continua
// certo com a aba em segundo plano, depois de recarregar e entre abas abertas.
export function useFocusSession(userId, { onComplete }) {
  const storageKey = `denguinho-focus-v2:${userId}`
  const [session, setSession] = useState(() => normalize(readJson(storageKey, null)))
  const [now, setNow] = useState(() => Date.now())
  const sessionRef = useRef(session)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const commit = useCallback(
    (next) => {
      sessionRef.current = next
      writeJson(storageKey, next)
      setSession(next)
    },
    [storageKey],
  )

  const save = useCallback(
    (startedAt, task, minutes) => {
      onCompleteRef
        .current({ task, minutes })
        .then((saved) => {
          const current = sessionRef.current
          if (current.startedAt !== startedAt) return
          commit({ ...current, result: { ...current.result, points: saved.points, state: 'saved' } })
        })
        .catch(() => {
          const current = sessionRef.current
          if (current.startedAt !== startedAt) return
          commit({ ...current, result: { ...current.result, state: 'error' } })
        })
    },
    [commit],
  )

  const finish = useCallback(() => {
    const current = sessionRef.current
    if (current.status !== 'running' && current.status !== 'paused') return
    // Outra aba pode ter encerrado a mesma sessão um instante antes.
    const stored = normalize(readJson(storageKey, null))
    if (stored.startedAt === current.startedAt && stored.status === 'completed') {
      sessionRef.current = stored
      setSession(stored)
      return
    }
    const remaining =
      current.status === 'running' ? Math.max(0, current.endsAt - Date.now()) : current.remainingMs
    const minutes = Math.floor((current.duration * 60_000 - remaining) / 60_000)
    const counts = minutes >= MIN_FOCUS_MINUTES
    commit({
      ...current,
      status: 'completed',
      endsAt: null,
      remainingMs: 0,
      result: { minutes, points: 0, state: counts ? 'saving' : 'too-short', feeling: '' },
    })
    if (counts) save(current.startedAt, current.task, minutes)
  }, [commit, save, storageKey])

  useEffect(() => {
    if (session.status !== 'running') return undefined
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (sessionRef.current.status === 'running' && sessionRef.current.endsAt <= current) finish()
    }
    const timer = window.setInterval(tick, 1000)
    const firstTick = window.setTimeout(tick, 0)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(firstTick)
    }
  }, [session.status, finish])

  useEffect(() => {
    const syncFromOtherTab = (event) => {
      if (event.key !== storageKey) return
      const next = normalize(readJson(storageKey, null))
      sessionRef.current = next
      setSession(next)
    }
    window.addEventListener('storage', syncFromOtherTab)
    return () => window.removeEventListener('storage', syncFromOtherTab)
  }, [storageKey])

  const remainingMs =
    session.status === 'running'
      ? Math.max(0, session.endsAt - now)
      : session.status === 'paused'
        ? session.remainingMs
        : session.status === 'idle'
          ? session.duration * 60_000
          : 0

  return {
    ...session,
    remainingMs,
    remainingLabel: formatClock(remainingMs),
    elapsedPercent:
      session.status === 'idle'
        ? 0
        : Math.round(100 - (remainingMs / (session.duration * 60_000)) * 100),
    start(task, duration) {
      const startedAt = Date.now()
      setNow(startedAt)
      commit({
        ...idleSession,
        status: 'running',
        task,
        duration,
        startedAt,
        endsAt: startedAt + duration * 60_000,
      })
    },
    pause() {
      const current = sessionRef.current
      if (current.status !== 'running') return
      commit({ ...current, status: 'paused', endsAt: null, remainingMs: Math.max(0, current.endsAt - Date.now()) })
    },
    resume() {
      const current = sessionRef.current
      if (current.status !== 'paused') return
      const resumedAt = Date.now()
      setNow(resumedAt)
      commit({ ...current, status: 'running', endsAt: resumedAt + current.remainingMs, remainingMs: 0 })
    },
    finish,
    retrySave() {
      const current = sessionRef.current
      if (current.result?.state !== 'error') return
      commit({ ...current, result: { ...current.result, state: 'saving' } })
      save(current.startedAt, current.task, current.result.minutes)
    },
    setFeeling(feeling) {
      const current = sessionRef.current
      if (!current.result) return
      commit({ ...current, result: { ...current.result, feeling } })
    },
    reset() {
      commit({ ...idleSession, duration: sessionRef.current.duration })
    },
  }
}
