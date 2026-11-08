const STATUS_RANK = {
  unsupported: 0,
  received: 1,
  accepted: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
}

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_TEXT = 4096

export function verifyChallenge(query, expectedToken) {
  const mode = query?.mode
  const token = query?.token
  const challenge = query?.challenge
  if (!expectedToken || mode !== 'subscribe' || token !== expectedToken || challenge == null || challenge === '') {
    return { status: 403, body: '', contentType: 'text/plain' }
  }
  return { status: 200, body: String(challenge), contentType: 'text/plain' }
}

export function decideInbound(payload, knownPhoneIds) {
  const phoneNumberId = String(payload?.phoneNumberId ?? '')
  if (!knownPhoneIds?.has?.(phoneNumberId)) return { action: 'ignore' }
  const type = payload?.type ?? 'unsupported'
  if (type !== 'text') {
    return { action: 'store', clinicKey: phoneNumberId, status: 'unsupported', text: null, type }
  }
  return {
    action: 'store',
    clinicKey: phoneNumberId,
    status: 'received',
    text: String(payload.text ?? '').slice(0, MAX_TEXT),
    type: 'text',
  }
}

export function nextStatus(current, incoming) {
  if (incoming === 'failed') return 'failed'
  if ((STATUS_RANK[current] ?? 0) > (STATUS_RANK[incoming] ?? 0)) return current
  return incoming
}

export function canSendSessionText({ lastInboundAt, now }) {
  const inbound = Date.parse(lastInboundAt ?? '')
  if (!Number.isFinite(inbound) || !Number.isFinite(now)) return { ok: false, error: 'template_required' }
  if (now - inbound > DAY_MS) return { ok: false, error: 'template_required' }
  if (now < inbound) return { ok: false, error: 'template_required' }
  return { ok: true }
}

export function outboundDecision({ confirm, idempotencyKey, existing }) {
  if (confirm !== true) return { action: 'reject', error: 'confirm_required' }
  if (!idempotencyKey) return { action: 'reject', error: 'idempotency_required' }
  if (existing?.providerMessageId) return { action: 'return_existing' }
  return { action: 'send' }
}

export function parseWebhook(rawBody) {
  let parsed
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return []
  }
  const events = []
  for (const entry of parsed?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {}
      const phoneNumberId = value?.metadata?.phone_number_id
      if (!phoneNumberId) continue
      for (const message of value.messages ?? []) {
        events.push({
          kind: 'message',
          phoneNumberId: String(phoneNumberId),
          providerMessageId: String(message.id ?? ''),
          type: message.type ?? 'unsupported',
          text: message.type === 'text' ? message.text?.body ?? '' : null,
          waId: message.from ? String(message.from) : null,
          status: message.type === 'text' ? 'received' : 'unsupported',
        })
      }
      for (const status of value.statuses ?? []) {
        events.push({
          kind: 'status',
          phoneNumberId: String(phoneNumberId),
          providerMessageId: String(status.id ?? ''),
          type: 'status',
          text: null,
          waId: status.recipient_id ? String(status.recipient_id) : null,
          status: String(status.status ?? ''),
          errorCode: status.errors?.[0]?.code ? String(status.errors[0].code) : null,
        })
      }
    }
  }
  return events.filter((event) => event.providerMessageId)
}
