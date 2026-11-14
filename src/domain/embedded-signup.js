const DIGITS = /^[0-9]{6,32}$/

export function embeddedSignupOptions(config) {
  return {
    config_id: config.configId,
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: 'whatsapp_business_app_onboarding',
    },
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
  const event = String(payload.event ?? '').toUpperCase()
  const phoneNumberId = String(payload.data?.phone_number_id ?? payload.data?.phoneNumberId ?? '')
  const wabaId = String(payload.data?.waba_id ?? payload.data?.wabaId ?? '')
  const phoneOk = DIGITS.test(phoneNumberId)
  const wabaOk = DIGITS.test(wabaId)
  const coexistence = event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
  const done = (event === 'FINISH' && phoneOk && wabaOk) || (coexistence && wabaOk)
  return {
    event,
    done,
    cancelled: event === 'CANCEL' || event === 'ERROR',
    phoneNumberId: phoneOk ? phoneNumberId : '',
    wabaId: wabaOk ? wabaId : '',
    coexistence,
  }
}
