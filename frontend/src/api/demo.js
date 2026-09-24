import { ApiError } from './client.js'
import { currentPeriod, pointsPerAdvance, previousPeriodStart } from '../lib/challenges.js'
import { dengoQuickReplies } from '../lib/dengos.js'
import { addDays, startOfDay, toDateInputValue } from '../lib/dates.js'
import { readJson, writeJson } from '../lib/storage.js'

// Modo apresentação: emula a API no navegador, com as mesmas regras do backend,
// e simula a outra pessoa da dupla para que os fluxos a dois possam ser vistos.
const STATE_KEY = 'denguinho-demo-v3'
const PARTNER_REPLY_DELAY_MS = 2500
const HISTORY_PERIODS = 4
const MAX_ACTIVE_CHALLENGES = 30

const demoUser = { id: 'demo-user', name: 'Kawã', email: 'usuario@exemple.com' }
const demoPartner = {
  id: 'demo-partner',
  name: 'Rilary',
  email: 'usuario2@exemple.com',
  coupleId: 'demo-couple',
  hasAvatar: false,
}

const initialState = {
  profileName: null,
  email: null,
  hasCouple: true,
  paired: true,
  objective: 'Planejar, executar e concluir — juntos.',
  relationshipStartedOn: null,
  photoPosition: { x: 50, y: 50 },
  events: [],
  challenges: [],
  progress: [],
  dengos: [],
  focusSessions: [],
}

// Imagens escolhidas na demonstração ficam só na memória desta aba.
let avatarUrl = null
let photoUrl = null

function load() {
  const stored = readJson(STATE_KEY, null)
  return stored && typeof stored === 'object' ? { ...initialState, ...stored } : { ...initialState }
}

function change(mutate) {
  const state = load()
  const result = mutate(state)
  writeJson(STATE_KEY, state)
  return result
}

function wait(value, delay = 220) {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), delay))
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function fail(status, code, message) {
  throw new ApiError(message, { status, code })
}

function currentUser(state) {
  return {
    ...demoUser,
    name: state.profileName || demoUser.name,
    email: state.email || demoUser.email,
    coupleId: state.hasCouple ? 'demo-couple' : null,
    hasAvatar: Boolean(avatarUrl),
  }
}

function currentCouple(state) {
  if (!state.hasCouple) {
    fail(409, 'COUPLE_REQUIRED', 'Crie um convite ou entre na dupla para continuar.')
  }
  const user = currentUser(state)
  return {
    id: 'demo-couple',
    members: state.paired ? [demoPartner, user] : [user],
    currentObjective: state.objective,
    relationshipStartedOn: state.relationshipStartedOn || null,
    photoPositionX: state.photoPosition?.x ?? 50,
    photoPositionY: state.photoPosition?.y ?? 50,
    hasCustomPhoto: Boolean(photoUrl),
    jointProgress: 0,
  }
}

function within(entries, start, next) {
  return entries.filter((entry) => {
    const date = new Date(entry.createdAt)
    return date >= start && date < next
  })
}

function toChallenge(state, challenge, now = new Date()) {
  const today = startOfDay(now)
  const period = currentPeriod(challenge.period, today)
  const entries = state.progress.filter((entry) => entry.challengeId === challenge.id)
  const current = within(entries, period.start, period.next)
  const createdOn = startOfDay(new Date(challenge.createdAt))
  const history = []
  let start = previousPeriodStart(challenge.period, period.start)
  for (let index = 0; index < HISTORY_PERIODS; index += 1) {
    const past = currentPeriod(challenge.period, start)
    if (past.next <= createdOn) break
    const count = within(entries, past.start, past.next).length
    history.push({
      startsOn: past.startsOn,
      endsOn: past.endsOn,
      progress: count,
      completed: count >= challenge.goal,
    })
    start = previousPeriodStart(challenge.period, start)
  }
  const mine = current.filter((entry) => entry.userId === demoUser.id)
  return {
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    period: challenge.period,
    scope: challenge.scope,
    ownerId: challenge.ownerId,
    goal: challenge.goal,
    pointsPerAdvance: challenge.pointsPerAdvance,
    progress: current.length,
    completed: current.length >= challenge.goal,
    periodStartsOn: period.startsOn,
    periodEndsOn: period.endsOn,
    lastProgressId: mine.at(-1)?.id ?? null,
    history,
    createdBy: challenge.createdBy,
    createdAt: challenge.createdAt,
  }
}

