import { isDemoMode } from './client.js'
import { demoApi } from './demo.js'
import { httpApi } from './http.js'

export { ApiError, SESSION_EXPIRED_EVENT, isDemoMode, session, warmApi } from './client.js'

export const api = isDemoMode ? demoApi : httpApi
