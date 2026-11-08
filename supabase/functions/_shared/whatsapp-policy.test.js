import { describe, expect, it } from 'vitest'
import { canSendSessionText, decideInbound, nextStatus, outboundDecision, verifyChallenge } from './whatsapp-policy.js'

describe('whatsapp policy', () => {
  it('returns the challenge only when the verify token matches', () => {
    expect(verifyChallenge({ mode: 'subscribe', token: 'expected', challenge: '1158201444' }, 'expected')).toEqual({
      status: 200,
      body: '1158201444',
      contentType: 'text/plain',
    })
    expect(verifyChallenge({ mode: 'subscribe', token: 'nope', challenge: '1158201444' }, 'expected').status).toBe(403)
  })

  it('routes by phone_number_id and keeps unsupported messages empty', () => {
    const payload = { phoneNumberId: '8100000000000001', providerMessageId: 'wamid.1', type: 'text', text: 'Oi' }
    expect(decideInbound(payload, new Set(['8100000000000001']))).toMatchObject({ action: 'store', clinicKey: '8100000000000001' })
    expect(decideInbound({ ...payload, phoneNumberId: 'desconhecido' }, new Set(['8100000000000001']))).toEqual({ action: 'ignore' })
    expect(decideInbound({ ...payload, type: 'image' }, new Set(['8100000000000001']))).toMatchObject({
      action: 'store',
      status: 'unsupported',
      text: null,
    })
  })

  it('does not treat accepted as delivered and does not regress status', () => {
    expect(nextStatus('accepted', 'delivered')).toBe('delivered')
    expect(nextStatus('read', 'delivered')).toBe('read')
    expect(nextStatus('accepted', 'failed')).toBe('failed')
  })

  it('blocks session text outside 24 hours and a second send with the same key', () => {
    const now = Date.parse('2026-11-08T18:00:00Z')
    expect(canSendSessionText({ lastInboundAt: '2026-11-08T17:00:00Z', now })).toEqual({ ok: true })
    expect(canSendSessionText({ lastInboundAt: '2026-11-07T17:00:00Z', now })).toEqual({ ok: false, error: 'template_required' })
    expect(outboundDecision({ confirm: false, idempotencyKey: 'k1', existing: null })).toEqual({ action: 'reject', error: 'confirm_required' })
    expect(outboundDecision({ confirm: true, idempotencyKey: 'k1', existing: { providerMessageId: 'wamid.9', status: 'accepted' } })).toEqual({
      action: 'return_existing',
    })
  })
})
