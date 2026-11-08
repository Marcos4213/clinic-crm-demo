import { decideInbound, parseWebhook, verifyChallenge } from './whatsapp-policy.js'
import { verifyHubSignature } from './webhook.js'

export const MAX_RAW_BYTES = 262144

export async function handleChannelRequest({ method, url, rawBody = '', signature, env = {}, ingest, knownPhoneIds }) {
  const appSecret = env.WHATSAPP_APP_SECRET || ''
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN || ''
  if (!appSecret || !verifyToken) {
    return { status: 503, body: { status: 'unconfigured', provider: 'whatsapp', error: 'webhook_unconfigured' } }
  }
  if (method === 'GET') {
    const params = new URL(url).searchParams
    const result = verifyChallenge(
      { mode: params.get('hub.mode'), token: params.get('hub.verify_token'), challenge: params.get('hub.challenge') },
      verifyToken,
    )
    return { status: result.status, text: result.body, contentType: result.contentType }
  }
  if (method !== 'POST') return { status: 405, body: { error: 'method_not_allowed' } }
  if (byteLength(rawBody) > MAX_RAW_BYTES) return { status: 413, body: { error: 'payload_too_large' } }
  const verdict = await verifyHubSignature(rawBody, signature, appSecret)
  if (!verdict.ok) return { status: 401, body: { error: 'bad_signature' } }

  const seen = new Set()
  for (const event of parseWebhook(rawBody)) {
    if (event.kind === 'status') {
      if (!(await persist(ingest, event))) return persistFailed()
      continue
    }
    if (seen.has(event.providerMessageId)) continue
    seen.add(event.providerMessageId)
    if (knownPhoneIds) {
      const decision = decideInbound(
        { phoneNumberId: event.phoneNumberId, providerMessageId: event.providerMessageId, type: event.type, text: event.text },
        knownPhoneIds,
      )
      if (decision.action !== 'store') continue
      if (!(await persist(ingest, { ...event, status: decision.status, text: decision.text }))) return persistFailed()
      continue
    }
    if (!(await persist(ingest, event))) return persistFailed()
  }
  return { status: 200, body: { status: 'ok' } }
}

export function rpcPersisted(result) {
  if (!result || result.error) return { ok: false }
  return { ok: true }
}

async function persist(ingest, event) {
  try {
    const outcome = await ingest?.(event)
    return outcome?.ok !== false
  } catch {
    return false
  }
}

function persistFailed() {
  return { status: 503, body: { status: 'retry', error: 'persist_failed' } }
}

function byteLength(value) {
  return new TextEncoder().encode(value).length
}
