import { describe, expect, it, vi } from 'vitest'
import {
  assertNoRedirectUri,
  isExpiredSignupCode,
  logGraphFailure,
  publicUpstreamBody,
  readGraphError,
  redactSecretText,
  tokenExchangeUrl,
} from './graph.js'

describe('graph error redaction and public body', () => {
  it('redacts tokens, codes and phone numbers but keeps a Meta error message', () => {
    const raw =
      'Error validating access_token=EAAGHsecretvaluehereplusmorechars and code AQB' +
      'x'.repeat(40) +
      ' for +55 11 99999-0000'
    const clean = redactSecretText(raw)
    expect(clean).toContain('Error validating')
    expect(clean).not.toMatch(/EAAGH|AQBx{10,}|99999-0000|access_token=EAA/)
    expect(clean).toMatch(/\[redacted/)
  })

  it('parses Meta error fields and returns only safe public details', () => {
    const graphError = readGraphError(
      {
        error: {
          message: 'Invalid access_token=EAAB' + 'y'.repeat(30),
          type: 'OAuthException',
          code: 100,
          error_subcode: 36008,
          fbtrace_id: 'AaBbTrace123',
        },
      },
      400,
    )
    expect(graphError).toMatchObject({
      httpStatus: 400,
      metaCode: 100,
      metaSubcode: 36008,
      metaType: 'OAuthException',
      fbtraceId: 'AaBbTrace123',
    })
    expect(graphError.metaMessage).not.toMatch(/EAAB/)
    expect(graphError.metaMessage).toMatch(/Invalid/)
    const body = publicUpstreamBody('exchange_code', graphError)
    expect(body).toEqual({
      error: 'upstream',
      step: 'exchange_code',
      connected: false,
      metaCode: 100,
      metaSubcode: 36008,
      fbtraceId: 'AaBbTrace123',
    })
    expect(JSON.stringify(body)).not.toMatch(/access_token|EAAB|secret/i)
  })

  it('logs a structured line without tokens', () => {
    const warn = vi.fn()
    const graphError = readGraphError(
      { error: { message: 'Session has expired', type: 'OAuthException', code: 190, fbtrace_id: 'tr1' } },
      401,
    )
    expect(isExpiredSignupCode(graphError)).toBe(true)
    const line = logGraphFailure('debug_token', graphError, { warn })
    expect(warn).toHaveBeenCalledOnce()
    expect(line).toContain('"step":"debug_token"')
    expect(line).toContain('"metaCode":190')
    expect(line).toContain('"fbtrace_id":"tr1"')
    expect(line).not.toMatch(/EAA|client_secret|access_token=/i)
  })
})

describe('embedded signup token exchange request', () => {
  it('uses GET /oauth/access_token and never sends redirect_uri', () => {
    const url = tokenExchangeUrl({
      graphVersion: 'v27.0',
      appId: '2217879795749408',
      appSecret: 'test_secret_value_not_real',
      code: 'AQBhlX_test_code_value',
    })
    expect(url.pathname).toBe('/v27.0/oauth/access_token')
    expect(url.searchParams.get('client_id')).toBe('2217879795749408')
    expect(url.searchParams.get('code')).toBe('AQBhlX_test_code_value')
    expect(url.searchParams.has('client_secret')).toBe(true)
    expect(assertNoRedirectUri(url)).toBe(true)
    expect(url.searchParams.has('redirect_uri')).toBe(false)
  })
})
