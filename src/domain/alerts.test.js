import { describe, expect, it } from 'vitest'
import { DEFAULT_ALERT_RULES, externalAlertDispatch, findStaleAlerts, maybeDispatchExternalAlerts, prepareExternalAlert } from './alerts'

const now = new Date('2026-11-15T18:00:00.000-03:00')

describe('stale lead alerts', () => {
  it('flags a hot lead waiting longer than the assume threshold and a warm lead without a human reply', () => {
    const alerts = findStaleAlerts(
      [
        { id: 'maria', name: 'Maria Silva', temperature: 'quente', helenaActive: true, waitingSinceMinutes: 12 },
        { id: 'rafael', name: 'Rafael Nunes', temperature: 'quente', helenaActive: false, waitingSinceMinutes: 40 },
        { id: 'joao', name: 'João Pedro', temperature: 'morno', helenaActive: true, unansweredHours: 3 },
        { id: 'camila', name: 'Camila Rocha', temperature: 'morno', unansweredHours: 1 },
      ],
      DEFAULT_ALERT_RULES,
      now,
    )
    expect(alerts.map((item) => item.leadId)).toEqual(['joao', 'maria'])
    expect(alerts[0].reason).toMatch(/Morno sem resposta/)
    expect(alerts[1].reason).toMatch(/Quente sem assumir/)
  })

  it('respects editable thresholds', () => {
    const leads = [
      { id: 'maria', name: 'Maria Silva', temperature: 'quente', helenaActive: true, waitingSinceMinutes: 12 },
      { id: 'joao', name: 'João Pedro', temperature: 'morno', unansweredHours: 3 },
    ]
    expect(findStaleAlerts(leads, { hotAssumeMinutes: 15, warmReplyHours: 2 }, now).map((item) => item.leadId)).toEqual(['joao'])
    expect(findStaleAlerts(leads, { hotAssumeMinutes: 10, warmReplyHours: 4 }, now).map((item) => item.leadId)).toEqual(['maria'])
  })

  it('keeps the external notification hook disabled', () => {
    const payload = prepareExternalAlert({ leadId: 'maria', type: 'hot', reason: 'Quente sem assumir há 12 min', minutes: 12 })
    expect(payload.kind).toBe('lead_stale')
    expect(externalAlertDispatch.enabled).toBe(false)
    expect(maybeDispatchExternalAlerts([{ leadId: 'maria', type: 'hot', reason: 'x', minutes: 12 }])).toEqual([{ skipped: true, reason: 'disabled' }])
  })
})
