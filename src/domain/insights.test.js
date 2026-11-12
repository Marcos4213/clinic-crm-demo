import { describe, expect, it } from 'vitest'
import { averageResponseMinutes, conversionByChannel, csvFromRows, followUpTasks, pipelineEstimate } from './insights'

describe('pipeline insights', () => {
  const leads = [
    { id: 'a', name: 'Ana', procedure: 'Botox', column: 'em-atendimento', value: 1000, channel: 'whatsapp' },
    { id: 'b', name: 'Bia', procedure: 'Peeling', column: 'qualificados', value: 500, channel: 'instagram' },
    { id: 'c', name: 'Caio', procedure: 'Botox', column: 'fechados', value: 800, channel: 'whatsapp' },
    { id: 'd', name: 'Duda', procedure: 'Consulta', column: 'agendados' },
  ]

  it('sums only priced leads and keeps closed value apart', () => {
    expect(pipelineEstimate(leads)).toMatchObject({ open: 1500, won: 800, priced: 3, byStage: { 'em-atendimento': 1000, fechados: 800 } })
  })

  it('counts conversions with the channel that exists on the lead', () => {
    expect(conversionByChannel(leads)).toEqual([
      { channel: 'instagram', total: 1, won: 0 },
      { channel: 'whatsapp', total: 2, won: 1 },
    ])
  })

  it('asks for follow-up only when a qualified lead has no visit booked', () => {
    expect(followUpTasks(leads, [{ lead_id: 'b', status: 'scheduled' }])).toEqual([])
    expect(followUpTasks(leads, [])).toEqual([{ id: 'b', name: 'Bia', detail: 'Retomar Peeling' }])
  })

  it('averages the wait between the customer and the next reply', () => {
    const minutes = averageResponseMinutes([
      {
        messages: [
          { role: 'cliente', at: '2026-11-09T12:00:00.000Z' },
          { role: 'humano', at: '2026-11-09T12:04:00.000Z' },
          { role: 'cliente', at: '2026-11-09T12:10:00.000Z' },
          { role: 'ia', at: '2026-11-09T12:16:00.000Z' },
        ],
      },
    ])
    expect(minutes).toBe(5)
  })

  it('escapes csv cells', () => {
    expect(csvFromRows([['nome', 'nota'], ['Ana, Bia', 'disse "oi"']])).toBe('nome,nota\n"Ana, Bia","disse ""oi"""')
  })
})
