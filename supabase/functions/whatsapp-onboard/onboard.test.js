import { describe, expect, it } from 'vitest'
import { beginSignup, clinicDiagnostics, describeAccessToken, interpretRegisterResponse, publicSignupConfig, readTokenExchange, selectDiscoveredNumber, shouldRegisterPhone, signupStatusAfterHooks } from './onboard.js'

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
    expect(beginSignup({ role: 'owner', code, phoneNumberId: '', wabaId: waba, event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' }).needsDiscovery).toBe(true)
    expect(beginSignup({ role: 'owner', code, phoneNumberId: '', wabaId: '', event: 'CODE_ONLY' }).needsDiscovery).toBe(true)
    expect(beginSignup({ role: 'owner', code, phoneNumberId: '', wabaId: '', event: 'FINISH' }).needsDiscovery).toBe(true)
  })

  it('finds the single phone returned by Meta when the popup omits it', () => {
    const debug = {
      data: {
        granular_scopes: [
          { scope: 'whatsapp_business_management', target_ids: [waba] },
          { scope: 'whatsapp_business_messaging', target_ids: [waba] },
        ],
      },
    }
    expect(selectDiscoveredNumber({ debug, phonesByWaba: { [waba]: [{ id: phone }] } })).toEqual({
      ok: true,
      wabaId: waba,
      phoneNumberId: phone,
    })
    expect(selectDiscoveredNumber({ debug, phonesByWaba: { [waba]: [{ id: phone }, { id: '8300000000000001' }] } }).error).toBe('multiple_numbers')
    expect(selectDiscoveredNumber({ debug, phonesByWaba: {} }).error).toBe('number_not_returned')
    expect(JSON.stringify(selectDiscoveredNumber({ debug, phonesByWaba: { [waba]: [{ id: phone }] } }))).not.toMatch(/EAA|secret/)
  })

  it('accepts only an access token and never echoes it into a success flag', () => {
    expect(readTokenExchange({})).toBeNull()
    expect(readTokenExchange({ access_token: 'short' })).toBeNull()
    const token = readTokenExchange({ access_token: 'EAA'.padEnd(40, 'x') })
    expect(token.accessToken.startsWith('EAA')).toBe(true)
    expect(JSON.stringify({ connected: false, stored: true })).not.toMatch(token.accessToken)
  })
})

describe('business token and register hooks', () => {
  it('treats a business integration system user token with no expiry as long-lived', () => {
    const described = describeAccessToken({ data: { type: 'SYSTEM_USER', expires_at: 0, is_valid: true } })
    expect(described).toMatchObject({ longLived: true, expiresAt: null, shouldExchange: false, type: 'SYSTEM_USER' })
    const short = describeAccessToken({ data: { type: 'USER', expires_at: Math.floor(Date.now() / 1000) + 3600, is_valid: true } })
    expect(short.longLived).toBe(false)
    expect(short.shouldExchange).toBe(true)
    expect(short.expiresAt).toBeTruthy()
  })

  it('registers a Cloud API number only with a 6-digit PIN and skips coexistence or an already registered line', () => {
    expect(shouldRegisterPhone({ coexistence: true, alreadyRegistered: false, pin: '123456' }).action).toBe('skip')
    expect(shouldRegisterPhone({ coexistence: false, alreadyRegistered: true, pin: '123456' }).action).toBe('skip')
    expect(shouldRegisterPhone({ coexistence: false, alreadyRegistered: false, pin: '' }).action).toBe('needs_pin')
    expect(shouldRegisterPhone({ coexistence: false, alreadyRegistered: false, pin: '12' }).action).toBe('needs_pin')
    expect(shouldRegisterPhone({ coexistence: false, alreadyRegistered: false, pin: '581063' }).action).toBe('register')
    expect(interpretRegisterResponse({ ok: true }).ok).toBe(true)
    expect(interpretRegisterResponse({ ok: false, errorCode: 133015 }).ok).toBe(true)
    expect(interpretRegisterResponse({ ok: false, errorCode: 133016 }).ok).toBe(false)
  })

  it('records webhook subscription failure as error and does not downgrade an already connected clinic', () => {
    expect(signupStatusAfterHooks({ stored: true, subscribedOk: false, registerResult: 'ok', currentState: 'pending' })).toMatchObject({
      state: 'error',
    })
    expect(signupStatusAfterHooks({ stored: true, subscribedOk: true, registerResult: 'ok', currentState: 'connected' }).state).toBe('connected')
    expect(signupStatusAfterHooks({ stored: true, subscribedOk: true, registerResult: 'needs_pin', currentState: 'pending' }).state).toBe('pending')
    const pending = signupStatusAfterHooks({ stored: true, subscribedOk: true, registerResult: 'ok', currentState: 'pending' })
    expect(pending.state).toBe('pending')
    expect(pending.detail).not.toMatch(/cliente/i)
  })

  it('returns a diagnostic without tokens or patient content', () => {
    const report = clinicDiagnostics({
      route: { phoneNumberId: '1468451929686754' },
      lastInboundAt: '2026-11-14T12:00:00.000Z',
      subscribedAppsOk: true,
      hasToken: true,
      graphVersion: 'v27.0',
      state: 'connected',
    })
    expect(report).toEqual({
      routePresent: true,
      lastInboundAt: '2026-11-14T12:00:00.000Z',
      subscribedAppsOk: true,
      tokenPresent: true,
      graphVersion: 'v27.0',
      state: 'connected',
    })
    expect(clinicDiagnostics({}).routePresent).toBe(false)
    expect(JSON.stringify(report)).not.toMatch(/EAA|access_token|secret/i)
  })
})
