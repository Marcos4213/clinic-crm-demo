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
