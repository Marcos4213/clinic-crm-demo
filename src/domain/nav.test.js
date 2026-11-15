import { beforeEach, describe, expect, it } from 'vitest'
import { isNavActive, navBlueprint, readSidebarCollapsed, SIDEBAR_COLLAPSED_KEY, writeSidebarCollapsed } from './nav'

describe('nav blueprint', () => {
  it('covers every logged-in destination that used to live in Mais or the primary bar', () => {
    const { sections, footer } = navBlueprint('/demo')
    const labels = [...sections.flatMap((section) => section.items), ...footer].map((item) => item.label)
    expect(labels).toEqual([
      'Início',
      'Conversas',
      'Leads',
      'Visitas',
      'Imóveis',
      'WhatsApp',
      'Instagram',
      'Equipe',
      'Relatórios',
      'Alertas',
      'Avaliações',
      'Ajustes',
      'Integrações',
      'Ajuda',
    ])
    expect(sections.flatMap((section) => section.items).concat(footer).map((item) => item.to).filter(Boolean).sort()).toEqual([
      '/demo',
      '/demo/agenda',
      '/demo/ajustes',
      '/demo/avaliacoes',
      '/demo/equipe',
      '/demo/imoveis',
      '/demo/instagram',
      '/demo/integracoes',
      '/demo/pipeline',
      '/demo/relatorios',
      '/demo/whatsapp',
      '/demo/whatsapp',
    ].sort())
  })
})

describe('isNavActive', () => {
  it('keeps Início exact and marks the lead sheet as Leads', () => {
    expect(isNavActive('/demo', { to: '/demo', end: true }, '/demo')).toBe(true)
    expect(isNavActive('/demo/pipeline', { to: '/demo', end: true }, '/demo')).toBe(false)
    expect(isNavActive('/demo/leads/maria', { to: '/demo/pipeline', match: 'leads' }, '/demo')).toBe(true)
    expect(isNavActive('/demo/whatsapp/disparos', { to: '/demo/whatsapp' }, '/demo')).toBe(true)
  })
})

describe('sidebar collapsed storage', () => {
  beforeEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY)
  })

  it('reads and writes without inventing a collapsed state', () => {
    expect(readSidebarCollapsed()).toBe(false)
    writeSidebarCollapsed(true)
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('1')
    expect(readSidebarCollapsed()).toBe(true)
    writeSidebarCollapsed(false)
    expect(readSidebarCollapsed()).toBe(false)
  })
})
