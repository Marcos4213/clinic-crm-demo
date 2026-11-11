import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MARCOS_PARTS,
  NICHES,
  PATIENT_FILES,
  PATIENT_LINES,
  WHATSAPP_E164,
  buildThread,
  cleanClinic,
  cleanPhone,
  pageModel,
  resolveNiche,
  whatsappHref,
} from './config.js'

const root = join(process.cwd(), 'apresentacao')
const source = ['index.html', 'apresentacao.css', 'apresentacao.js', 'config.js']
  .map((name) => readFileSync(join(root, name), 'utf8'))
  .join('\n')

function mp3Duration(buffer) {
  let offset = 0
  if (buffer.toString('latin1', 0, 3) === 'ID3' && buffer.length > 10) {
    const size =
      ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f)
    offset = 10 + size
  }
  const bitrateMpeg1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
  const bitrateMpeg2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
  const rateMpeg1 = [44100, 48000, 32000]
  const rateMpeg2 = [22050, 24000, 16000]
  const rateMpeg25 = [11025, 12000, 8000]
  let samples = 0
  let sampleRate = 0
  let frames = 0
  while (offset + 4 < buffer.length && frames < 20000) {
    if (buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1
      continue
    }
    const header = buffer.readUInt32BE(offset)
    const version = (header >> 19) & 3
    const layer = (header >> 17) & 3
    const bitrateIndex = (header >> 12) & 0xf
    const sampleIndex = (header >> 10) & 3
    const padding = (header >> 9) & 1
    if (layer !== 1 || version === 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) {
      offset += 1
      continue
    }
    const mpeg1 = version === 3
    const bitrate = (mpeg1 ? bitrateMpeg1 : bitrateMpeg2)[bitrateIndex] * 1000
    const rate = mpeg1 ? rateMpeg1[sampleIndex] : version === 2 ? rateMpeg2[sampleIndex] : rateMpeg25[sampleIndex]
    const frameSamples = mpeg1 ? 1152 : 576
    const frameLength = Math.floor(((frameSamples / 8) * bitrate) / rate) + padding
    if (frameLength < 8) {
      offset += 1
      continue
    }
    frames += 1
    samples += frameSamples
    sampleRate = rate
    offset += frameLength
  }
  if (!frames || !sampleRate) throw new Error('mp3 sem quadros')
  return samples / sampleRate
}

