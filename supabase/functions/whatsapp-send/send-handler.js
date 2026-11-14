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

export function clinicFromRequest({ headerClinic = '', bodyClinic = '', queryClinic = '' }) {
  const ids = [headerClinic, bodyClinic, queryClinic].map((value) => String(value ?? '').trim()).filter(Boolean)
  const unique = new Set(ids.map((id) => id.toLowerCase()))
  if (unique.size > 1) return { ok: false, status: 403, error: 'forbidden' }
  return { ok: true, clinicId: ids[0] ?? '' }
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

export const OUTBOUND_RATE_MAX = 10

export function allowOutboundRate({ recentCount = 0, max = OUTBOUND_RATE_MAX } = {}) {
  if (Number(recentCount) >= Number(max)) return { ok: false, error: 'rate_limited' }
  return { ok: true }
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
  recentOutboundCount = 0,
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
  const rate = allowOutboundRate({ recentCount: recentOutboundCount })
  if (!rate.ok) return { status: 429, body: { error: rate.error } }
  if (!token) return { status: 503, body: { status: 'unconfigured', error: 'whatsapp_token_unconfigured' } }
  try {
    const result = await transport({ phoneNumberId: route.phoneNumberId })
    return { status: 200, body: { status: 'accepted', providerMessageId: result.id, delivered: false } }
  } catch (error) {
    if (error?.code === 'token_expired') return { status: 401, body: { error: 'token_expired', status: 'failed' } }
    return { status: 502, body: { error: 'upstream', status: 'failed' } }
  }
}

export function handleStatus({ route, token, lastInboundAt, now, integrationState }) {
  const window = canSendSessionText({ lastInboundAt, now })
  const state = integrationState || (route ? 'pending' : 'unconfigured')
  return {
    connected: state === 'connected',
    state,
    tokenConfigured: Boolean(token),
    canSend: Boolean(route && token && window.ok),
  }
}
