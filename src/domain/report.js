import { averageAssumptionMinutes, clinicDateKey, qualifiedRate } from './insights'
import { shiftDateKey, startOfWeekKey, visitDateKey } from './visits'

export const LEAD_SOURCES = [
  { id: 'zap', label: 'ZAP' },
  { id: 'olx', label: 'OLX' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'site', label: 'Site' },
]


export function mergeLeadsForReport(leads = [], profiles = []) {
  if (!profiles.length) return leads
  const byId = new Map(leads.map((lead) => [lead.id, lead]))
  return profiles.map((profile) => {
    const base = byId.get(profile.id) || {}
    return {
      ...base,
      ...profile,
      column: profile.column ?? base.column,
      messages: (base.messages?.length ? base.messages : profile.messages) ?? [],
    }
  })
}

export function sourceLabel(id) {
  return LEAD_SOURCES.find((item) => item.id === id)?.label ?? 'Sem origem'
}

export function leadCreatedKey(lead) {
  const value = lead.createdAt || lead.created_at
  if (!value) return null
  return clinicDateKey(new Date(value))
}

export function inWeek(dateKey, weekStart) {
  if (!dateKey || !weekStart) return false
  return dateKey >= weekStart && dateKey <= shiftDateKey(weekStart, 6)
}

export function leadsInWeek(leads = [], weekStart) {
  return leads.filter((lead) => inWeek(leadCreatedKey(lead), weekStart))
}

export function visitsInWeek(visits = [], weekStart) {
  return visits.filter((visit) => inWeek(visitDateKey(visit), weekStart))
}

export function visitBuckets(visits = []) {
  let agendadas = 0
  let feitas = 0
  let noShow = 0
  for (const visit of visits) {
    if (visit.status === 'feita' || visit.status === 'attended') feitas += 1
    else if (visit.status === 'no_show') noShow += 1
    else if (visit.status === 'agendada' || visit.status === 'confirmada' || visit.status === 'scheduled') agendadas += 1
  }
  return { agendadas, feitas, noShow }
}

export function trendOf(current, previous, { kind = 'count' } = {}) {
  if (current == null && previous == null) return { label: '—', dir: 'flat' }
  const left = current ?? 0
  const right = previous ?? 0
  if (right === 0 && left === 0) return { label: '—', dir: 'flat' }
  if (right === 0) return { label: '—', dir: 'flat' }
  if (kind === 'points') {
    const delta = Math.round(left - right)
    return { label: `${delta > 0 ? '+' : ''}${delta} pp`, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' }
  }
  const pct = Math.round(((left - right) / right) * 100)
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

export function weekSummary(leads = [], visits = []) {
  const volume = leads.length
  const qualified = qualifiedRate(leads)
  const assumption = averageAssumptionMinutes(leads)
  return { volume, qualified, assumption, visits: visitBuckets(visits) }
}

export function bySource(leads = []) {
  return LEAD_SOURCES.map((source) => {
    const items = leads.filter((lead) => lead.source === source.id)
    return { id: source.id, label: source.label, leads: items.length, qualified: qualifiedRate(items) }
  })
}

export function byBroker(leads = [], visits = [], brokers = []) {
  const names = new Map(brokers.map((broker) => [broker.id, broker.name]))
  const ids = [...new Set([
    ...brokers.map((broker) => broker.id),
    ...leads.map((lead) => lead.brokerId).filter(Boolean),
    ...visits.map((visit) => visit.brokerId).filter(Boolean),
  ])]
  return ids
    .map((id) => {
      const group = leads.filter((lead) => lead.brokerId === id)
      const groupVisits = visits.filter((visit) => visit.brokerId === id)
      return {
        id,
        name: names.get(id) || group[0]?.broker || id,
        leads: group.length,
        assumption: averageAssumptionMinutes(group),
        visits: visitBuckets(groupVisits),
      }
    })
    .sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name, 'pt-BR'))
}

export function weeklyReport({ leads = [], visits = [], brokers = [], weekStart }) {
  const start = weekStart || startOfWeekKey(clinicDateKey())
  const previousStart = shiftDateKey(start, -7)
  const currentLeads = leadsInWeek(leads, start)
  const previousLeads = leadsInWeek(leads, previousStart)
  const currentVisits = visitsInWeek(visits, start)
  const previousVisits = visitsInWeek(visits, previousStart)
  const current = weekSummary(currentLeads, currentVisits)
  const previous = weekSummary(previousLeads, previousVisits)
  return {
    weekStart: start,
    previousStart,
    current,
    previous,
    trends: {
      volume: trendOf(current.volume, previous.volume),
      qualified: trendOf(current.qualified, previous.qualified, { kind: 'points' }),
      assumption: trendOf(current.assumption, previous.assumption),
      agendadas: trendOf(current.visits.agendadas, previous.visits.agendadas),
      feitas: trendOf(current.visits.feitas, previous.visits.feitas),
      noShow: trendOf(current.visits.noShow, previous.visits.noShow),
    },
    bySource: bySource(currentLeads),
    byBroker: byBroker(currentLeads, currentVisits, brokers),
  }
}
