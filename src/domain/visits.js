import { clinicDateKey } from './insights'
import { zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'

export const VISIT_STATUSES = [
  { id: 'agendada', label: 'Agendada' },
  { id: 'confirmada', label: 'Confirmada' },
  { id: 'feita', label: 'Visita feita' },
  { id: 'no_show', label: 'No-show' },
]

export const ACTIVE_VISIT_STATUSES = ['agendada', 'confirmada', 'scheduled']

export function visitStatusLabel(status) {
  if (status === 'feita' || status === 'attended') return 'Visita feita'
  if (status === 'no_show') return 'No-show'
  if (status === 'confirmada') return 'Confirmada'
  if (status === 'agendada' || status === 'scheduled') return 'Agendada'
  if (status === 'canceled') return 'Cancelada'
  return 'Visita'
}

export function startOfWeekKey(dateKey, timeZone = 'America/Sao_Paulo') {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 15))
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const offset = map[weekday] ?? 0
  const start = new Date(date.getTime() - offset * 24 * 60 * 60 * 1000)
  return clinicDateKey(start, timeZone)
}

export function shiftDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 15))
  return clinicDateKey(date)
}

export function weekDateKeys(dateKey) {
  const start = startOfWeekKey(dateKey)
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(start, index))
}

export function visitDateKey(visit) {
  return clinicDateKey(new Date(visit.startsAt || visit.starts_at))
}

export function visitsOnDate(visits = [], dateKey = clinicDateKey(), brokerId) {
  return visits
    .filter((item) => visitDateKey(item) === dateKey)
    .filter((item) => !brokerId || item.brokerId === brokerId || item.broker_id === brokerId)
    .slice()
    .sort((a, b) => new Date(a.startsAt || a.starts_at) - new Date(b.startsAt || b.starts_at))
}

export function hasVisitConflict(visits, { brokerId, startsAt, endsAt, ignoreId } = {}) {
  if (!brokerId || !startsAt || !endsAt) return false
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()
  return visits.some((item) => {
    if (ignoreId && item.id === ignoreId) return false
    const itemBroker = item.brokerId || item.broker_id
    if (itemBroker !== brokerId) return false
    if (!ACTIVE_VISIT_STATUSES.includes(item.status)) return false
    const itemStart = new Date(item.startsAt || item.starts_at).getTime()
    const itemEnd = new Date(item.endsAt || item.ends_at).getTime()
    return itemStart < end && itemEnd > start
  })
}

export function buildVisit({ leadId, propertyId, brokerId, date, time, slotMinutes = 30, id }) {
  const startsAt = zonedLocalToUtc(date, time)
  if (!startsAt) return { error: 'invalid' }
  const endsAt = new Date(startsAt.getTime() + slotMinutes * 60 * 1000)
  return {
    visit: {
      id,
      leadId,
      propertyId: propertyId || null,
      brokerId: brokerId || null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'agendada',
      reminderStatus: 'pendente_envio',
    },
  }
}

export const DAY_HOURS = Array.from({ length: 12 }, (_, index) => 8 + index)

export function visitHour(visit, timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(visit.startsAt || visit.starts_at))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour + minute / 60
}

export function formatVisitDay(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 15))
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(date).replace('.', '')
  const number = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(date)
  return `${weekday} ${number}`
}

export function formatVisitHeading(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 15))
  const text = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
