const TOKEN_PARAM = /\b(access_token|fb_exchange_token|client_secret|input_token|authorization_code)\b\s*[:=]\s*[^\s&,"]+/gi
const EAA_TOKEN = /\bEAA[A-Za-z0-9]+/g
const LONG_SECRET = /\b(?:AQB|EAA)[A-Za-z0-9_-]{16,}/g
const GENERIC_LONG = /\b[A-Za-z0-9_-]{80,}\b/g
const PHONE_LIKE = /\+?\d[\d\s()-]{8,}\d/g

export const GRAPH_STEPS = {
  exchange_code: 'exchange_code',
  debug_token: 'debug_token',
  discover: 'discover',
  subscribe: 'subscribe',
  register: 'register',
}

export function redactSecretText(value) {
  if (typeof value !== 'string' || !value) return ''
  return value
    .replace(TOKEN_PARAM, '$1=[redacted]')
    .replace(EAA_TOKEN, '[redacted-token]')
    .replace(LONG_SECRET, '[redacted]')
    .replace(GENERIC_LONG, '[redacted]')
    .replace(PHONE_LIKE, '[redacted-number]')
}

export function readGraphError(payload, httpStatus) {
  const err = payload?.error && typeof payload.error === 'object' ? payload.error : {}
  const message = typeof err.message === 'string' ? err.message : typeof payload === 'string' ? payload : ''
  return {
    httpStatus: Number.isFinite(httpStatus) ? httpStatus : null,
    metaCode: err.code ?? null,
    metaSubcode: err.error_subcode ?? null,
    metaType: typeof err.type === 'string' ? err.type : null,
    metaMessage: redactSecretText(String(message ?? '')),
    fbtraceId: typeof err.fbtrace_id === 'string' ? err.fbtrace_id : null,
  }
}

export function isExpiredSignupCode(graphError) {
  if (graphError?.metaCode === 190) return true
  const message = String(graphError?.metaMessage ?? '').toLowerCase()
  return /expired/.test(message) && /code|token/.test(message) || /already been used|code has been used/.test(message)
}

export function publicUpstreamBody(step, graphError, errorName = 'upstream') {
  const body = { error: errorName, step, connected: false }
  if (graphError?.metaCode != null) body.metaCode = graphError.metaCode
  if (graphError?.metaSubcode != null) body.metaSubcode = graphError.metaSubcode
  if (graphError?.fbtraceId) body.fbtraceId = graphError.fbtraceId
  return body
}

export function logGraphFailure(step, graphError, logger = console) {
  const line = JSON.stringify({
    source: 'whatsapp-onboard',
    step,
    httpStatus: graphError?.httpStatus ?? null,
    metaCode: graphError?.metaCode ?? null,
    metaSubcode: graphError?.metaSubcode ?? null,
    metaType: graphError?.metaType ?? null,
    metaMessage: graphError?.metaMessage || null,
    fbtrace_id: graphError?.fbtraceId ?? null,
  })
  logger.warn(line)
  return line
}

export function graphStepError(step, graphError, errorName = 'upstream') {
  const error = new Error('graph')
  error.step = step
  error.graphError = graphError
  error.errorName = errorName
  return error
}

export function readGraphStepError(error) {
  if (!error || typeof error !== 'object') return null
  if (typeof error.step !== 'string' || !error.graphError) return null
  return error
}

/** Official Embedded Signup exchange: GET /oauth/access_token, no redirect_uri. */
export function tokenExchangeUrl({ graphVersion, appId, appSecret, code }) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('code', code)
  return url
}

export async function readResponsePayload(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { error: { message: redactSecretText(text.slice(0, 180)), type: 'non_json' } }
  }
}

export function assertNoRedirectUri(url) {
  return !url.searchParams.has('redirect_uri')
}
