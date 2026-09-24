export const surpriseIdeas = [
  ['Encontro sem pressa', 'Escolham um lugar simples, guardem os celulares e curtam uma hora só de vocês.'],
  ['Cozinha a quatro mãos', 'Escolham uma receita que nenhum dos dois fez ainda e preparem juntos.'],
  ['Carta para o futuro', 'Cada um escreve uma carta para o casal abrir daqui a um ano.'],
  ['Passeio sem destino', 'Saiam a pé ou de carro e deixem a curiosidade decidir o caminho.'],
  ['Noite de fotos antigas', 'Revejam fotos do começo de vocês e contem o que lembram de cada uma.'],
  ['Piquenique improvisado', 'Montem uma cesta com o que tiver em casa e procurem um cantinho ao ar livre.'],
  ['Playlist do casal', 'Cada um escolhe cinco músicas que lembram o outro e vocês ouvem juntos.'],
  ['Aula de algo novo', 'Aprendam juntos algo que nenhum dos dois sabe: uma dança, um jogo, um prato.'],
  ['Pôr do sol marcado', 'Descubram onde dá para ver o pôr do sol perto de vocês e cheguem cedo.'],
  ['Dia do sim', 'Por algumas horas, um propõe e o outro topa — dentro do combinado, claro.'],
  ['Cinema em casa', 'Escolham um filme que marcou a infância de um de vocês e façam pipoca.'],
  ['Retrospectiva a dois', 'Listem juntos as três melhores lembranças deste ano.'],
]

export function surpriseForMonth(date) {
  const index = (date.getFullYear() * 12 + date.getMonth()) % surpriseIdeas.length
  const [title, description] = surpriseIdeas[index]
  return { title, description }
}

export const kindReminders = [
  'Descansar também ajuda vocês a chegar mais longe.',
  'Um avanço pequeno ainda é um avanço.',
  'Comemorem o que deu certo antes de olhar o que falta.',
  'Não é sobre correr na mesma velocidade, é sobre ninguém caminhar sozinho.',
  'Um elogio sincero hoje vale mais que uma meta batida.',
  'Recomeçar faz parte. Sem culpa.',
  'Pausa para água, alongamento e um cheiro no dengo.',
]

export function kindReminderFor(date) {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return kindReminders[dayIndex % kindReminders.length]
}
