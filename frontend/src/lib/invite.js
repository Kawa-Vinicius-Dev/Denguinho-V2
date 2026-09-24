const inviteCodePattern = /^[A-Z0-9]{6}$/

export function normalizeInviteCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function isValidInviteCode(value) {
  return inviteCodePattern.test(value || '')
}

export function readInviteCodeFromUrl(search = window.location.search) {
  const code = normalizeInviteCode(new URLSearchParams(search).get('invite'))
  return isValidInviteCode(code) ? code : ''
}

export function clearInviteCodeFromUrl() {
  const currentUrl = new URL(window.location.href)
  if (!currentUrl.searchParams.has('invite')) return
  currentUrl.searchParams.delete('invite')
  window.history.replaceState({}, '', currentUrl)
}

export function createInviteLink(code, origin = window.location.origin) {
  const inviteUrl = new URL('/', origin)
  inviteUrl.searchParams.set('invite', code)
  return inviteUrl.toString()
}

export function createInviteMessage(code, origin) {
  return [
    'Entra comigo no Denguinho? 💛',
    '',
    'Criei nosso cantinho para compartilhar planos, conquistas e muito dengo.',
    '',
    `Use o código ${code} ou abra este link:`,
    createInviteLink(code, origin),
  ].join('\n')
}

export function createWhatsAppInviteLink(code, origin) {
  return `https://wa.me/?text=${encodeURIComponent(createInviteMessage(code, origin))}`
}
