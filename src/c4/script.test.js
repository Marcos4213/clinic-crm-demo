import { describe, expect, it } from 'vitest'
import clinics from '../data/clinics.json'
import { C4_AGENT_NAME, C4_WHATSAPP_E164, showsClinicDemoAtRoot } from './config.js'
import { findClinic } from './clinics.js'
import { bookingHref, clinicPageUrl, forwardHref, forwardText, methodSteps, openingMessage, scriptedReply } from './script.js'
import { clinicSlug, isExcludedClinic } from './slug.js'

const atman = {
  slug: 'clinica-atman',
  name: 'Clínica Atman',
  city: 'Rio de Janeiro',
  procedure: 'avaliação para cirurgia plástica',
}

describe('clinic list', () => {
  it('publishes slug, name, city and procedure only', () => {
    expect(clinics.length).toBeGreaterThan(3)
    for (const clinic of clinics) {
      expect(Object.keys(clinic).sort()).toEqual(['city', 'name', 'procedure', 'slug'])
      expect(JSON.stringify(clinic)).not.toMatch(/\+55|telefone|phone/i)
    }
    expect(clinics.some((clinic) => /la vie/i.test(clinic.name))).toBe(false)
    expect(clinics.some((clinic) => /aurea|áurea/i.test(clinic.name))).toBe(false)
    expect(findClinic('clinica-atman')).toMatchObject(atman)
    expect(findClinic('ackermann-cirurgia-plastica')?.city).toBe('São Paulo')
    expect(findClinic('clinica-maison-regato')?.procedure).toBe('harmonização facial')
    expect(findClinic('nao-existe')).toBeNull()
  })

  it('builds a stable slug and keeps the excluded names out', () => {
    expect(clinicSlug('Clínica Atman')).toBe('clinica-atman')
    expect(clinicSlug("Clínica Lai'f")).toBe('clinica-laif')
    expect(isExcludedClinic('La Vie Clinic')).toBe(true)
    expect(isExcludedClinic('Instituto Aurea')).toBe(true)
    expect(isExcludedClinic('Instituto Áurea')).toBe(true)
    expect(isExcludedClinic('Instituto Belvedere: Dra. Helena Lima')).toBe(false)
  })
})

describe('scripted receptionist replies', () => {
  it('uses the clinic, asks, qualifies, offers an evaluation and never quotes a price', () => {
    const first = scriptedReply({ clinic: atman, text: 'Oi, queria saber da avaliação', turn: 1 })
    const second = scriptedReply({ clinic: atman, text: 'É a primeira vez', turn: 2 })
    const third = scriptedReply({ clinic: atman, text: 'Quero sim', turn: 3 })
    const later = scriptedReply({ clinic: atman, text: 'Pode pedir', turn: 4 })
    const price = scriptedReply({ clinic: atman, text: 'Quanto custa?', turn: 1 })

    for (const reply of [first, second, third, later, price]) {
      expect(reply.toLowerCase().replaceAll('c4', '')).not.toMatch(/cliente|o\(a\)|r\$|\d/)
      expect(reply).toMatch(/paciente|equipe|atendimento/)
    }
    expect(first).toMatch(new RegExp(C4_AGENT_NAME))
    expect(first).toMatch(/Clínica Atman/)
    expect(first).toMatch(/Rio de Janeiro/)
    expect(first).toMatch(/avaliação para cirurgia plástica/)
    expect(first).toMatch(/tratar/)
    expect(second).toMatch(/paciente/)
    expect(third).toMatch(/avaliação/)
    expect(third).toMatch(/equipe/)
    expect(later).toMatch(/lembrete/)
    expect(later).toMatch(/perto do horário/)
    expect(price).toMatch(/não passo preço/)
    expect(price).toMatch(/equipe/)
    expect(JSON.stringify(methodSteps(atman))).not.toMatch(/avaliação de avaliação/)
    expect(JSON.stringify(methodSteps(atman))).toMatch(/avaliação do atendimento/)
    expect(JSON.stringify(methodSteps(atman))).toMatch(new RegExp(C4_AGENT_NAME))
  })

  it('asks what to simulate when no clinic name is needed', () => {
    const opening = openingMessage({})
    const reply = scriptedReply({ clinic: {}, text: 'Oi', turn: 1 })
    expect(opening).toMatch(new RegExp(C4_AGENT_NAME))
    expect(opening).toMatch(/estética, odontologia ou cirurgia plástica/)
    expect(reply).toMatch(/procedimento/)
    expect(opening.toLowerCase()).not.toMatch(/cliente|o\(a\)/)
  })
})

describe('call to action links', () => {
  it('forwards the clinic page and books fifteen minutes with Marcos', () => {
    expect(clinicPageUrl('')).toBe('https://c4.devbrasil.online/')
    const url = clinicPageUrl('clinica-atman')
    expect(url).toBe('https://c4.devbrasil.online/#/c/clinica-atman')
    expect(forwardText('Clínica Atman', url)).toBe(
      'Dra., olha como ficaria o atendimento da Clínica Atman no WhatsApp: https://c4.devbrasil.online/#/c/clinica-atman',
    )
    const share = forwardHref('Clínica Atman', url)
    expect(share.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(share)).toContain('Dra., olha como ficaria o atendimento da Clínica Atman')

    const book = bookingHref('Clínica Atman')
    expect(book.startsWith(`https://wa.me/${C4_WHATSAPP_E164}?text=`)).toBe(true)
    expect(decodeURIComponent(book)).toContain('30 minutos')
    expect(decodeURIComponent(book)).toContain('Clínica Atman')
    expect(bookingHref('Clínica Atman', '')).toBe('')
    expect(showsClinicDemoAtRoot('c4.devbrasil.online')).toBe(true)
    expect(showsClinicDemoAtRoot('marcos4213.github.io')).toBe(false)
  })
})
