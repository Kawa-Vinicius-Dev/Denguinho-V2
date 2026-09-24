import { readText, writeText } from '../lib/storage.js'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const API_HEALTH_URL = API_URL.replace(/\/api\/?$/, '/actuator/health')
const REQUEST_TIMEOUT_MS = 30_000
const TOKEN_KEY = 'denguinho-token'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
export const SESSION_EXPIRED_EVENT = 'denguinho:session-expired'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', fields = {} } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isNetworkError() {
    return this.status === 0
  }
}

export const session = {
  token: () => readText(TOKEN_KEY),
  save: (token) => writeText(TOKEN_KEY, token),
  clear: () => writeText(TOKEN_KEY, null),
}

let warmupStarted = false

// O backend dorme quando fica parado; acordá-lo cedo encurta o primeiro login.
export function warmApi() {
  if (isDemoMode || warmupStarted) return
  warmupStarted = true
  void fetch(API_HEALTH_URL, { cache: 'no-store' }).catch(() => {
    // O aquecimento é oportunista; as chamadas reais tratam seus próprios erros.
  })
}

function fallbackMessage(status) {
  if (status >= 500) return 'O servidor teve um problema. Tente de novo em instantes.'
  if (status === 404) return 'Não encontramos o que você procurava.'
  if (status === 403) return 'Você não tem permissão para fazer isso.'
  return 'Não foi possível concluir esta ação.'
}

export async function request(path, { method = 'GET', body, auth = true, responseType = 'json' } = {}) {
  const token = auth ? session.token() : null
  const headers = new Headers()
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined || isForm ? body : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    throw new ApiError(
      error?.name === 'AbortError'
        ? 'O servidor demorou para responder. Tente de novo em instantes.'
        : 'Não foi possível falar com o servidor. Confira sua conexão e tente de novo.',
      { code: 'NETWORK_ERROR' },
    )
  } finally {
    window.clearTimeout(timeout)
  }

  if (response.status === 401 && token) {
    session.clear()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw new ApiError('Sua sessão expirou. Entre de novo para continuar.', {
      status: 401,
      code: 'SESSION_EXPIRED',
    })
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.message || fallbackMessage(response.status), {
      status: response.status,
      code: data.code || 'HTTP_ERROR',
      fields: data.fields || {},
    })
  }
  if (response.status === 204) return null
  if (responseType === 'blob') return response.blob()
  return response.json()
}
