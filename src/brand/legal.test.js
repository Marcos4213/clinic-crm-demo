import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEGAL_CNPJ, LEGAL_FOOTER_LINE, LEGAL_RAZAO_SOCIAL } from './legal'

const files = [
  'index.html',
  'public/privacidade.html',
  'public/termos.html',
  'public/exclusao-de-dados.html',
  'apresentacao/index.html',
]

describe('legal identification on static pages', () => {
  it('keeps the official footer line stable', () => {
    expect(LEGAL_FOOTER_LINE).toBe(
      'Automatize.app é um produto da DevBrasil · 60.095.721 MARCOS PAULO DA SILVA · CNPJ 60.095.721/0001-54 · Barueri/SP · devbrasil.devbr@gmail.com',
    )
  })

  for (const file of files) {
    it(`${file} publishes razão social and CNPJ`, () => {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source).toContain(LEGAL_RAZAO_SOCIAL)
      expect(source).toContain(LEGAL_CNPJ)
      expect(source).not.toMatch(/Não incluímos CNPJ|Não publicamos CNPJ/)
    })
  }
})
