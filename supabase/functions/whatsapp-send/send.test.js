import { describe, expect, it } from 'vitest'
import { allowOutboundRate, beginManualSend, clinicFromRequest, handleSend, handleStatus } from './send-handler.js'

const clinicA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const clinicB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
const phoneA = '8100000000000001'
const phoneB = '8100000000000002'

describe('manual whatsapp send', () => {
  it('does not call transport without confirm or outside the 24 hour window', async () => {
    const calls = []
    const transport = async () => {
      calls.push(1)
      return { id: 'wamid.new' }
    }
    const now = Date.parse('2026-11-08T18:00:00Z')
    const common = {
      member: true,
      route: { phoneNumberId: phoneA },
      token: 'present',
      transport,
      now,
      idempotencyKey: 'k1',
    }
    expect((await handleSend({ ...common, confirm: false, lastInboundAt: '2026-11-08T17:00:00Z' })).status).toBe(400)
    expect((await handleSend({ ...common, confirm: true, lastInboundAt: '2026-11-07T17:00:00Z' })).body.error).toBe('template_required')
    expect(calls).toEqual([])
  })

  it('returns the stored send and does not invent an id when the token is missing', async () => {
    const calls = []
    const transport = async () => {
      calls.push(1)
      return { id: 'wamid.new' }
    }
    const now = Date.parse('2026-11-08T18:00:00Z')
    const missing = await handleSend({
      confirm: true,
      idempotencyKey: 'k2',
      existing: null,
      lastInboundAt: '2026-11-08T17:00:00Z',
      now,
      member: true,
      route: { phoneNumberId: phoneA },
      token: '',
      transport,
    })
    const duplicate = await handleSend({
      confirm: true,
      idempotencyKey: 'k1',
      existing: { providerMessageId: 'wamid.9', status: 'accepted' },
      lastInboundAt: '2026-11-08T17:00:00Z',
      now,
      member: true,
      route: { phoneNumberId: phoneA },
      token: 'present',
      transport,
    })
    expect(missing.status).toBe(503)
    expect(missing.body.error).toBe('whatsapp_token_unconfigured')
    expect(duplicate.body).toMatchObject({ duplicate: true, status: 'accepted', providerMessageId: 'wamid.9' })
    expect(calls).toEqual([])
  })

  it('reports connected only when the clinic integration is connected', () => {
    const base = { route: { phoneNumberId: '1' }, token: 'present', lastInboundAt: '2026-11-08T17:00:00Z', now: Date.parse('2026-11-08T18:00:00Z') }
    expect(handleStatus({ ...base, integrationState: 'pending' })).toMatchObject({ connected: false, state: 'pending' })
    expect(handleStatus({ ...base, integrationState: 'connected' })).toMatchObject({ connected: true, state: 'connected' })
    expect(handleStatus({ ...base, integrationState: 'error' })).toMatchObject({ connected: false, state: 'error' })
  })

  it('blocks a burst of manual sends beyond the basic clinic rate limit and does not call transport', async () => {
    expect(allowOutboundRate({ recentCount: 9, max: 10 }).ok).toBe(true)
    expect(allowOutboundRate({ recentCount: 10, max: 10 })).toMatchObject({ ok: false, error: 'rate_limited' })
    const calls = []
    const blocked = await handleSend({
      confirm: true,
      idempotencyKey: 'k-rate',
      existing: null,
      lastInboundAt: '2026-11-08T17:00:00Z',
      now: Date.parse('2026-11-08T18:00:00Z'),
      member: true,
      route: { phoneNumberId: phoneA },
      token: 'present',
      recentOutboundCount: 10,
      transport: async () => {
        calls.push(1)
        return { id: 'wamid.new' }
      },
    })
    expect(blocked.status).toBe(429)
    expect(blocked.body.error).toBe('rate_limited')
    expect(calls).toEqual([])
  })

  it('fails closed when the route query fails or more than one clinic is visible', async () => {
    const calls = []
    const transport = async ({ phoneNumberId }) => {
      calls.push(phoneNumberId)
      return { id: 'wamid.new' }
    }
    const send = {
      confirm: true,
      idempotencyKey: 'k1',
      existing: null,
      lastInboundAt: '2026-11-08T17:00:00Z',
      now: Date.parse('2026-11-08T18:00:00Z'),
      token: 'present',
      transport,
    }
    const routes = [
      { clinicId: clinicA, phoneNumberId: phoneA },
      { clinicId: clinicB, phoneNumberId: phoneB },
    ]
    const rpcDown = await beginManualSend({ ...send, routes: null, routeError: { message: 'connection reset' }, clinicId: clinicA })
    const ambiguous = await beginManualSend({ ...send, routes, clinicId: '' })
    const foreignClinic = await beginManualSend({ ...send, routes, clinicId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9' })
    const chosen = await beginManualSend({ ...send, routes, clinicId: clinicB })
    expect(rpcDown.status).toBe(503)
    expect(rpcDown.body.error).toBe('persist_failed')
    expect(ambiguous.status).toBe(409)
    expect(foreignClinic.status).toBe(403)
    expect(chosen.status).toBe(200)
    expect(calls).toEqual([phoneB])
  })

  it('reads the clinic from the query when the browser cannot send a custom header', () => {
    expect(clinicFromRequest({ queryClinic: clinicA }).clinicId).toBe(clinicA)
    expect(clinicFromRequest({ queryClinic: clinicA, bodyClinic: clinicA }).clinicId).toBe(clinicA)
    expect(clinicFromRequest({ queryClinic: clinicA, headerClinic: clinicB }).ok).toBe(false)
  })
})
