import { hmacSha256Hex } from '../_shared/webhook.js'
import { handleChannelRequest } from '../_shared/whatsapp-http.js'
import { describe, expect, it } from 'vitest'

const secret = 'test-app-secret'
const token = 'test-verify-token'
const phone = '8100000000000001'

function payload(messageId = 'wamid.1') {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: phone },
              messages: [{ id: messageId, from: '5500000000001', type: 'text', text: { body: 'Oi' } }],
            },
          },
        ],
      },
    ],
  })
}

async function signed(raw, value = secret) {
  return `sha256=${await hmacSha256Hex(value, raw)}`
}

describe('channel webhook', () => {
  it('answers the challenge and rejects the wrong token', async () => {
    const ok = await handleChannelRequest({
      method: 'GET',
      url: 'https://example.test/functions/v1/channel-webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=1158201444',
      env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token },
    })
    expect(ok).toMatchObject({ status: 200, text: '1158201444' })
    const bad = await handleChannelRequest({
      method: 'GET',
      url: 'https://example.test/functions/v1/channel-webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1158201444',
      env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token },
    })
    expect(bad.status).toBe(403)
  })

  it('rejects a reformatted body, stores one id, and ignores an unknown number', async () => {
    const raw = payload()
    const stored = []
    const ingest = async (event) => {
      if (!stored.some((item) => item.providerMessageId === event.providerMessageId)) stored.push(event)
    }
    const env = { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token }
    const ok = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: raw,
      signature: await signed(raw),
      env,
      ingest,
      knownPhoneIds: new Set([phone]),
    })
    const again = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: raw,
      signature: await signed(raw),
      env,
      ingest,
      knownPhoneIds: new Set([phone]),
    })
    const reformatted = JSON.stringify(JSON.parse(raw), null, 2)
    const rejected = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: reformatted,
      signature: await signed(raw),
      env,
      ingest,
      knownPhoneIds: new Set([phone]),
    })
    const unknown = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: payload('wamid.other'),
      signature: await signed(payload('wamid.other')),
      env,
      ingest,
      knownPhoneIds: new Set(),
    })
    expect(ok.status).toBe(200)
    expect(again.status).toBe(200)
    expect(stored).toHaveLength(1)
    expect(rejected.status).toBe(401)
    expect(unknown.status).toBe(200)
    expect(stored).toHaveLength(1)
  })

  it('refuses an oversized body and stays unconfigured without the app secret', async () => {
    const huge = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: 'x'.repeat(262145),
      signature: 'sha256=00',
      env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token },
    })
    const missing = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: '{}',
      env: { WHATSAPP_APP_SECRET: '', WHATSAPP_VERIFY_TOKEN: '' },
    })
    expect(huge.status).toBe(413)
    expect(missing.status).toBe(503)
    expect(missing.body.error).toBe('webhook_unconfigured')
  })

  it('does not acknowledge a message when the database persist call fails', async () => {
    const raw = payload()
    const thrown = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: raw,
      signature: await signed(raw),
      env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token },
      ingest: async () => {
        throw new Error(`db down ${phone} Oi`)
      },
      knownPhoneIds: new Set([phone]),
    })
    const reported = await handleChannelRequest({
      method: 'POST',
      url: 'https://example.test/hook',
      rawBody: raw,
      signature: await signed(raw),
      env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_VERIFY_TOKEN: token },
      ingest: async () => ({ ok: false }),
      knownPhoneIds: new Set([phone]),
    })
    expect(thrown.status).toBe(503)
    expect(reported.status).toBe(503)
    expect(JSON.stringify(thrown)).not.toContain(phone)
    expect(JSON.stringify(thrown)).not.toContain('Oi')
    expect(thrown.body.error).toBe('persist_failed')
  })
})