describe('apresentação', () => {
  it('ships without a placeholder phone number and documents the override', () => {
    expect(WHATSAPP_E164).toBe('')
    expect(source).toMatch(/WHATSAPP_E164/)
    expect(source).toMatch(/\?whatsapp=/)
    expect(source).toMatch(/DDI/)
    expect(readFileSync(join(root, 'config.js'), 'utf8')).not.toMatch(/5511\d{8,}/)
  })

  it('keeps the copy rules and stays independent of the app', () => {
    const scrubbed = source.replace(/clínica/gi, '')
    expect(scrubbed).not.toMatch(/cliente/i)
    expect(source).not.toMatch(/faturamento|depoimento|garantimos|últimas vagas|por mês|R\$|supabase/i)
    expect(source).not.toMatch(/autoplay/i)
    expect(source).toMatch(/paciente/)
    expect(source).toMatch(/nossa equipe/i)
    expect(source).toMatch(/demonstração ilustrativa/i)
    expect(source).toMatch(/Marcar uma conversa com o doutor/)
    expect(source).toMatch(/A próxima começa em seguida/)
    expect(source).toMatch(/marcos-1\.mp3/)
    expect(source).toMatch(/marcos-3\.mp3/)
    expect(source).not.toMatch(/narração gerada/i)
    expect(source).toMatch(/paciente-implantes\.mp3/)
    expect(source).toMatch(/paciente-dermato\.mp3/)
    expect(source).toMatch(/og:title/)
    expect(source).toMatch(/https:\/\/marcos4213\.github\.io\/clinic-crm-demo\/apresentacao\/og\.png/)
    for (const label of ['Resposta 24h', 'Qualificação', 'Agendamento', 'Lembrete', 'Recuperação']) {
      expect(source).toContain(label)
    }
    expect(existsSync(join(process.cwd(), 'public', 'apresentacao'))).toBe(false)
  })

  it('publishes the page only through the Pages workflow', () => {
    const workflow = readFileSync(join(process.cwd(), '.github/workflows/pages.yml'), 'utf8')
    expect(workflow).toMatch(/dist\/apresentacao/)
    expect(workflow).toMatch(/apresentacao\/audio/)
    expect(workflow).not.toMatch(/narracao\.mp3/)
    expect(workflow).toMatch(/apresentacao\/index\.html/)
    expect(workflow).not.toMatch(/cloudflare/i)
  })

  it('reads niche, clinic and an optional whatsapp number from the url', () => {
    expect(resolveNiche('')).toBe('implantes')
    expect(resolveNiche('harmonização')).toBe('harmonizacao')
    expect(resolveNiche('Lentes de contato dental')).toBe('lentes')
    expect(resolveNiche('Cirurgia Plástica')).toBe('plastica')
    expect(resolveNiche('derma')).toBe('dermatologia')
    expect(resolveNiche('botox')).toBe('implantes')
    expect(cleanClinic('  Clínica <Aurora>  ')).toBe('Clínica Aurora')
    expect(cleanClinic('!!!')).toBe('')
    expect(cleanClinic('A'.repeat(80))).toHaveLength(42)
    expect(cleanPhone('+55 (11) 90000-0000')).toBe('5511900000000')
    expect(cleanPhone('123')).toBe('')
    expect(cleanPhone('nao-e-numero')).toBe('')

    const model = pageModel('?nicho=dermatologia&clinica=Pele%20Viva&whatsapp=5511900000000')
    expect(model.niche).toBe('dermatologia')
    expect(model.header).toBe('Pele Viva')
    expect(model.kicker).toBe('Para a equipe da Pele Viva mostrar ao doutor')
    expect(model.place).toBe('da Pele Viva')
    expect(model.initial).toBe('P')
    expect(model.href).toMatch(/^https:\/\/wa\.me\/5511900000000\?text=/)
    expect(decodeURIComponent(model.href.split('text=')[1])).toMatch(/WhatsApp da Pele Viva/)
    expect(decodeURIComponent(model.href.split('text=')[1])).toMatch(/doutor/)
    expect(model.thread.some((step) => step.text?.includes('a equipe da Pele Viva'))).toBe(true)
    expect(model.thread.some((step) => step.kind === 'typing')).toBe(true)

    const plain = pageModel('')
    expect(plain.href).toBe('')
    expect(plain.header).toBe('Sua clínica')
    expect(plain.thread.some((step) => step.text?.includes('a nossa equipe'))).toBe(true)
    expect(whatsappHref('abc', 'Aurora')).toBe('')
    expect(pageModel('', '5511988887777').href).toMatch(/^https:\/\/wa\.me\/5511988887777\?text=/)
    expect(pageModel('?whatsapp=abc', '5511988887777').phone).toBe('5511988887777')
  })

  it('adapts every niche and keeps the five movements', () => {
    expect(NICHES.map((niche) => niche.id)).toEqual(['implantes', 'lentes', 'harmonizacao', 'plastica', 'dermatologia'])
    for (const niche of NICHES) {
      const thread = buildThread(niche.id, '')
      const labels = thread.filter((step) => step.kind === 'status').map((step) => step.text)
      expect(labels).toEqual(['Resposta 24h', 'Qualificação', 'Agendamento', 'Lembrete', 'Recuperação'])
      expect(thread.some((step) => step.kind === 'typing')).toBe(true)
      expect(thread.some((step) => step.text === 'Véspera')).toBe(true)
      expect(thread.some((step) => step.text === 'Sem resposta')).toBe(true)
    }
    expect(buildThread('lentes', '')[0].text).toBe(PATIENT_LINES.lentes)
    expect(buildThread('plastica', 'Aurora').some((step) => step.text?.includes('na Aurora'))).toBe(true)
    expect(buildThread('implantes', '').some((step) => step.text?.includes('implante'))).toBe(true)
  })

  it('plays the patient audios and the three Marcos recordings', () => {
    expect(MARCOS_PARTS).toEqual(['marcos-1.mp3', 'marcos-2.mp3', 'marcos-3.mp3'])
    const marcosDurations = MARCOS_PARTS.map((name) => mp3Duration(readFileSync(join(root, 'audio', name))))
    expect(marcosDurations[0]).toBeGreaterThan(30)
    expect(marcosDurations[0]).toBeLessThan(36)
    expect(marcosDurations[1]).toBeGreaterThan(29)
    expect(marcosDurations[1]).toBeLessThan(35)
    expect(marcosDurations[2]).toBeGreaterThan(19)
    expect(marcosDurations[2]).toBeLessThan(25)
    expect(existsSync(join(root, 'narracao.mp3'))).toBe(false)
    const guide = readFileSync(join(root, 'audio', 'LEIA-ME.md'), 'utf8')
    expect(guide).toMatch(/marcos-1\.mp3/)
    expect(guide).toMatch(/Ao terminar uma, a próxima começa/)
    const names = readdirSync(join(root, 'audio'))
    for (const [niche, file] of Object.entries(PATIENT_FILES)) {
      expect(names).toContain(file)
      expect(buildThread(niche, '')[0]).toMatchObject({ kind: 'voice', file, text: PATIENT_LINES[niche] })
      expect(buildThread(niche, '').some((step) => step.text?.includes('Ouvi seu áudio'))).toBe(true)
      const audio = readFileSync(join(root, 'audio', file))
      expect(audio.length).toBeGreaterThan(20_000)
      const duration = mp3Duration(audio)
      expect(duration).toBeGreaterThanOrEqual(3)
      expect(duration).toBeLessThanOrEqual(8)
    }
  })
})
