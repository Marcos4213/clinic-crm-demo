const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export const QUALIFICATION_FIELDS = [
  { key: 'dealType', label: 'Compra ou aluguel' },
  { key: 'region', label: 'Região' },
  { key: 'budget', label: 'Faixa' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'deadline', label: 'Prazo' },
]

export function formatSheetTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return TIME.format(date)
}

export function formatSheetDate(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return DATE.format(date)
}

export function messageActor(message) {
  if (message.role === 'ia' || message.author_role === 'ia') return 'Helena'
  if (message.role === 'humano' || message.author_role === 'humano') return message.actor || 'Você'
  return message.actor || message.name || 'Lead'
}

export function eventTitle(event) {
  switch (event.type) {
    case 'message':
      return event.actor ? `${event.actor}` : 'Mensagem'
    case 'temperature':
      return 'Temperatura'
    case 'assumed':
      return 'Assunção'
    case 'assigned':
      return 'Corretor'
    case 'visit':
      return 'Visita'
    case 'qualification':
      return 'Qualificação'
    case 'note':
      return 'Nota'
    case 'returned':
      return 'Helena'
    default:
      return 'Evento'
  }
}

export function buildTimeline({ messages = [], events = [], notes = [], visits = [] } = {}) {
  const items = []

  for (const message of messages) {
    items.push({
      id: message.id || `msg-${items.length}`,
      at: message.at || message.created_at,
      type: 'message',
      actor: messageActor(message),
      detail: message.text || message.body || '',
    })
  }

  for (const event of events) {
    items.push({
      id: event.id,
      at: event.at || event.created_at,
      type: event.type || event.event_type,
      actor: event.actor || '',
      detail: event.detail || '',
    })
  }

  for (const note of notes) {
    items.push({
      id: `note-${note.id}`,
      at: note.at || note.created_at,
      type: 'note',
      actor: note.author || note.author_name || '',
      detail: note.body,
    })
  }

  for (const visit of visits) {
    items.push({
      id: visit.id,
      at: visit.at || visit.starts_at,
      type: 'visit',
      actor: visit.broker || visit.actor || '',
      detail: visit.detail || visit.property || '',
    })
  }

  return items
    .filter((item) => item.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export function appBase(pathname = '') {
  return pathname.startsWith('/app') ? '/app' : '/demo'
}

export function leadIdFromThread(thread) {
  return thread?.leadId || (thread?.id?.startsWith('wa-') ? thread.id.slice(3) : thread?.id) || null
}
