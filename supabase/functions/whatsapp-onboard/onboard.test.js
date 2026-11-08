import { describe, expect, it } from 'vitest'
import { beginSignup, publicSignupConfig, readTokenExchange } from './onboard.js'

const code = 'AQExampleCodeValue'
const phone = '8100000000000001'
const waba = '8200000000000001'

describe('embedded signup', () => {
  it('stays unconfigured and disconnected until the Meta config id exists', () => {
    expect(publicSignupConfig({ appId: '8300000000000001', appSecret: 'x'.repeat(32), configId: '' })).toEqual({
      configured: false,
      connected: false,
    })
    const ready = publicSignupConfig({
      appId: '8300000000000001',
      appSecret: 'x'.repeat(32),
      configId: '900000000000001',
      coexistence: true,
    })
    expect(ready).toMatchObject({ configured: true, connected: false, coexistence: true, configId: '900000000000001' })
    expect(JSON.stringify(ready)).not.toMatch(/secret|token/i)
  })

  it('refuses staff, a cancelled popup, and a contact link before any token exchange', () => {
    expect(beginSignup({ role: 'staff', code, phoneNumberId: phone, wabaId: waba, event: 'FINISH' }).status).toBe(403)
    expect(beginSignup({ role: 'owner', code, phoneNumberId: phone, wabaId: waba, event: 'CANCEL' }).error).toBe('signup_incomplete')
    expect(beginSignup({ role: 'owner', code: 'https://wa.me/5511999999999', phoneNumberId: phone, wabaId: waba, event: 'FINISH' }).ok).toBe(false)
    expect(beginSignup({ role: 'owner', code, phoneNumberId: phone, wabaId: waba, event: 'FINISH' }).ok).toBe(true)
    expect(beginSignup({ role: 'owner', code, phoneNumberId: phone, wabaId: waba, event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' }).ok).toBe(true)
  })

  it('accepts only an access token and never echoes it into a success flag', () => {
    expect(readTokenExchange({})).toBeNull()
    expect(readTokenExchange({ access_token: 'short' })).toBeNull()
    const token = readTokenExchange({ access_token: 'EAA'.padEnd(40, 'x') })
    expect(token.accessToken.startsWith('EAA')).toBe(true)
    expect(JSON.stringify({ connected: false, stored: true })).not.toMatch(token.accessToken)
  })
})
