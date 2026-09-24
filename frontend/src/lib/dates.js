const DAY_MS = 86_400_000

export function parseLocalDate(value) {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfDay(date = new Date()) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

export function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Mantém o dia do mês quando ele existe e usa o último dia quando não existe:
// 31/08 + 1 mês = 30/09, e 29/02 + 12 meses = 28/02 do ano seguinte.
export function addMonthsClamped(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())))
  return target
}

function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
}

// Diferença em dias de calendário, imune a horário de verão.
export function daysBetween(from, to) {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((utcTo - utcFrom) / DAY_MS)
}

export function nextOccurrence(event, today = startOfDay()) {
  const first = parseLocalDate(event.eventDate)
  if (!first || event.recurrence === 'NONE' || first >= today) return first
  const step = event.recurrence === 'YEARLY' ? 12 : 1
  let offset = Math.floor(monthsBetween(first, today) / step) * step
  let candidate = addMonthsClamped(first, offset)
  while (candidate < today) {
    offset += step
    candidate = addMonthsClamped(first, offset)
  }
  return candidate
}

export function isPastEvent(event, today = startOfDay()) {
  const date = parseLocalDate(event.eventDate)
  return event.recurrence === 'NONE' && Boolean(date) && date < today
}

export function upcomingEvents(events, today = startOfDay()) {
  return events
    .filter((event) => !isPastEvent(event, today))
    .map((event) => ({ event, date: nextOccurrence(event, today) }))
    .sort((first, second) => first.date - second.date)
}

export function pastEvents(events, today = startOfDay()) {
  return events
    .filter((event) => isPastEvent(event, today))
    .map((event) => ({ event, date: parseLocalDate(event.eventDate) }))
    .sort((first, second) => second.date - first.date)
}

// Próximo "mêsversário": o primeiro dia, a partir de hoje, que completa um número
// inteiro de meses desde o início do namoro.
export function nextMonthiversary(startedOn, today = startOfDay()) {
  const start = parseLocalDate(startedOn)
  if (!start) return null
  let months = Math.max(1, monthsBetween(start, today))
  let date = addMonthsClamped(start, months)
  if (date < today) {
    months += 1
    date = addMonthsClamped(start, months)
  }
  return { date, months, days: daysBetween(today, date) }
}

export function relationshipDuration(startedOn, today = startOfDay()) {
  const start = parseLocalDate(startedOn)
  if (!start || start > today) return null
  let totalMonths = monthsBetween(start, today)
  if (addMonthsClamped(start, totalMonths) > today) totalMonths -= 1
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: daysBetween(addMonthsClamped(start, totalMonths), today),
    totalMonths,
    totalDays: daysBetween(start, today),
  }
}

function joinParts(parts) {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`
}

export function formatDuration(duration, { withDays = true } = {}) {
  if (!duration) return ''
  const parts = []
  if (duration.years) parts.push(`${duration.years} ${duration.years === 1 ? 'ano' : 'anos'}`)
  if (duration.months) parts.push(`${duration.months} ${duration.months === 1 ? 'mês' : 'meses'}`)
  if ((withDays || !parts.length) && duration.days) {
    parts.push(`${duration.days} ${duration.days === 1 ? 'dia' : 'dias'}`)
  }
  return parts.length ? joinParts(parts) : 'hoje'
}

export function greetingFor(date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatLongDate(date) {
  return capitalize(
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )
}

export function formatFullDate(date) {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDate(date) {
  return date
    .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    .replace('.', '')
    .replace(' de ', ' ')
}

export function formatMonthName(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long' })
}

export function formatWeekday(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long' })
}

export function formatPeriodRange(startsOn, endsOn) {
  const start = parseLocalDate(startsOn)
  const end = parseLocalDate(endsOn)
  if (!start || !end) return ''
  if (start.getDate() === 1 && daysBetween(start, end) >= 27) {
    return capitalize(formatMonthName(start))
  }
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} a ${formatShortDate(end)}`
  }
  return `${formatShortDate(start)} a ${formatShortDate(end)}`
}

export function relativeDays(days) {
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days === -1) return 'ontem'
  if (days > 1) return `em ${days} dias`
  return `há ${-days} dias`
}

export function formatRelativeTime(value, now = new Date()) {
  const date = new Date(value)
  const seconds = Math.round((now - date) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24 && daysBetween(date, now) === 0) return `há ${hours} h`
  const days = daysBetween(date, now)
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  return formatShortDate(date)
}

// Semanas de segunda a domingo, como no placar e nos desafios semanais.
export function monthWeekInfo(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  return {
    current: Math.ceil((offset + date.getDate()) / 7),
    total: Math.ceil((offset + daysInMonth(year, month)) / 7),
    month: formatMonthName(date),
  }
}

export function weekStart(date) {
  const start = startOfDay(date)
  return addDays(start, -((start.getDay() + 6) % 7))
}

export function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function formatClock(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`
}