function activeChallenge(state, challengeId) {
  const challenge = state.challenges.find((item) => item.id === challengeId && !item.archivedAt)
  if (!challenge) fail(404, 'CHALLENGE_NOT_FOUND', 'Este desafio não foi encontrado.')
  return challenge
}

function requireOwner(challenge) {
  if (challenge.scope === 'INDIVIDUAL' && challenge.ownerId !== demoUser.id) {
    fail(
      403,
      'CHALLENGE_OWNER_ONLY',
      'Este é um desafio individual do seu dengo. Só quem o criou pode alterá-lo ou registrar avanços.',
    )
  }
}

function periodScore(state, start, next) {
  const progress = within(state.progress, start, next)
  const sessions = within(state.focusSessions, start, next)
  const members = [currentUser(state), ...(state.paired ? [demoPartner] : [])]
  return {
    startsOn: toDateInputValue(start),
    endsOn: toDateInputValue(addDays(next, -1)),
    members: members.map((member) => {
      const individual = progress.filter(
        (entry) => entry.scope === 'INDIVIDUAL' && entry.userId === member.id,
      )
      return {
        userId: member.id,
        name: member.name,
        points: individual.reduce((sum, entry) => sum + entry.points, 0),
        advances: individual.length,
      }
    }),
    couplePoints:
      progress
        .filter((entry) => entry.scope === 'COUPLE')
        .reduce((sum, entry) => sum + entry.points, 0) +
      sessions.reduce((sum, session) => sum + session.points, 0),
    advances: progress.length,
    focusSessions: sessions.length,
    focusMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    dengos: within(state.dengos, start, next).length,
  }
}

// A parceira da demonstração responde aos pedidos e agradece a energia recebida.
function simulatePartner(state, now = Date.now()) {
  const requests = state.dengos
    .filter((dengo) => dengo.senderId === demoUser.id && dengo.kind === 'REQUEST')
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
  state.dengos.forEach((dengo) => {
    const sentAt = new Date(dengo.createdAt).getTime()
    if (dengo.senderId !== demoUser.id || now - sentAt < PARTNER_REPLY_DELAY_MS) return
    if (dengo.kind === 'REQUEST' && !dengo.response) {
      dengo.response = dengoQuickReplies[requests.indexOf(dengo) % dengoQuickReplies.length]
      dengo.respondedAt = new Date(sentAt + PARTNER_REPLY_DELAY_MS).toISOString()
    }
    if (dengo.kind === 'CHEER' && !dengo.reaction) dengo.reaction = '💛'
  })
}

function requireDengo(state, dengoId) {
  const dengo = state.dengos.find((item) => item.id === dengoId)
  if (!dengo) fail(404, 'DENGO_NOT_FOUND', 'Este dengo não foi encontrado.')
  return dengo
}

