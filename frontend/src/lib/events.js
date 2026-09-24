export const recurrenceOptions = [
  ['NONE', 'Não repete'],
  ['MONTHLY', 'Todo mês'],
  ['YEARLY', 'Todo ano'],
]

export function recurrenceLabel(recurrence) {
  return recurrenceOptions.find(([value]) => value === recurrence)?.[1] || 'Não repete'
}
