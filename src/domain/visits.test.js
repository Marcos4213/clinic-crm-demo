import { describe, expect, it } from 'vitest'
import { buildVisit, hasVisitConflict, startOfWeekKey, visitStatusLabel, visitsOnDate, weekDateKeys } from './visits'

describe('visits', () => {
  it('labels the visit statuses used in the agenda', () => {
    expect(visitStatusLabel('agendada')).toBe('Agendada')
    expect(visitStatusLabel('confirmada')).toBe('Confirmada')
    expect(visitStatusLabel('feita')).toBe('Visita feita')
    expect(visitStatusLabel('no_show')).toBe('No-show')
    expect(visitStatusLabel('attended')).toBe('Visita feita')
  })

  it('builds a Monday-starting week and lists visits of a day', () => {
    expect(startOfWeekKey('2026-11-15')).toBe('2026-11-09')
    expect(weekDateKeys('2026-11-15')[6]).toBe('2026-11-15')
    const visits = [
      { id: '1', brokerId: 'carlos', startsAt: '2026-11-15T16:00:00.000-03:00', endsAt: '2026-11-15T16:30:00.000-03:00', status: 'confirmada' },
      { id: '2', brokerId: 'ana', startsAt: '2026-11-13T10:00:00.000-03:00', endsAt: '2026-11-13T10:30:00.000-03:00', status: 'agendada' },
    ]
    expect(visitsOnDate(visits, '2026-11-15').map((item) => item.id)).toEqual(['1'])
    expect(visitsOnDate(visits, '2026-11-15', 'ana')).toEqual([])
  })

  it('detects a conflict only for the same active broker', () => {
    const { visit } = buildVisit({ leadId: 'maria', brokerId: 'carlos', date: '2026-11-15', time: '16:00', id: 'new' })
    const existing = [{ id: 'v-beatriz', brokerId: 'carlos', startsAt: '2026-11-15T16:00:00.000-03:00', endsAt: '2026-11-15T16:30:00.000-03:00', status: 'confirmada' }]
    expect(hasVisitConflict(existing, visit)).toBe(true)
    expect(hasVisitConflict(existing, { ...visit, brokerId: 'ana' })).toBe(false)
    expect(hasVisitConflict([{ ...existing[0], status: 'feita' }], visit)).toBe(false)
  })
})