export const demoApi = {
  async login(credentials) {
    const user = change((state) => {
      state.email = credentials.email.trim().toLowerCase()
      state.hasCouple = true
      state.paired = true
      return currentUser(state)
    })
    return wait({ token: 'demo-token', user })
  },

  async register(data) {
    const user = change((state) => {
      state.profileName = data.name.trim()
      state.email = data.email.trim().toLowerCase()
      state.hasCouple = false
      state.paired = false
      return currentUser(state)
    })
    return wait({ token: 'demo-token', user })
  },

  me: async () => wait(currentUser(load()), 120),

  async updateProfile(name) {
    return wait(change((state) => {
      state.profileName = name
      return currentUser(state)
    }))
  },

  changePassword: async () => wait(null),

  async uploadAvatar(file) {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    avatarUrl = URL.createObjectURL(file)
    return wait(currentUser(load()))
  },

  async removeAvatar() {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    avatarUrl = null
    return wait(currentUser(load()))
  },

  getAvatarUrl: async () => avatarUrl,

  getCouple: async () => wait(currentCouple(load()), 120),

  async createInvite() {
    change((state) => {
      state.hasCouple = true
    })
    return wait({ code: 'DENGO2', expiresAt: new Date(Date.now() + 48 * 3_600_000).toISOString() })
  },

  async joinCouple() {
    return wait(change((state) => {
      state.hasCouple = true
      state.paired = true
      return currentCouple(state)
    }))
  },

  async updateCouple(changes) {
    return wait(change((state) => {
      if (changes.currentObjective !== undefined) state.objective = changes.currentObjective
      if (changes.relationshipStartedOn !== undefined) {
        state.relationshipStartedOn = changes.relationshipStartedOn || null
      }
      if (Number.isFinite(changes.photoPositionX) && Number.isFinite(changes.photoPositionY)) {
        state.photoPosition = { x: changes.photoPositionX, y: changes.photoPositionY }
      }
      return currentCouple(state)
    }))
  },

  async uploadPhoto(file) {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoUrl = URL.createObjectURL(file)
    return wait(currentCouple(load()))
  },

  async removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoUrl = null
    return wait(currentCouple(load()))
  },

  getPhotoUrl: async () => photoUrl,

  listEvents: async () => wait(load().events, 120),

  async createEvent(event) {
    return wait(change((state) => {
      const created = { ...event, title: event.title.trim(), id: newId('event'), createdBy: demoUser.id }
      state.events.push(created)
      return created
    }))
  },

  async updateEvent(eventId, event) {
    return wait(change((state) => {
      const index = state.events.findIndex((item) => item.id === eventId)
      if (index < 0) fail(404, 'EVENT_NOT_FOUND', 'Este evento não foi encontrado na agenda de vocês.')
      state.events[index] = { ...state.events[index], ...event, title: event.title.trim() }
      return state.events[index]
    }))
  },

  async deleteEvent(eventId) {
    change((state) => {
      state.events = state.events.filter((item) => item.id !== eventId)
    })
    return wait(null)
  },

  async listChallenges() {
    const state = load()
    return wait(
      state.challenges
        .filter((challenge) => !challenge.archivedAt)
        .map((challenge) => toChallenge(state, challenge)),
      120,
    )
  },

  async createChallenge(data) {
    return wait(change((state) => {
      if (state.challenges.filter((item) => !item.archivedAt).length >= MAX_ACTIVE_CHALLENGES) {
        fail(409, 'CHALLENGE_LIMIT_REACHED', `Vocês já têm ${MAX_ACTIVE_CHALLENGES} desafios ativos.`)
      }
      const challenge = {
        id: newId('challenge'),
        title: data.title.trim(),
        category: data.category,
        period: data.period,
        scope: data.scope,
        ownerId: data.scope === 'INDIVIDUAL' ? demoUser.id : null,
        goal: Number(data.goal),
        pointsPerAdvance: pointsPerAdvance[data.scope],
        createdBy: demoUser.id,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      }
      state.challenges.push(challenge)
      return toChallenge(state, challenge)
    }))
  },

  async updateChallenge(challengeId, changes) {
    return wait(change((state) => {
      const challenge = activeChallenge(state, challengeId)
      requireOwner(challenge)
      const current = toChallenge(state, { ...challenge, period: changes.period }).progress
      if (Number(changes.goal) < current) {
        fail(
          409,
          'GOAL_BELOW_PROGRESS',
          `A meta não pode ficar abaixo dos ${current} avanços já registrados neste período.`,
        )
      }
      Object.assign(challenge, {
        title: changes.title.trim(),
        category: changes.category,
        period: changes.period,
        goal: Number(changes.goal),
      })
      return toChallenge(state, challenge)
    }))
  },

  async deleteChallenge(challengeId) {
    change((state) => {
      const challenge = activeChallenge(state, challengeId)
      requireOwner(challenge)
      challenge.archivedAt = new Date().toISOString()
    })
    return wait(null)
  },

  async advanceChallenge(challengeId) {
    return wait(change((state) => {
      const challenge = activeChallenge(state, challengeId)
      requireOwner(challenge)
      if (toChallenge(state, challenge).completed) {
        fail(
          409,
          'CHALLENGE_PERIOD_COMPLETE',
          challenge.period === 'WEEKLY'
            ? 'Esse desafio já foi concluído nesta semana. Ele recomeça na segunda-feira.'
            : 'Esse desafio já foi concluído neste mês. Ele recomeça no dia 1º.',
        )
      }
      const entry = {
        id: newId('progress'),
        challengeId,
        userId: demoUser.id,
        scope: challenge.scope,
        points: challenge.pointsPerAdvance,
        createdAt: new Date().toISOString(),
      }
      state.progress.push(entry)
      return { id: entry.id, points: entry.points, challenge: toChallenge(state, challenge) }
    }))
  },

  async undoChallengeProgress(challengeId, progressId) {
    change((state) => {
      const challenge = activeChallenge(state, challengeId)
      const entry = state.progress.find(
        (item) => item.id === progressId && item.challengeId === challenge.id,
      )
      if (!entry) fail(404, 'PROGRESS_NOT_FOUND', 'Este avanço não foi encontrado.')
      if (new Date(entry.createdAt) < currentPeriod(challenge.period, startOfDay()).start) {
        fail(409, 'PROGRESS_PERIOD_CLOSED', 'Só dá para desfazer avanços do período atual.')
      }
      state.progress = state.progress.filter((item) => item.id !== progressId)
    })
    return wait(null)
  },

  async getScoreboard() {
    const state = load()
    const today = startOfDay()
    const week = currentPeriod('WEEKLY', today)
    const month = currentPeriod('MONTHLY', today)
    return wait(
      {
        week: periodScore(state, week.start, week.next),
        month: periodScore(state, month.start, month.next),
        totals: {
          points:
            state.progress.reduce((sum, entry) => sum + entry.points, 0) +
            state.focusSessions.reduce((sum, session) => sum + session.points, 0),
          advances: state.progress.length,
          focusSessions: state.focusSessions.length,
          dengos: state.dengos.length,
        },
      },
      120,
    )
  },

  async listDengos() {
    const dengos = change((state) => {
      simulatePartner(state)
      return state.dengos
    })
    return wait(
      [...dengos].sort((first, second) => second.createdAt.localeCompare(first.createdAt)).slice(0, 30),
      120,
    )
  },

  async sendDengo(dengo) {
    return wait(change((state) => {
      if (!state.paired) fail(409, 'PARTNER_REQUIRED', 'Seu dengo ainda não entrou na dupla.')
      const created = {
        id: newId('dengo'),
        kind: dengo.kind,
        message: dengo.message.trim(),
        subject: dengo.subject?.trim() || null,
        senderId: demoUser.id,
        response: null,
        respondedAt: null,
        reaction: null,
        createdAt: new Date().toISOString(),
      }
      state.dengos.push(created)
      return created
    }))
  },

  async respondDengo(dengoId, response) {
    return wait(change((state) => {
      const dengo = requireDengo(state, dengoId)
      if (dengo.senderId === demoUser.id) {
        fail(403, 'DENGO_OWN_REQUEST', 'Quem responde esse pedido é o seu dengo.')
      }
      if (dengo.response) fail(409, 'DENGO_ALREADY_ANSWERED', 'Esse dengo já foi respondido.')
      dengo.response = response.trim()
      dengo.respondedAt = new Date().toISOString()
      return dengo
    }))
  },

  async reactToDengo(dengoId, reaction) {
    return wait(change((state) => {
      const dengo = requireDengo(state, dengoId)
      dengo.reaction = reaction
      return dengo
    }))
  },

  async registerFocusSession({ task, minutes }) {
    return wait(change((state) => {
      const session = {
        id: newId('focus'),
        task: task.trim(),
        minutes,
        points: minutes,
        userId: demoUser.id,
        createdAt: new Date().toISOString(),
      }
      state.focusSessions.push(session)
      return session
    }))
  },
}
