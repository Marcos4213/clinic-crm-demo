export const CLINIC_TIME_ZONE = 'America/Sao_Paulo'

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

export function hasScheduledConflict(appointments, start, end, ignoreId = null) {
  return appointments.some(
    (item) =>
      item.status === 'scheduled' &&
      item.id !== ignoreId &&
      overlaps(start, end, new Date(item.starts_at), new Date(item.ends_at)),
  )
}

export function zonedLocalToUtc(date, time, timeZone = CLINIC_TIME_ZONE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '')
  const clock = /^(\d{2}):(\d{2})$/.exec(time ?? '')
  if (!match || !clock) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(clock[1])
  const minute = Number(clock[2])
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null

  let utc = Date.UTC(year, month - 1, day, hour, minute)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(utc)).map((part) => [part.type, part.value]))
    const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute))
    const desired = Date.UTC(year, month - 1, day, hour, minute)
    const delta = desired - asUtc
    if (delta === 0) return new Date(utc)
    utc += delta
  }
  return new Date(utc)
}

export function formatInClinicZone(instant, timeZone = CLINIC_TIME_ZONE) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant)
}

function timeToMinutes(value) {
  const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function openSlots({ date, dayStart = '09:00', dayEnd = '18:00', slotMinutes = 30, appointments = [], now = new Date() }) {
  const startMinutes = timeToMinutes(dayStart)
  const endMinutes = timeToMinutes(dayEnd)
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) return []
  if (![30, 60].includes(slotMinutes)) return []
  const slots = []
  for (let cursor = startMinutes; cursor + slotMinutes <= endMinutes; cursor += slotMinutes) {
    const startClock = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
    const endTotal = cursor + slotMinutes
    const endClock = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`
    const startsAt = zonedLocalToUtc(date, startClock)
    const endsAt = zonedLocalToUtc(date, endClock)
    if (!startsAt || !endsAt || endsAt <= startsAt) continue
    if (startsAt <= now) continue
    if (hasScheduledConflict(appointments, startsAt, endsAt)) continue
    slots.push({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
  }
  return slots
}

export function reportFromWorkspace({ leads = [], appointments = [], stageEvents = [] }) {
  const stages = ['em-atendimento', 'qualificados', 'agendados', 'fechados']
  const stageCounts = Object.fromEntries(stages.map((stage) => [stage, 0]))
  const temperatureCounts = { quente: 0, morno: 0, frio: 0 }
  for (const lead of leads) {
    if (stageCounts[lead.stage] !== undefined) stageCounts[lead.stage] += 1
    if (temperatureCounts[lead.temperature] !== undefined) temperatureCounts[lead.temperature] += 1
  }
  const appointmentCounts = { scheduled: 0, attended: 0, no_show: 0, canceled: 0 }
  for (const item of appointments) {
    if (appointmentCounts[item.status] !== undefined) appointmentCounts[item.status] += 1
  }
  return {
    leadCount: leads.length,
    stageCounts,
    temperatureCounts,
    appointmentCounts,
    stageEventCount: stageEvents.length,
  }
}
