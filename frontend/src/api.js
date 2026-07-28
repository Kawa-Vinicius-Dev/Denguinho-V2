const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const API_HEALTH_URL = API_URL.replace(/\/api\/?$/, '/actuator/health')
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
let apiWarmupStarted = false

export function warmApi() {
  if (isDemoMode || apiWarmupStarted) return
  apiWarmupStarted = true

  void fetch(API_HEALTH_URL, { cache: 'no-store' }).catch(() => {
    // O aquecimento é oportunista; login e cadastro continuam tratando seus próprios erros.
  })
}

const demoUser = {
  id: 'demo-user',
  name: 'Kawã',
  email: 'usuario@exemple.com',
  coupleId: 'demo-couple',
  hasAvatar: false,
}

const demoPartner = {
  id: 'demo-partner',
  name: 'Rilary',
  email: 'usuario2@exemple.com',
  coupleId: 'demo-couple',
  hasAvatar: false,
}

const demoCouple = {
  id: 'demo-couple',
  members: [demoPartner, demoUser],
  currentObjective: 'Planejar, executar e concluir — juntos.',
  relationshipStartedOn: '',
  photoPositionX: 50,
  photoPositionY: 50,
  hasCustomPhoto: false,
  jointProgress: 0,
}

const demoRelationshipKey = 'denguinho-relationship-date-v2'
const demoObjectiveKey = 'denguinho-objective-v1'
const demoPhotoPositionKey = 'denguinho-photo-position-v1'
const demoProfileNameKey = 'denguinho-profile-name-v1'
const demoEventsKey = 'denguinho-couple-events-v2'
let demoAvatarUrl = null
const initialDemoEvents = []

function currentDemoCouple() {
  let photoPosition
  try {
    photoPosition = JSON.parse(localStorage.getItem(demoPhotoPositionKey))
  } catch {
    photoPosition = null
  }
  return {
    ...demoCouple,
    members: [demoPartner, currentDemoUser()],
    currentObjective: localStorage.getItem(demoObjectiveKey) || demoCouple.currentObjective,
    relationshipStartedOn:
      localStorage.getItem(demoRelationshipKey) || demoCouple.relationshipStartedOn,
    photoPositionX: Number.isFinite(photoPosition?.x) ? photoPosition.x : 50,
    photoPositionY: Number.isFinite(photoPosition?.y) ? photoPosition.y : 50,
  }
}

function currentDemoUser() {
  return {
    ...demoUser,
    name: localStorage.getItem(demoProfileNameKey) || demoUser.name,
    hasAvatar: Boolean(demoAvatarUrl),
  }
}

function loadDemoEvents() {
  try {
    const stored = JSON.parse(localStorage.getItem(demoEventsKey))
    return Array.isArray(stored) ? stored : initialDemoEvents
  } catch {
    return initialDemoEvents
  }
}

function saveDemoEvents(events) {
  localStorage.setItem(demoEventsKey, JSON.stringify(events))
}

function wait(value, delay = 280) {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), delay))
}

