const DIGITS = /^[0-9]{6,32}$/

export function embeddedSignupOptions(config) {
  const extras = { setup: {} }
  if (config.coexistence) extras.featureType = 'whatsapp_business_app_onboarding'
  return {
    config_id: config.configId,
    response_type: 'code',
    override_default_response_type: true,
    extras,
  }
}

export function readSignupSession(data, origin) {
  let host = ''
  try {
    host = new URL(origin).hostname
  } catch {
    return null
  }
  if (host !== 'facebook.com' && !host.endsWith('.facebook.com')) return null
  let payload = data
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return null
  const event = payload.event
  const phoneNumberId = String(payload.data?.phone_number_id ?? '')
  const wabaId = String(payload.data?.waba_id ?? '')
  const done = (event === 'FINISH' || event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') && DIGITS.test(phoneNumberId) && DIGITS.test(wabaId)
  return {
    event,
    done,
    phoneNumberId: done ? phoneNumberId : '',
    wabaId: done ? wabaId : '',
    coexistence: event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  }
}
