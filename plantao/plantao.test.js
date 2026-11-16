import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WHATSAPP_E164 } from '../apresentacao/config.js'
import { PLANTAO_CTA_TEXT, plantaoHref } from './config.js'

const html = readFileSync(join(process.cwd(), 'plantao', 'index.html'), 'utf8')
const text = html.replace(/<[^>]+>/g, ' ')

describe('apresentação do Plantão', () => {
  it('CTA aponta pro WhatsApp do Marcos, igual ao da página das clínicas', () => {
    const href = plantaoHref()
    expect(href).toBe(`https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(PLANTAO_CTA_TEXT)}`)
    expect(html.split(href.replaceAll('&', '&amp;')).length - 1).toBe(3)
  })

  it('não inventa preço, depoimento, garantia nem usa placeholder de gênero', () => {
    expect(text).not.toMatch(/R\$|depoimento|garantia|o\(a\)|a\(o\)/i)
  })

  it('rejeita telefone inválido', () => {
    expect(plantaoHref('123')).toBe('')
  })

  it('a demonstração é marcada como exemplo', () => {
    expect(text).toMatch(/Exemplo ilustrativo/)
    expect(text).toMatch(/Não é um cliente real/)
  })
})