async function request(path, options = {}) {
  const token = localStorage.getItem('denguinho-token')
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Não foi possível concluir esta ação.')
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  async login(credentials) {
    if (isDemoMode) {
      await wait()
      return {
        token: 'demo-token',
        user: { ...currentDemoUser(), email: credentials.email },
      }
    }
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  async register(data) {
    if (isDemoMode) {
      await wait()
      return {
        token: 'demo-token',
        user: { ...currentDemoUser(), name: data.name, email: data.email, coupleId: null },
      }
    }
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async me() {
    if (isDemoMode) return wait(currentDemoUser(), 120)
    return request('/me')
  },

  async getCouple() {
    if (isDemoMode) return wait(currentDemoCouple(), 120)
    return request('/couples/me')
  },

  async createInvite() {
    if (isDemoMode) {
      return wait({ code: 'DENGO2', expiresAt: new Date(Date.now() + 172800000) })
    }
    return request('/couples/invites', { method: 'POST' })
  },

  async joinCouple(code) {
    if (isDemoMode) return wait(currentDemoCouple())
    return request('/couples/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },

  async updateCouple(
    currentObjective,
    relationshipStartedOn,
    photoPositionX,
    photoPositionY,
  ) {
    if (isDemoMode) {
      localStorage.setItem(demoObjectiveKey, currentObjective)
      if (Number.isFinite(photoPositionX) && Number.isFinite(photoPositionY)) {
        localStorage.setItem(
          demoPhotoPositionKey,
          JSON.stringify({ x: photoPositionX, y: photoPositionY }),
        )
      }
      if (relationshipStartedOn) {
        localStorage.setItem(demoRelationshipKey, relationshipStartedOn)
      } else {
        localStorage.removeItem(demoRelationshipKey)
      }
      return wait({ ...currentDemoCouple(), currentObjective, relationshipStartedOn })
    }
    return request('/couples/me', {
      method: 'PATCH',
      body: JSON.stringify({
        currentObjective,
        relationshipStartedOn,
        photoPositionX,
        photoPositionY,
      }),
    })
  },

  async uploadPhoto(file) {
    if (isDemoMode) return wait({ ...currentDemoCouple(), hasCustomPhoto: true })
    const body = new FormData()
    body.append('photo', file)
    return request('/couples/me/photo', { method: 'PUT', body })
  },

  async removePhoto() {
    if (isDemoMode) return wait({ ...currentDemoCouple(), hasCustomPhoto: false })
    return request('/couples/me/photo', { method: 'DELETE' })
  },

  async getPhotoUrl() {
    if (isDemoMode) return '/couple-photo-local.png'
    const token = localStorage.getItem('denguinho-token')
    const response = await fetch(`${API_URL}/couples/me/photo`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  },

  async getAvatarUrl() {
    if (isDemoMode) return demoAvatarUrl
    const token = localStorage.getItem('denguinho-token')
    const response = await fetch(`${API_URL}/me/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  },

  async updateProfile(name) {
    if (isDemoMode) {
      localStorage.setItem(demoProfileNameKey, name)
      return wait({ ...currentDemoUser(), name })
    }
    return request('/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
  },

  async changePassword(passwords) {
    if (isDemoMode) return wait(null)
    return request('/me/password', {
      method: 'PATCH',
      body: JSON.stringify(passwords),
    })
  },

  async requestPasswordRecovery(email) {
    if (isDemoMode) return wait(null)
    return request('/auth/password-recovery', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async uploadAvatar(file) {
    if (isDemoMode) {
      if (demoAvatarUrl) URL.revokeObjectURL(demoAvatarUrl)
      demoAvatarUrl = URL.createObjectURL(file)
      return wait({ ...currentDemoUser(), hasAvatar: true })
    }
    const body = new FormData()
    body.append('avatar', file)
    return request('/me/avatar', { method: 'PUT', body })
  },

  async removeAvatar() {
    if (isDemoMode) {
      if (demoAvatarUrl) URL.revokeObjectURL(demoAvatarUrl)
      demoAvatarUrl = null
      return wait({ ...currentDemoUser(), hasAvatar: false })
    }
    return request('/me/avatar', { method: 'DELETE' })
  },

  async listEvents() {
    if (isDemoMode) return wait(loadDemoEvents(), 120)
    return request('/couples/me/events')
  },

  async createEvent(event) {
    if (isDemoMode) {
      const created = {
        ...event,
        id: `event-${Date.now()}`,
        createdBy: demoUser.id,
      }
      saveDemoEvents([...loadDemoEvents(), created])
      return wait(created)
    }
    return request('/couples/me/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  },

  async updateEvent(eventId, event) {
    if (isDemoMode) {
      const updated = {
        ...loadDemoEvents().find((item) => item.id === eventId),
        ...event,
        id: eventId,
      }
      saveDemoEvents(
        loadDemoEvents().map((item) =>
          item.id === eventId ? { ...item, ...updated } : item,
        ),
      )
      return wait(updated)
    }
    return request(`/couples/me/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(event),
    })
  },

  async deleteEvent(eventId) {
    if (isDemoMode) {
      saveDemoEvents(loadDemoEvents().filter((event) => event.id !== eventId))
      return wait(null)
    }
    return request(`/couples/me/events/${eventId}`, { method: 'DELETE' })
  },
}
