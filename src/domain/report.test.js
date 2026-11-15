import { describe, expect, it } from 'vitest'
import { mergeLeadsForReport, trendOf, weeklyReport } from './report'

describe('weekly owner report', () => {
  it('computes KPIs, source boards and a cautious trend against the previous week', () => {
    const leads = [
      { id: 'maria', name: 'Maria', source: 'whatsapp', createdAt: '2026-11-10T10:00:00.000-03:00', column: 'em-atendimento', brokerId: 'carlos' },
      { id: 'camila', name: 'Camila', source: 'instagram', createdAt: '2026-11-12T10:00:00.000-03:00', column: 'qualificados', brokerId: 'ana', assumptionMinutes: 7 },
      { id: 'fernanda', name: 'Fernanda', source: 'site', createdAt: '2026-11-04T10:00:00.000-03:00', column: 'fechados', brokerId: 'ana', assumptionMinutes: 6 },
    ]
    const visits = [
      { id: 'v1', brokerId: 'carlos', startsAt: '2026-11-15T16:00:00.000-03:00', status: 'confirmada' },
      { id: 'v2', brokerId: 'ana', startsAt: '2026-11-15T11:00:00.000-03:00', status: 'no_show' },
      { id: 'v3', brokerId: 'ana', startsAt: '2026-11-06T15:00:00.000-03:00', status: 'feita' },
    ]
    const report = weeklyReport({ leads, visits, brokers: [{ id: 'carlos', name: 'Carlos Mendes' }, { id: 'ana', name: 'Ana Souza' }], weekStart: '2026-11-09' })
    expect(report.current.volume).toBe(2)
    expect(report.current.qualified).toBe(50)
    expect(report.current.visits.agendadas).toBe(1)
    expect(report.current.visits.noShow).toBe(1)
    expect(report.previous.volume).toBe(1)
    expect(report.trends.volume.label).toBe('+100%')
    expect(report.bySource.find((row) => row.id === 'whatsapp').leads).toBe(1)
    expect(report.byBroker.find((row) => row.id === 'ana').visits.noShow).toBe(1)
  })

  it('keeps pipeline stage and messages when merging profiles', () => {
    const merged = mergeLeadsForReport(
      [{ id: 'maria', column: 'qualificados', messages: [{ role: 'humano', at: '2026-11-10T10:10:00.000-03:00' }] }],
      [{ id: 'maria', source: 'zap', createdAt: '2026-11-10T10:00:00.000-03:00' }],
    )
    expect(merged[0].column).toBe('qualificados')
    expect(merged[0].source).toBe('zap')
    expect(merged[0].messages).toHaveLength(1)
  })

  it('does not invent a trend when the previous week is empty', () => {
    expect(trendOf(3, 0).label).toBe('—')
    expect(weeklyReport({ leads: [], visits: [], brokers: [], weekStart: '2026-11-09' }).current.volume).toBe(0)
    expect(weeklyReport({ leads: [], visits: [], brokers: [], weekStart: '2026-11-09' }).current.qualified).toBeNull()
  })
})
