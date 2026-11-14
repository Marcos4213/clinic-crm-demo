import { describe, expect, it } from 'vitest'
import { signupFailureMessage } from './meta-signup.js'

const catalog = {
  upstream: 'A Meta não autorizou o número. Nada foi marcado como conectado.',
  token_expired: 'O código da Meta expirou. Toque em Conectar WhatsApp de novo.',
}

describe('signupFailureMessage', () => {
  it('keeps the base text when Meta does not return a step', () => {
    expect(signupFailureMessage({ error: 'upstream' }, catalog, 'falhou')).toBe(catalog.upstream)
  })

  it('appends the Graph step and error codes for the UI', () => {
    expect(
      signupFailureMessage(
        { error: 'upstream', step: 'exchange_code', metaCode: 100, metaSubcode: 36008 },
        catalog,
        'falhou',
      ),
    ).toBe('A Meta não autorizou o número. Nada foi marcado como conectado. (exchange_code, código 100/36008)')
  })
})
