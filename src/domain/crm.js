export const COLUMNS = [
  { id: 'em-atendimento', label: 'Em Atendimento (IA)' },
  { id: 'qualificados', label: 'Qualificados' },
  { id: 'agendados', label: 'Agendados' },
  { id: 'fechados', label: 'Fechados' },
]

export const TEMPERATURES = [
  { id: 'todos', label: 'Todos' },
  { id: 'quente', label: 'Quente' },
  { id: 'morno', label: 'Morno' },
  { id: 'frio', label: 'Frio' },
]

const TEMPERATURE_LABEL = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
}

export function temperatureLabel(temperature) {
  return TEMPERATURE_LABEL[temperature] ?? temperature
}

export function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function filterLeads(leads, { query = '', temperature = 'todos' } = {}) {
  const needle = normalize(query)
  return leads.filter((lead) => {
    const temperatureOk = !temperature || temperature === 'todos' || lead.temperature === temperature
    if (!temperatureOk) return false
    if (!needle) return true
    return [lead.name, lead.phone, lead.procedure].some((field) => normalize(field).includes(needle))
  })
}

export function countByColumn(leads) {
  const counts = Object.fromEntries(COLUMNS.map((column) => [column.id, 0]))
  for (const lead of leads) {
    if (counts[lead.column] !== undefined) counts[lead.column] += 1
  }
  return counts
}

export function stageCountLabel(count) {
  if (count === 1) return '1 lead nesta etapa'
  return `${count} leads nesta etapa`
}

export function moveLead(leads, leadId, columnId) {
  if (!COLUMNS.some((column) => column.id === columnId)) {
    throw new Error(`Etapa desconhecida: ${columnId}`)
  }
  const current = leads.find((lead) => lead.id === leadId)
  if (!current) throw new Error(`Lead desconhecido: ${leadId}`)
  if (current.column === columnId) return leads
  return leads.map((lead) => (lead.id === leadId ? { ...lead, column: columnId } : lead))
}

export function setAiActive(leads, leadId, aiActive) {
  const current = leads.find((lead) => lead.id === leadId)
  if (!current) throw new Error(`Lead desconhecido: ${leadId}`)
  if (current.aiActive === aiActive) return leads
  return leads.map((lead) => (lead.id === leadId ? { ...lead, aiActive } : lead))
}

export function sendHumanMessage(leads, leadId, text, { id, at }) {
  const trimmed = text.trim()
  if (!trimmed) return leads
  const current = leads.find((lead) => lead.id === leadId)
  if (!current) throw new Error(`Lead desconhecido: ${leadId}`)
  const message = {
    id,
    role: 'humano',
    text: trimmed,
    at,
    receipt: 'delivered',
    localDemo: true,
  }
  return leads.map((lead) =>
    lead.id === leadId ? { ...lead, messages: [...lead.messages, message] } : lead,
  )
}

export function formatStamp(iso) {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return `${day} · ${time}`
}

export function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toLocaleUpperCase('pt-BR')
}

export function columnLabel(columnId) {
  return COLUMNS.find((column) => column.id === columnId)?.label ?? columnId
}
