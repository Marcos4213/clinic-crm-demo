const DIGITS = /^[0-9]{6,32}$/
const CONFIG_ID = /^[0-9]{8,32}$/
const EVENTS = new Set(['FINISH', 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'])

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
  if (!EVENTS.has(event)) return { ok: false, status: 400, error: 'signup_incomplete' }
  if (!DIGITS.test(String(phoneNumberId ?? '')) || !DIGITS.test(String(wabaId ?? ''))) {
    return { ok: false, status: 400, error: 'signup_incomplete' }
  }
  if (typeof code !== 'string' || code.length < 8 || code.length > 512 || /[\s:/]/.test(code)) {
    return { ok: false, status: 400, error: 'signup_incomplete' }
  }
  return { ok: true }
}

export function readTokenExchange(payload) {
  const token = payload?.access_token
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) return null
  return { accessToken: token }
}
