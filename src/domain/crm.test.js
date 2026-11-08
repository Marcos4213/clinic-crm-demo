import { describe, expect, it } from 'vitest'
import {
  COLUMNS,
  countByColumn,
  filterLeads,
  formatStamp,
  moveLead,
  sendHumanMessage,
  setAiActive,
  stageCountLabel,
} from './crm'

const leads = [
  {
    id: 'maria',
    name: 'Maria Silva',
    phone: '+55 00 90000-0101',
    procedure: 'Botox',
    temperature: 'quente',
    column: 'em-atendimento',
    aiActive: true,
    messages: [],
  },
  {
    id: 'joao',
    name: 'João Pedro',
    phone: '+55 00 90000-0105',
    procedure: 'Implante Capilar',
    temperature: 'morno',
    column: 'qualificados',
    aiActive: true,
    messages: [],
  },
]

describe('COLUMNS', () => {
  it('uses the four exact stage labels in order', () => {
    expect(COLUMNS.map((column) => column.label)).toEqual([
      'Em Atendimento (IA)',
      'Qualificados',
      'Agendados',
      'Fechados',
    ])
  })
})

describe('filterLeads', () => {
  it('matches procedure without case', () => {
    expect(filterLeads(leads, { query: 'botox', temperature: 'todos' }).map((lead) => lead.id)).toEqual([
      'maria',
    ])
  })

  it('matches João without an accent', () => {
    expect(filterLeads(leads, { query: 'joao', temperature: 'todos' }).map((lead) => lead.id)).toEqual([
      'joao',
    ])
  })

  it('combines temperature and query', () => {
    expect(filterLeads(leads, { query: '', temperature: 'morno' }).map((lead) => lead.id)).toEqual(['joao'])
    expect(filterLeads(leads, { query: 'botox', temperature: 'morno' })).toEqual([])
  })
})

describe('countByColumn', () => {
  it('counts leads in every stage', () => {
    expect(countByColumn(leads)).toEqual({
      'em-atendimento': 1,
      qualificados: 1,
      agendados: 0,
      fechados: 0,
    })
  })
})

describe('stageCountLabel', () => {
  it('agrees with Portuguese singular and plural', () => {
    expect(stageCountLabel(0)).toBe('0 leads nesta etapa')
    expect(stageCountLabel(1)).toBe('1 lead nesta etapa')
    expect(stageCountLabel(4)).toBe('4 leads nesta etapa')
  })
})

describe('moveLead', () => {
  it('moves one lead and leaves the source untouched', () => {
    const next = moveLead(leads, 'maria', 'qualificados')
    expect(next.find((lead) => lead.id === 'maria').column).toBe('qualificados')
    expect(leads.find((lead) => lead.id === 'maria').column).toBe('em-atendimento')
    expect(next.find((lead) => lead.id === 'joao').column).toBe('qualificados')
  })

  it('rejects an unknown stage', () => {
    expect(() => moveLead(leads, 'maria', 'nope')).toThrow(/Etapa desconhecida/)
  })
})

describe('setAiActive', () => {
  it('changes only the requested lead', () => {
    const next = setAiActive(leads, 'maria', false)
    expect(next.find((lead) => lead.id === 'maria').aiActive).toBe(false)
    expect(next.find((lead) => lead.id === 'joao').aiActive).toBe(true)
    expect(leads.find((lead) => lead.id === 'maria').aiActive).toBe(true)
  })
})

describe('sendHumanMessage', () => {
  it('returns the same list when the text is blank', () => {
    expect(sendHumanMessage(leads, 'maria', '   ', { id: 'm1', at: '2026-11-08T12:00:00.000Z' })).toBe(leads)
  })

  it('appends one trimmed local human message', () => {
    const next = sendHumanMessage(leads, 'maria', '  Olá  ', { id: 'm1', at: '2026-11-08T12:00:00.000Z' })
    expect(next.find((lead) => lead.id === 'maria').messages).toEqual([
      {
        id: 'm1',
        role: 'humano',
        text: 'Olá',
        at: '2026-11-08T12:00:00.000Z',
        receipt: 'delivered',
        localDemo: true,
      },
    ])
    expect(leads[0].messages).toEqual([])
    expect(next.find((lead) => lead.id === 'joao').messages).toEqual([])
  })
})

describe('formatStamp', () => {
  it('formats a fixed demo timestamp in pt-BR', () => {
    expect(formatStamp('2026-11-08T09:14:00.000-03:00')).toBe('08/11 · 09:14')
  })
})
