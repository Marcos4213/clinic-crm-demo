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
  DEFAULT_BOOKING_PERCENT,
  FUNNEL,
  DEFAULT_UNANSWERED_PERCENT,
  clinicEstimate,
  estimateCopy,
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
  it('uses Marcos number and still allows a url override', () => {
    expect(WHATSAPP_E164).toBe('5511913221587')
    expect(source).toMatch(/WHATSAPP_E164/)
    expect(source).toMatch(/\?whatsapp=/)
    expect(source).toMatch(/DDI/)
    expect(source).toMatch(/5511913221587/)
  })

  it('keeps the copy rules and stays independent of the app', () => {
    const scrubbed = source.replace(/clínica/gi, '')
    expect(scrubbed).not.toMatch(/cliente/i)
    expect(source).not.toMatch(/depoimento|garantimos|últimas vagas|supabase/i)
    expect(source).not.toMatch(/class="dock"|wireDock/)
    expect(source).not.toMatch(/autoplay/i)
    expect(source).toMatch(/paciente/)
    expect(source).toMatch(/nossa equipe/i)
    expect(source).toMatch(/demonstração ilustrativa/i)
    expect(source).toMatch(/Agendar 15 minutos com o Marcos/)
    expect(source).toMatch(/Uma apresentação rápida do aplicativo por dentro, e de onde a clínica perde paciente hoje/)
    expect(source).toMatch(/A clínica perde paciente entre o primeiro oi e a avaliação no Google/)
    expect(source).toMatch(/Para a recepção encaminhar e para o doutor ver em poucos minutos/)
    expect(source).toMatch(/A próxima começa em seguida/)
    expect(source).toMatch(/Portfólio/)
    expect(source).toMatch(/Métricas/)
    expect(source).toMatch(/Pixel em breve/)
    expect(source).toMatch(/loading="lazy"/)
    expect(source).toMatch(/mark-float/)
    expect(source).toMatch(/prefers-reduced-motion/)
    expect(source).toMatch(/Ouça em /)
    expect(source).toMatch(/MARCOS_AUDIO_VERSION/)
    expect(source).not.toMatch(/instalar no celular|baixar/i)
    expect(source).toMatch(/marcos-1\.mp3/)
    expect(source).not.toMatch(/marcos-2\.mp3|marcos-3\.mp3/)
    expect(source).not.toMatch(/narração gerada/i)
    expect(source).toMatch(/paciente-implantes\.mp3/)
    expect(source).toMatch(/paciente-dermato\.mp3/)
    expect(source).toMatch(/og:title/)
    expect(source).toMatch(/https:\/\/apresentacao\.devbrasil\.online\//)
    expect(source).toMatch(/https:\/\/apresentacao\.devbrasil\.online\/og\.png/)
    expect(source).not.toMatch(/marcos4213\.github\.io/)
    expect(source).not.toMatch(/logo abaixo/)
    expect(source).not.toMatch(/Resposta 24h/)
    expect(source).not.toMatch(/while \(id === runId\)/)
    expect(source).not.toMatch(/Harvard|HBR|Dr\(a\)|o\(a\)/i)
    expect(source).toMatch(/Pesquisa da Doctoralia: 80% dos pacientes escolhem o especialista pelas avaliações online/)
    expect(source).toMatch(/Não é um resultado da Automatize/)
    expect(source).toMatch(/não é um resultado prometido/i)
    expect(source).toMatch(/Estimativa conservadora/)
    expect(source).toMatch(/O método Automatize/)
    expect(source).not.toMatch(/type="number"/)
    for (const route of ['/#/demo"', '/#/demo/whatsapp', '/#/demo/instagram', '/#/demo/pipeline', '/#/demo/agenda', '/#/demo/avaliacoes', '/#/demo/portfolio', '/#/demo/metricas', '/#/demo/integracoes']) {
      expect(source).toContain(`https://automatize.devbrasil.online${route.replace(/"$/, '')}`)
    }
    for (const label of ['Resposta na hora', 'Qualificação', 'Agendamento', 'Lembrete', 'Follow-up']) {
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
    expect(workflow).toMatch(/apresentacao\/favicon\.ico/)
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
    expect(model.kicker).toBe('Para a recepção da Pele Viva encaminhar e para o doutor ver em poucos minutos.')
    expect(model.place).toBe('da Pele Viva')
    expect(model.initial).toBe('P')
    expect(model.href).toMatch(/^https:\/\/wa\.me\/5511900000000\?text=/)
    const overridden = decodeURIComponent(model.href.split('text=')[1])
    expect(overridden).toMatch(/Olá, Marcos!/)
    expect(overridden).toMatch(/Clínica: Pele Viva/)
    expect(overridden).toMatch(/Nicho: Dermatologia/)
    expect(model.thread.some((step) => step.text?.includes('a equipe da Pele Viva'))).toBe(true)
    expect(model.thread.some((step) => step.kind === 'typing')).toBe(true)

    const plain = pageModel('')
    expect(plain.phone).toBe('5511913221587')
    expect(plain.href).toMatch(/^https:\/\/wa\.me\/5511913221587\?text=/)
    expect(decodeURIComponent(plain.href.split('text=')[1])).toBe(
      'Olá, Marcos! Vi a apresentação da Automatize e quero agendar 15 minutos para ver o aplicativo por dentro.',
    )
    const named = pageModel('?nicho=implantes&clinica=Aurora')
    expect(named.href).toMatch(/^https:\/\/wa\.me\/5511913221587\?text=/)
    expect(decodeURIComponent(named.href.split('text=')[1])).toBe(
      'Olá, Marcos! Vi a apresentação da Automatize e quero agendar 15 minutos para ver o aplicativo por dentro. Clínica: Aurora. Nicho: Implantes.',
    )
    expect(plain.header).toBe('Sua clínica')
    expect(plain.thread.some((step) => step.text?.includes('a nossa equipe'))).toBe(true)
    expect(whatsappHref('abc', { clinic: 'Aurora' })).toBe('')
    expect(pageModel('', '5511988887777').href).toMatch(/^https:\/\/wa\.me\/5511988887777\?text=/)
    expect(pageModel('?whatsapp=abc', '5511988887777').phone).toBe('5511988887777')
  })

  it('adapts every niche and keeps the five movements', () => {
    expect(NICHES.map((niche) => niche.id)).toEqual(['implantes', 'lentes', 'harmonizacao', 'plastica', 'dermatologia'])
    for (const niche of NICHES) {
      const thread = buildThread(niche.id, '')
      const labels = thread.filter((step) => step.kind === 'status').map((step) => step.text)
      expect(labels).toEqual(['Resposta na hora', 'Qualificação', 'Agendamento', 'Lembrete', 'Follow-up'])
      expect(thread.some((step) => step.kind === 'typing')).toBe(true)
      expect(thread.some((step) => step.text === 'Véspera')).toBe(true)
      expect(thread.some((step) => step.text === 'Depois da avaliação')).toBe(true)
      expect(thread.some((step) => step.text === 'Sem resposta')).toBe(false)
      expect(thread.some((step) => /ficou parada|ficou em aberto|ficou pendente|ficou sem retorno|conversa parou/i.test(step.text || ''))).toBe(false)
      const bookedAt = thread.findIndex((step) => /marcada|marcado/i.test(step.text || ''))
      const followAt = thread.findIndex((step) => step.kind === 'status' && step.text === 'Follow-up')
      expect(bookedAt).toBeGreaterThan(-1)
      expect(followAt).toBeGreaterThan(bookedAt)
    }
    expect(buildThread('lentes', '')[0].text).toBe(PATIENT_LINES.lentes)
    expect(buildThread('plastica', 'Aurora').some((step) => step.text?.includes('na Aurora'))).toBe(true)
    expect(buildThread('implantes', '').some((step) => step.text?.includes('implante'))).toBe(true)
  })

  it('plays the patient audios and the single Marcos recording', () => {
    expect(MARCOS_PARTS).toEqual(['marcos-1.mp3'])
    const duration = mp3Duration(readFileSync(join(root, 'audio', 'marcos-1.mp3')))
    expect(duration).toBeGreaterThan(33)
    expect(duration).toBeLessThan(36)
    expect(existsSync(join(root, 'audio', 'marcos-2.mp3'))).toBe(false)
    expect(existsSync(join(root, 'audio', 'marcos-3.mp3'))).toBe(false)
    expect(existsSync(join(root, 'narracao.mp3'))).toBe(false)
    const guide = readFileSync(join(root, 'audio', 'LEIA-ME.md'), 'utf8')
    expect(guide).toMatch(/marcos-1\.mp3/)
    expect(guide).toMatch(/MARCOS_AUDIO_VERSION/)
    expect(guide).not.toMatch(/marcos-2\.mp3|marcos-3\.mp3/)
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

  it('estimates only from the numbers the clinic types', () => {
    expect(DEFAULT_UNANSWERED_PERCENT).toBe(30)
    expect(DEFAULT_BOOKING_PERCENT).toBe(25)
    expect(FUNNEL.map((step) => step.id)).toEqual(['resposta', 'agenda', 'lembrete', 'retorno', 'google', 'crm'])
    const base = {
      messagesPerDay: 40,
      daysPerMonth: 20,
      unansweredPercent: 25,
      bookingPercent: 100,
      averageValue: '',
    }
    expect(clinicEstimate(base)).toMatchObject({ conversations: 200, patients: 200, revenue: null })
    expect(clinicEstimate({ ...base, bookingPercent: 50 })).toMatchObject({ conversations: 200, patients: 100, revenue: null })
    expect(clinicEstimate({ ...base, bookingPercent: 50, averageValue: 400 })).toMatchObject({ revenue: 40000 })
    expect(clinicEstimate({ ...base, daysPerMonth: '' })).toBe(null)
    expect(clinicEstimate({ messagesPerDay: 30 })).toMatchObject({ conversations: 198, patients: 50 })
    expect(clinicEstimate({ messagesPerDay: 30, averageValue: 300 })).toMatchObject({ revenue: 15000 })
    expect(clinicEstimate({ ...base, messagesPerDay: -1 })).toBe(null)
    expect(clinicEstimate({ ...base, unansweredPercent: 101 })).toBe(null)
    const copy = estimateCopy(clinicEstimate(base))
    expect(copy.conversations).toBe('40 mensagens × 20 dias × 25% = 200')
    expect(copy.patients).toBe('200 conversas × 100% = 200')
    expect(copy.revenue).toBe('')
  })
})
