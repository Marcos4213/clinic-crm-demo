import { describe, expect, it } from 'vitest'
import { readWhatsappQr } from './whatsapp-qr.js'

describe('readWhatsappQr', () => {
  it('keeps a clinic phone and a WhatsApp QR link', () => {
    expect(readWhatsappQr('https://wa.me/5511988887777')).toEqual({ href: 'https://wa.me/5511988887777' })
    expect(readWhatsappQr('https://api.whatsapp.com/send?phone=5511988887777')).toEqual({ href: 'https://wa.me/5511988887777' })
    expect(readWhatsappQr('whatsapp://send?phone=5511988887777')).toEqual({ href: 'https://wa.me/5511988887777' })
    expect(readWhatsappQr('https://wa.me/qr/ClinicaEstetica01')).toEqual({ href: 'https://wa.me/qr/ClinicaEstetica01' })
  })

  it('rejects anything that is not the clinic WhatsApp QR', () => {
    expect(readWhatsappQr('Estetica')).toBeNull()
    expect(readWhatsappQr('https://evil.example/wa.me/5511988887777')).toBeNull()
    expect(readWhatsappQr('javascript:alert(1)')).toBeNull()
    expect(readWhatsappQr('https://wa.me/qr/bad code')).toBeNull()
    expect(readWhatsappQr('https://wa.me/5511988887777?text=oi')).toBeNull()
  })
})