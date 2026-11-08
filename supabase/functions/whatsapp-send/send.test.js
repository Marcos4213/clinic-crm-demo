import { describe, expect, it } from 'vitest'
import { handleSend, handleStatus } from './send-handler.js'

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
      route: { phoneNumberId: '1468451929686754' },
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
      route: { phoneNumberId: '1468451929686754' },
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
      route: { phoneNumberId: '1468451929686754' },
      token: 'present',
      transport,
    })
    expect(missing.status).toBe(503)
    expect(missing.body.error).toBe('whatsapp_token_unconfigured')
    expect(duplicate.body).toMatchObject({ duplicate: true, status: 'accepted', providerMessageId: 'wamid.9' })
    expect(calls).toEqual([])
  })

  it('never reports the simulated status as a live connection', () => {
    expect(handleStatus({ route: { phoneNumberId: '1' }, token: 'present', lastInboundAt: '2026-11-08T17:00:00Z', now: Date.parse('2026-11-08T18:00:00Z') }).connected).toBe(false)
  })
})
