import { COLUMNS } from './crm'

export function stageOf(lead) {
  return lead.column ?? lead.stage
}

export function asReportLeads(leads = []) {
  return leads.map((lead) => ({ ...lead, stage: lead.stage ?? lead.column }))
}

export function formatBrl(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value ?? 0)
}

export function pipelineEstimate(leads = []) {
  let open = 0
  let won = 0
  let priced = 0
  const byStage = Object.fromEntries(COLUMNS.map((column) => [column.id, 0]))
  for (const lead of leads) {
    if (typeof lead.value !== 'number') continue
    priced += 1
    const stage = stageOf(lead)
    if (byStage[stage] !== undefined) byStage[stage] += lead.value
    if (stage === 'fechados') won += lead.value
    else open += lead.value
  }
  return { open, won, priced, byStage }
}

export function averageResponseMinutes(conversations = []) {
  const gaps = []
  for (const conversation of conversations) {
    const messages = [...(conversation.messages ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    for (let index = 0; index < messages.length - 1; index += 1) {
      const current = messages[index]
      const next = messages[index + 1]
      if (current.role !== 'cliente' || next.role === 'cliente') continue
      const gap = (Date.parse(next.at) - Date.parse(current.at)) / 60000
      if (Number.isFinite(gap) && gap >= 0) gaps.push(gap)
    }
  }
  if (gaps.length === 0) return null
  return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)
}

export function conversionByChannel(leads = []) {
  const grouped = new Map()
  for (const lead of leads) {
    if (!lead.channel) continue
    const row = grouped.get(lead.channel) ?? { channel: lead.channel, total: 0, won: 0 }
    row.total += 1
    if (stageOf(lead) === 'fechados') row.won += 1
    grouped.set(lead.channel, row)
  }
  return [...grouped.values()].sort((a, b) => a.channel.localeCompare(b.channel, 'pt-BR'))
}

export function followUpTasks(leads = [], appointments = []) {
  const booked = new Set(appointments.filter((item) => item.status === 'scheduled').map((item) => item.lead_id))
  return leads
    .filter((lead) => stageOf(lead) === 'qualificados' && !booked.has(lead.id))
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      detail: `Retomar ${lead.procedure || 'o interesse'}`,
    }))
}

export function clinicDateKey(instant = new Date(), timeZone = 'America/Sao_Paulo') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

export function appointmentsOnDate(appointments = [], dateKey = clinicDateKey()) {
  return appointments.filter((item) => clinicDateKey(new Date(item.starts_at)) === dateKey)
}

export function pendingThreads(threads = []) {
  return threads.filter((thread) => thread.waiting)
}

export function formatResponse(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function metricsRows({ leads = [], appointments = [], stageCounts = {}, responseMinutes = null }) {
  const estimate = pipelineEstimate(leads)
  const rows = [
    ['indicador', 'valor'],
    ['leads', String(leads.length)],
    ['receita_estimada_pipeline', String(estimate.open)],
    ['convertidos_na_amostra_ou_clinica', String(estimate.won)],
    ['tempo_medio_resposta_min', responseMinutes == null ? '' : String(responseMinutes)],
  ]
  for (const column of COLUMNS) {
    rows.push([`etapa_${column.id}`, String(stageCounts[column.id] ?? 0)])
    rows.push([`valor_${column.id}`, String(estimate.byStage[column.id] ?? 0)])
  }
  rows.push(['agendamentos', String(appointments.length)])
  for (const row of conversionByChannel(leads)) {
    rows.push([`canal_${row.channel}`, `${row.won}/${row.total}`])
  }
  return rows
}

export function csvFromRows(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '')
          return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
        })
        .join(','),
    )
    .join('\n')
}
