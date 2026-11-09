import { describe, expect, it } from 'vitest'
import { embeddedSignupOptions, readSignupSession } from './embedded-signup.js'

describe('embedded signup session', () => {
  it('asks Meta for the business login and enables coexistence only when configured', () => {
    const standard = embeddedSignupOptions({ configId: '900000000000001', coexistence: false })
    expect(standard.extras).toEqual({ setup: {} })
    expect(standard.response_type).toBe('code')
    expect(embeddedSignupOptions({ configId: '900000000000001', coexistence: true }).extras.featureType).toBe('whatsapp_business_app_onboarding')
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
    expect(readSignupSession('https://wa.me/5511999999999', 'https://wa.me')).toBeNull()
    expect(readSignupSession(JSON.stringify({ type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL' }), 'https://facebook.com').done).toBe(false)
  })
})
