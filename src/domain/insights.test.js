import { describe, expect, it } from 'vitest'
import { averageAssumptionMinutes, averageResponseMinutes, brokerRanking, conversionByChannel, csvFromRows, followUpTasks, hotLeadsWaiting, pipelineEstimate, qualifiedRate, visitStatusLabel } from './insights'

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

describe('home panel insights', () => {
  const leads = [
    { id: 'a', column: 'em-atendimento', temperature: 'quente', waiting: true, broker: 'Carlos Mendes' },
    { id: 'b', column: 'qualificados', temperature: 'morno', broker: 'Ana Souza', assumptionMinutes: 7 },
    { id: 'c', column: 'fechados', temperature: 'quente', broker: 'Carlos Mendes', assumptionMinutes: 3 },
    { id: 'd', column: 'em-atendimento', temperature: 'morno', waiting: true },
  ]

  it('computes the qualified share and the mean assumption time', () => {
    expect(qualifiedRate(leads)).toBe(50)
    expect(averageAssumptionMinutes(leads)).toBe(5)
    expect(qualifiedRate([])).toBe(null)
    expect(averageAssumptionMinutes([])).toBe(null)
  })

  it('ranks brokers by assumption time and lists only hot waiting leads', () => {
    expect(brokerRanking(leads)).toEqual([
      { broker: 'Carlos Mendes', leads: 1, minutes: 3 },
      { broker: 'Ana Souza', leads: 1, minutes: 7 },
    ])
    expect(hotLeadsWaiting(leads).map((lead) => lead.id)).toEqual(['a'])
  })

  it('labels visit outcomes without clinical wording', () => {
    expect(visitStatusLabel('attended')).toBe('Visita feita')
    expect(visitStatusLabel('no_show')).toBe('No-show')
    expect(visitStatusLabel('scheduled')).toBe('Agendada')
    expect(visitStatusLabel('confirmada')).toBe('Confirmada')
  })
})
