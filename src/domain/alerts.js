export const DEFAULT_ALERT_RULES = {
  hotAssumeMinutes: 10,
  warmReplyHours: 2,
}

export function formatWait(minutes) {
  const value = Math.max(0, Math.round(minutes))
  if (value < 60) return `${value} min`
  const hours = value / 60
  if (hours < 24) {
    const rounded = hours >= 10 || Number.isInteger(hours) ? String(Math.round(hours)) : String(Math.round(hours * 10) / 10).replace('.', ',')
    return `${rounded} h`
  }
  const days = Math.round(hours / 24)
  return `${days} d`
}

function isAssumed(lead) {
  return lead.helenaActive === false || lead.aiActive === false
}

function asDate(value, now) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function resolveWaitingSince(lead, now = new Date()) {
  if (lead.waitingSince) return asDate(lead.waitingSince, now)
  if (lead.waitingSinceMinutes != null) return new Date(now.getTime() - Number(lead.waitingSinceMinutes) * 60 * 1000)
  return asDate(lead.updated_at || lead.updatedAt || lead.created_at || lead.createdAt, now)
}

export function lastMessageOf(lead, role) {
  const messages = [...(lead.messages ?? [])].sort((a, b) => Date.parse(a.at || a.created_at) - Date.parse(b.at || b.created_at))
  return [...messages].reverse().find((message) => message.role === role || message.author_role === role) ?? null
}

export function resolveUnansweredSince(lead, now = new Date()) {
  if (lead.unansweredSince) return asDate(lead.unansweredSince, now)
  if (lead.unansweredHours != null) return new Date(now.getTime() - Number(lead.unansweredHours) * 60 * 60 * 1000)
  const lastClient = lastMessageOf(lead, 'cliente')
  const lastHuman = lastMessageOf(lead, 'humano')
  if (!lastClient) return null
  const clientAt = asDate(lastClient.at || lastClient.created_at, now)
  const humanAt = lastHuman ? asDate(lastHuman.at || lastHuman.created_at, now) : null
  if (humanAt && humanAt >= clientAt) return null
  return clientAt
}

export function findStaleAlerts(leads = [], rules = DEFAULT_ALERT_RULES, now = new Date()) {
  const hotMinutes = Number(rules.hotAssumeMinutes ?? DEFAULT_ALERT_RULES.hotAssumeMinutes)
  const warmHours = Number(rules.warmReplyHours ?? DEFAULT_ALERT_RULES.warmReplyHours)
  const alerts = []

  for (const lead of leads) {
    if (!lead?.id) continue
    if (lead.temperature === 'quente' && !isAssumed(lead)) {
      const since = resolveWaitingSince(lead, now)
      if (since) {
        const minutes = (now.getTime() - since.getTime()) / 60000
        if (minutes >= hotMinutes) {
          alerts.push({
            id: `hot-${lead.id}`,
            leadId: lead.id,
            name: lead.name,
            type: 'hot',
            minutes: Math.round(minutes),
            reason: `Quente sem assumir há ${formatWait(minutes)}`,
          })
        }
      }
    }
    if (lead.temperature === 'morno') {
      const since = resolveUnansweredSince(lead, now)
      if (since) {
        const minutes = (now.getTime() - since.getTime()) / 60000
        if (minutes >= warmHours * 60) {
          alerts.push({
            id: `warm-${lead.id}`,
            leadId: lead.id,
            name: lead.name,
            type: 'warm',
            minutes: Math.round(minutes),
            reason: `Morno sem resposta há ${formatWait(minutes)}`,
          })
        }
      }
    }
  }

  return alerts.sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, 'pt-BR'))
}

export function prepareExternalAlert(alert) {
  return {
    kind: 'lead_stale',
    leadId: alert.leadId,
    type: alert.type,
    reason: alert.reason,
    minutes: alert.minutes,
  }
}

// Prepared hook for a future webhook or push. It stays disabled and never sends.
export const externalAlertDispatch = {
  enabled: false,
  endpoint: null,
  send(payload) {
    if (!this.enabled || !this.endpoint) return { skipped: true, reason: 'disabled' }
    return { skipped: true, reason: 'disabled' }
  },
}

export function maybeDispatchExternalAlerts(alerts = []) {
  return alerts.map((alert) => externalAlertDispatch.send(prepareExternalAlert(alert)))
}
