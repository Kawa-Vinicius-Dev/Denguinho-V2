export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || ''
}

export function initial(name) {
  const [first = '?'] = Array.from(String(name || '').trim())
  return first.toLocaleUpperCase('pt-BR')
}

export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
