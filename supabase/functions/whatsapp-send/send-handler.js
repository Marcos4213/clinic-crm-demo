import { canSendSessionText, outboundDecision } from '../_shared/whatsapp-policy.js'

export async function handleSend({
  confirm,
  idempotencyKey,
  existing,
  lastInboundAt,
  now,
  member,
  route,
  token,
  transport,
}) {
  if (!member || !route) return { status: 403, body: { error: 'forbidden' } }
  const decision = outboundDecision({ confirm, idempotencyKey, existing })
  if (decision.action === 'reject') return { status: 400, body: { error: decision.error } }
  if (decision.action === 'return_existing') {
    return {
      status: 200,
      body: { status: existing.status, providerMessageId: existing.providerMessageId, duplicate: true },
    }
  }
  const window = canSendSessionText({ lastInboundAt, now })
  if (!window.ok) return { status: 409, body: { error: window.error } }
  if (!token) return { status: 503, body: { status: 'unconfigured', error: 'whatsapp_token_unconfigured' } }
  try {
    const result = await transport({ phoneNumberId: route.phoneNumberId })
    return { status: 200, body: { status: 'accepted', providerMessageId: result.id, delivered: false } }
  } catch (error) {
    if (error?.code === 'token_expired') return { status: 401, body: { error: 'token_expired', status: 'failed' } }
    return { status: 502, body: { error: 'upstream', status: 'failed' } }
  }
}

export function handleStatus({ route, token, lastInboundAt, now }) {
  const window = canSendSessionText({ lastInboundAt, now })
  return {
    connected: false,
    state: route ? 'pending' : 'unconfigured',
    tokenConfigured: Boolean(token),
    canSend: Boolean(route && token && window.ok),
  }
}
