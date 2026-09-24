import { request } from './client.js'

async function objectUrl(path) {
  try {
    return URL.createObjectURL(await request(path, { responseType: 'blob' }))
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

function photoForm(field, file) {
  const body = new FormData()
  body.append(field, file)
  return body
}

export const httpApi = {
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: credentials, auth: false }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: data, auth: false }),

  me: () => request('/me'),
  updateProfile: (name) => request('/me', { method: 'PATCH', body: { name } }),
  changePassword: (passwords) => request('/me/password', { method: 'PATCH', body: passwords }),
  uploadAvatar: (file) => request('/me/avatar', { method: 'PUT', body: photoForm('avatar', file) }),
  removeAvatar: () => request('/me/avatar', { method: 'DELETE' }),
  getAvatarUrl: () => objectUrl('/me/avatar'),

  getCouple: () => request('/couples/me'),
  createInvite: () => request('/couples/invites', { method: 'POST' }),
  joinCouple: (code) => request('/couples/join', { method: 'POST', body: { code } }),
  updateCouple: (changes) => request('/couples/me', { method: 'PATCH', body: changes }),
  uploadPhoto: (file) =>
    request('/couples/me/photo', { method: 'PUT', body: photoForm('photo', file) }),
  removePhoto: () => request('/couples/me/photo', { method: 'DELETE' }),
  getPhotoUrl: () => objectUrl('/couples/me/photo'),

  listEvents: () => request('/couples/me/events'),
  createEvent: (event) => request('/couples/me/events', { method: 'POST', body: event }),
  updateEvent: (eventId, event) =>
    request(`/couples/me/events/${eventId}`, { method: 'PATCH', body: event }),
  deleteEvent: (eventId) => request(`/couples/me/events/${eventId}`, { method: 'DELETE' }),

  listChallenges: () => request('/couples/me/challenges'),
  createChallenge: (challenge) =>
    request('/couples/me/challenges', { method: 'POST', body: challenge }),
  updateChallenge: (challengeId, changes) =>
    request(`/couples/me/challenges/${challengeId}`, { method: 'PATCH', body: changes }),
  deleteChallenge: (challengeId) =>
    request(`/couples/me/challenges/${challengeId}`, { method: 'DELETE' }),
  advanceChallenge: (challengeId) =>
    request(`/couples/me/challenges/${challengeId}/progress`, { method: 'POST' }),
  undoChallengeProgress: (challengeId, progressId) =>
    request(`/couples/me/challenges/${challengeId}/progress/${progressId}`, { method: 'DELETE' }),

  getScoreboard: () => request('/couples/me/scoreboard'),

  listDengos: () => request('/couples/me/dengos'),
  sendDengo: (dengo) => request('/couples/me/dengos', { method: 'POST', body: dengo }),
  respondDengo: (dengoId, response) =>
    request(`/couples/me/dengos/${dengoId}/response`, { method: 'PUT', body: { response } }),
  reactToDengo: (dengoId, reaction) =>
    request(`/couples/me/dengos/${dengoId}/reaction`, { method: 'PUT', body: { reaction } }),

  registerFocusSession: (focusSession) =>
    request('/couples/me/focus-sessions', { method: 'POST', body: focusSession }),
}
