/**
 * Apresentação do Plantão para imobiliárias. Página estática, sem login.
 * O único CTA abre o WhatsApp do Marcos (mesmo número da apresentação das clínicas).
 */
import { WHATSAPP_E164 } from '../apresentacao/config.js'

export const PLANTAO_WHATSAPP = WHATSAPP_E164

export const PLANTAO_CTA_TEXT =
  'Oi, Marcos! Vi a página do Plantão e quero entender o Programa Plantão 90 pra minha imobiliária.'

export function plantaoHref(phone = PLANTAO_WHATSAPP, text = PLANTAO_CTA_TEXT) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
