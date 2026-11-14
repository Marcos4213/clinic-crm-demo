const DIGITS = /^[0-9]{6,32}$/
const CONFIG_ID = /^[0-9]{8,32}$/
const EVENTS = new Set(['FINISH', 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', 'CODE_ONLY'])

export function publicSignupConfig({ appId, appSecret, configId, coexistence }) {
  const ready = DIGITS.test(String(appId ?? '')) && String(appSecret ?? '').length >= 20 && CONFIG_ID.test(String(configId ?? ''))
  if (!ready) return { configured: false, connected: false }
  return {
    configured: true,
    connected: false,
    appId: String(appId),
    configId: String(configId),
    graphVersion: 'v27.0',
    coexistence: coexistence === true,
  }
}

export function beginSignup({ role, code, phoneNumberId, wabaId, event }) {
  if (role !== 'owner') return { ok: false, status: 403, error: 'forbidden' }
  event = String(event ?? '').toUpperCase()
  if (event === 'CANCEL' || event === 'ERROR' || !EVENTS.has(event)) return { ok: false, status: 400, error: 'signup_incomplete' }
  if (typeof code !== 'string' || code.length < 8 || code.length > 512 || /[\s:/]/.test(code)) {
    return { ok: false, status: 400, error: 'signup_incomplete' }
  }
  const phone = String(phoneNumberId ?? '')
  const waba = String(wabaId ?? '')
  if ((phone && !DIGITS.test(phone)) || (waba && !DIGITS.test(waba))) return { ok: false, status: 400, error: 'signup_incomplete' }
  return { ok: true, needsDiscovery: !DIGITS.test(phone) || !DIGITS.test(waba) }
}

export function wabaIdsFromDebug(debug) {
  const scopes = Array.isArray(debug?.data?.granular_scopes) ? debug.data.granular_scopes : []
  const ids = []
  for (const scope of scopes) {
    if (scope?.scope !== 'whatsapp_business_management' && scope?.scope !== 'whatsapp_business_messaging') continue
    for (const id of scope.target_ids ?? []) {
      const value = String(id)
      if (DIGITS.test(value) && !ids.includes(value)) ids.push(value)
    }
  }
  return ids
}

export function selectDiscoveredNumber({ debug, phonesByWaba = {}, preferredPhone = '', preferredWaba = '' }) {
  const preferredPhoneOk = DIGITS.test(String(preferredPhone))
  const preferredWabaOk = DIGITS.test(String(preferredWaba))
  const wabas = wabaIdsFromDebug(debug)
  if (preferredWabaOk && !wabas.includes(String(preferredWaba))) wabas.unshift(String(preferredWaba))
  const phones = []
  for (const wabaId of wabas) {
    const rows = Array.isArray(phonesByWaba[wabaId]) ? phonesByWaba[wabaId] : []
    for (const row of rows) {
      const phoneNumberId = String(row?.id ?? '')
      if (DIGITS.test(phoneNumberId)) phones.push({ wabaId, phoneNumberId })
    }
  }
  if (preferredPhoneOk) {
    const match = phones.find((item) => item.phoneNumberId === String(preferredPhone))
    if (match) return { ok: true, ...match }
    if (preferredWabaOk) return { ok: true, wabaId: String(preferredWaba), phoneNumberId: String(preferredPhone) }
  }
  if (phones.length === 1) return { ok: true, ...phones[0] }
  if (phones.length > 1) return { ok: false, error: 'multiple_numbers' }
  return { ok: false, error: 'number_not_returned' }
}

export function readTokenExchange(payload) {
  const token = payload?.access_token
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) return null
  return { accessToken: token }
}

export function describeAccessToken(debugPayload) {
  const data = debugPayload?.data ?? {}
  const type = String(data.type ?? 'UNKNOWN') || 'UNKNOWN'
  const expiresAt = Number(data.expires_at ?? 0)
  const longLived = !Number.isFinite(expiresAt) || expiresAt <= 0 || expiresAt * 1000 > Date.now() + 7 * 24 * 60 * 60 * 1000
  const shouldExchange = !longLived && /user/i.test(type) && !/system/i.test(type)
  return {
    longLived,
    shouldExchange,
    type,
    expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? new Date(expiresAt * 1000).toISOString() : null,
  }
}

export function shouldRegisterPhone({ coexistence, alreadyRegistered, pin }) {
  if (coexistence === true) return { action: 'skip', reason: 'coexistence' }
  if (alreadyRegistered === true) return { action: 'skip', reason: 'already_registered' }
  if (!/^[0-9]{6}$/.test(String(pin ?? ''))) return { action: 'needs_pin', reason: 'pin_required' }
  return { action: 'register' }
}

const ALREADY_REGISTERED = new Set([133015, '133015'])

export function interpretRegisterResponse({ ok, errorCode }) {
  if (ok === true) return { ok: true }
  if (ALREADY_REGISTERED.has(errorCode) || ALREADY_REGISTERED.has(String(errorCode ?? ''))) return { ok: true }
  return { ok: false }
}

export function signupStatusAfterHooks({ stored, subscribedOk, registerResult, currentState }) {
  if (!stored) return { state: 'error', detail: 'O cadastro não foi gravado.' }
  if (!subscribedOk) {
    return { state: 'error', detail: 'Cadastro gravado. A inscrição do webhook na Meta falhou.' }
  }
  if (currentState === 'connected') {
    return { state: 'connected', detail: 'Canal já conectado. Cadastro atualizado.' }
  }
  if (registerResult === 'needs_pin') {
    return { state: 'pending', detail: 'Webhook inscrito. Falta registrar o número com o PIN de duas etapas.' }
  }
  if (registerResult === 'failed') {
    return { state: 'pending', detail: 'Webhook inscrito. O registro do número na Cloud API não concluiu.' }
  }
  return { state: 'pending', detail: 'Cadastro Meta recebido. Aguardando a primeira mensagem da paciente.' }
}

export function clinicDiagnostics({ route, lastInboundAt, subscribedAppsOk, hasToken, graphVersion, state } = {}) {
  return {
    routePresent: Boolean(route?.phoneNumberId || route === true),
    lastInboundAt: lastInboundAt || null,
    subscribedAppsOk: subscribedAppsOk === true,
    tokenPresent: hasToken === true,
    graphVersion: graphVersion || 'v27.0',
    state: state || 'unconfigured',
  }
}

export function readPhoneRegistration(payload) {
  const platform = String(payload?.platform_type ?? payload?.platformType ?? '').toUpperCase()
  const status = String(payload?.code_verification_status ?? payload?.codeVerificationStatus ?? '').toUpperCase()
  return platform === 'CLOUD_API' || status === 'VERIFIED'
}
