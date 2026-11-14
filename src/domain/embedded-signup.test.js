import { describe, expect, it } from 'vitest'
import { embeddedSignupOptions, readSignupSession } from './embedded-signup.js'

describe('embedded signup session', () => {
  it('asks Meta to connect the WhatsApp already on the phone', () => {
    const options = embeddedSignupOptions({ configId: '900000000000001' })
    expect(options.response_type).toBe('code')
    expect(options.extras).toEqual({ setup: {}, featureType: 'whatsapp_business_app_onboarding' })
    expect(options.extras.sessionInfoVersion).toBeUndefined()
  })

  it('reads the official finish event and ignores a wa.me page', () => {
    const finish = readSignupSession(
      JSON.stringify({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
        data: { phone_number_id: '8100000000000001', waba_id: '8200000000000001' },
      }),
      'https://www.facebook.com',
    )
    expect(finish).toMatchObject({ done: true, coexistence: true, phoneNumberId: '8100000000000001' })
    const phoneLater = readSignupSession(
      JSON.stringify({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
        data: { waba_id: '8200000000000001' },
      }),
      'https://business.facebook.com',
    )
    expect(phoneLater).toMatchObject({ done: true, phoneNumberId: '', wabaId: '8200000000000001' })
    expect(readSignupSession('https://wa.me/5511999999999', 'https://wa.me')).toBeNull()
    expect(readSignupSession(JSON.stringify({ type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL' }), 'https://facebook.com').done).toBe(false)
    const camel = readSignupSession(
      {
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'finish_whatsapp_business_app_onboarding',
        data: { phoneNumberId: '8100000000000001', wabaId: '8200000000000001' },
      },
      'https://www.facebook.com',
    )
    expect(camel).toMatchObject({ done: true, coexistence: true, event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', phoneNumberId: '8100000000000001', wabaId: '8200000000000001' })
  })
})
