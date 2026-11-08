import { describe, expect, it } from 'vitest'
import { allowCreateAppointment, buildResponsesRequest, customerConfirmedSlot, GROK_MODEL, systemInstructions, unconfiguredGrokBody, validateReplyRequest } from '../../supabase/functions/_shared/ai-policy.js'
import { hasScheduledConflict, openSlots, reportFromWorkspace, zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'
import { hmacSha256Hex, verifyHubSignature } from '../../supabase/functions/_shared/webhook.js'
import { authRedirectUrl, classifyAuthCallback, urlAfterAuthCallback } from '../config.js'
import { mapLead, readSchemaGuard } from '../data/workspace-api.js'

describe('grok policy', () => {
  it('returns unconfigured instead of a fake reply', () => {
    expect(unconfiguredGrokBody()).toEqual({ status: 'unconfigured', provider: 'grok', error: 'grok_unconfigured' })
    expect(JSON.stringify(unconfiguredGrokBody())).not.toMatch(/olá|posso te atender/i)
  })

  it('rejects a malformed reply request and builds a constrained grok-4.7 call', () => {
    expect(validateReplyRequest({ clinicId: 'nope', leadId: '11111111-1111-4111-8111-111111111111', message: 'oi' })).toBe('invalid_clinic')
    const request = buildResponsesRequest({
      instructions: systemInstructions({ clinicName: 'Clínica A', faq: 'Avaliação presencial.' }),
      customerMessage: 'Quero marcar',
    })
    expect(request.model).toBe(GROK_MODEL)
    expect(request.store).toBe(false)
    expect(request.tools.map((tool) => tool.name)).toEqual(['list_open_slots', 'create_appointment'])
    expect(request.instructions).toMatch(/Do not diagnose/)
    expect(request.instructions).toMatch(/untrusted data/)
  })

  it('creates an appointment only after an explicit confirmation and a real offer id', () => {
    const offerId = '11111111-1111-4111-8111-111111111111'
    expect(customerConfirmedSlot('tem horário amanhã?')).toBe(false)
    expect(allowCreateAppointment({ offerId, customerConfirmed: true, customerMessage: 'tem horário amanhã?' })).toBe(false)
    expect(allowCreateAppointment({ offerId, customerConfirmed: false, customerMessage: 'sim, pode marcar' })).toBe(false)
    expect(allowCreateAppointment({ offerId: 'invented', customerConfirmed: true, customerMessage: 'sim, pode marcar' })).toBe(false)
    expect(allowCreateAppointment({ offerId, customerConfirmed: true, customerMessage: 'sim, pode marcar' })).toBe(true)
  })
})

describe('schedule', () => {
  it('converts 10:00 in Sao Paulo to 13:00 UTC', () => {
    expect(zonedLocalToUtc('2026-11-09', '10:00')?.toISOString()).toBe('2026-11-09T13:00:00.000Z')
  })

  it('skips a slot that overlaps a scheduled appointment', () => {
    const slots = openSlots({
      date: '2026-12-01',
      dayStart: '10:00',
      dayEnd: '11:00',
      slotMinutes: 30,
      now: new Date('2026-11-01T00:00:00.000Z'),
      appointments: [
        {
          id: 'a',
          status: 'scheduled',
          starts_at: '2026-12-01T13:00:00.000Z',
          ends_at: '2026-12-01T13:30:00.000Z',
        },
      ],
    })
    expect(slots).toEqual([{ starts_at: '2026-12-01T13:30:00.000Z', ends_at: '2026-12-01T14:00:00.000Z' }])
    expect(hasScheduledConflict(slots.map((slot, index) => ({ id: String(index), status: 'scheduled', ...slot })), new Date(slots[0].starts_at), new Date(slots[0].ends_at))).toBe(true)
  })

  it('reports counts from workspace rows and does not invent revenue', () => {
    const report = reportFromWorkspace({
      leads: [{ stage: 'qualificados', temperature: 'quente' }],
      appointments: [{ status: 'attended' }, { status: 'canceled' }],
      stageEvents: [{ id: '1' }],
    })
    expect(report).toMatchObject({ leadCount: 1, stageEventCount: 1, appointmentCounts: { attended: 1, canceled: 1 } })
    expect(report).not.toHaveProperty('revenue')
    expect(report).not.toHaveProperty('roi')
  })
})

describe('webhook signature', () => {
  it('rejects a missing secret and a bad signature', async () => {
    expect(await verifyHubSignature('{}', 'sha256=abc', '')).toEqual({ ok: false, reason: 'unconfigured' })
    const body = '{"entry":[]}'
    const digest = await hmacSha256Hex('test-secret', body)
    expect(await verifyHubSignature(body, `sha256=${digest}`, 'test-secret')).toEqual({ ok: true })
    expect((await verifyHubSignature(body, `sha256=${digest}`, 'other')).ok).toBe(false)
  })
})

describe('auth callback urls', () => {
  it('keeps the pages path and moves a pkce code out of the hash router', () => {
    const href = 'https://marcos4213.github.io/clinic-crm-demo/?code=abc'
    expect(classifyAuthCallback(href)).toBe('pkce')
    expect(urlAfterAuthCallback(href)).toBe('https://marcos4213.github.io/clinic-crm-demo/#/app')
    expect(authRedirectUrl('https://marcos4213.github.io/clinic-crm-demo/index.html#/cadastro')).toBe(
      'https://marcos4213.github.io/clinic-crm-demo/',
    )
    expect(classifyAuthCallback('https://marcos4213.github.io/clinic-crm-demo/#access_token=jwt')).toBe('implicit')
  })
})

describe('schema guard client', () => {
  it('treats a missing function as not ready', async () => {
    const result = await readSchemaGuard({
      rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'schema_guard not found' } }),
    })
    expect(result.ok).toBe(false)
    expect(result.missing).toBe(true)
  })

  it('maps a persisted lead without copying another clinic', () => {
    const lead = mapLead(
      {
        id: '1',
        clinic_id: 'clinic',
        name: 'Ana',
        phone: '+55 00 90000-0100',
        procedure_name: 'Avaliação',
        temperature: 'morno',
        stage: 'em-atendimento',
        ai_active: true,
      },
      [{ id: 'm', author_role: 'humano', body: 'nota', created_at: '2026-11-08T13:00:00.000Z', delivery: 'local', channel: 'internal' }],
    )
    expect(lead.column).toBe('em-atendimento')
    expect(lead.messages[0].localDemo).toBe(true)
    expect(lead.messages[0].channel).toBe('internal')
  })
})
