import { canSendSessionText, outboundDecision } from '../_shared/whatsapp-policy.js'

const CLINIC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function selectAuthorizedRoute(routes, clinicId) {
  const requested = String(clinicId ?? '').trim().toLowerCase()
  const visible = (Array.isArray(routes) ? routes : []).filter((route) => route?.clinicId && route?.phoneNumberId)
  if (!requested) {
    return visible.length > 1
      ? { ok: false, status: 409, error: 'ambiguous_clinic' }
      : { ok: false, status: 400, error: 'clinic_required' }
  }
  if (!CLINIC_ID.test(requested)) return { ok: false, status: 403, error: 'forbidden' }
  const matches = visible.filter((route) => String(route.clinicId).toLowerCase() === requested)
  if (matches.length !== 1) return { ok: false, status: 403, error: 'forbidden' }
  return { ok: true, route: matches[0] }
}

export function routeQueryResult({ error, data }, clinicId) {
  if (error) return { ok: false, status: 503, error: 'persist_failed' }
  return selectAuthorizedRoute(data, clinicId)
}

export async function beginManualSend({ routes, routeError, clinicId, transport, ...sendArgs }) {
  const decision = routeQueryResult({ error: routeError, data: routes }, clinicId)
  if (!decision.ok) return { status: decision.status, body: { error: decision.error, connected: false } }
  const result = await handleSend({
    ...sendArgs,
    member: true,
    route: { phoneNumberId: decision.route.phoneNumberId, clinicId: decision.route.clinicId },
    transport,
  })
  return { status: result.status, body: { ...result.body, connected: false } }
}

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

const CLINIC_LINK = /^https:\/\/wa\.me\/(?:[0-9]{8,15}|qr\/[A-Za-z0-9]{4,64}|message\/[A-Za-z0-9]{4,64})$/
const MAX_QR_BYTES = 200_000

export function encodeQrImage(bytes, contentType) {
  const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? [])
  if (raw.length === 0 || raw.length > MAX_QR_BYTES) return null
  const type = String(contentType ?? '').toLowerCase()
  const kind = type.includes('png') ? 'image/png' : type.includes('svg') ? 'image/svg+xml' : ''
  if (kind === 'image/png') {
    if (raw[0] !== 0x89 || raw[1] !== 0x50 || raw[2] !== 0x4e || raw[3] !== 0x47) return null
  } else if (kind === 'image/svg+xml') {
    const head = new TextDecoder().decode(raw.subarray(0, 200)).trimStart()
    if (!head.startsWith('<svg') && !head.startsWith('<?xml')) return null
  } else {
    return null
  }
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < raw.length; index += chunk) binary += String.fromCharCode(...raw.subarray(index, index + chunk))
  return `data:${kind};base64,${btoa(binary)}`
}

export function readClinicQr(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : payload ? [payload] : []
  for (const row of rows) {
    const deepLink = String(row?.deep_link_url ?? '')
    const imageUrl = String(row?.qr_image_url ?? '')
    if (CLINIC_LINK.test(deepLink) && imageUrl.startsWith('https://')) return { deepLink, imageUrl }
  }
  return null
}

export async function beginClinicQr({ routes, routeError, clinicId, token, qrTransport }) {
  const decision = routeQueryResult({ error: routeError, data: routes }, clinicId)
  if (!decision.ok) return { status: decision.status, body: { error: decision.error, connected: false } }
  if (!token) return { status: 503, body: { error: 'whatsapp_token_unconfigured', connected: false } }
  try {
    const result = await qrTransport({ phoneNumberId: decision.route.phoneNumberId })
    const image = typeof result?.image === 'string' && result.image.startsWith('data:image/') ? result.image : ''
    const deepLink = CLINIC_LINK.test(result?.deepLink ?? '') ? result.deepLink : ''
    if (!image || !deepLink) return { status: 502, body: { error: 'upstream', connected: false } }
    return { status: 200, body: { connected: false, deepLink, image } }
  } catch (error) {
    if (error?.code === 'token_expired') return { status: 401, body: { error: 'token_expired', connected: false } }
    return { status: 502, body: { error: 'upstream', connected: false } }
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
