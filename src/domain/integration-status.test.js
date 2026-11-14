import { describe, expect, it } from 'vitest'
import { integrationBadge } from './integration-status.js'

describe('integration badge', () => {
  it('labels WhatsApp as Conectado, Pendente, or Erro without calling anyone a cliente', () => {
    expect(integrationBadge('connected')).toMatchObject({ label: 'Conectado' })
    expect(integrationBadge('pending')).toMatchObject({ label: 'Pendente' })
    expect(integrationBadge('unconfigured')).toMatchObject({ label: 'Pendente' })
    expect(integrationBadge('error')).toMatchObject({ label: 'Erro' })
    const text = JSON.stringify([
      integrationBadge('connected'),
      integrationBadge('pending'),
      integrationBadge('error'),
    ])
    expect(text).toMatch(/paciente/i)
    expect(text).not.toMatch(/cliente/i)
  })
})
