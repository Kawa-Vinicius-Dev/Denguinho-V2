// localStorage pode estar indisponível (modo privado, cota cheia, bloqueio do
// navegador). O app segue funcionando; só não lembra da preferência.
export function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : JSON.parse(stored)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ver comentário acima.
  }
}

export function readText(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeText(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Ver comentário acima.
  }
}
