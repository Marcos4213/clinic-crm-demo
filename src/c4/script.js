import { C4_MAX_TURNS, C4_SITE, C4_SLOGAN, C4_WHATSAPP_E164 } from './config.js'

const PRICE = /(?:\bpre[cç]os?\b|\bvalores?\b|\bquanto\b|\bcusta\b|\btabela\b|\breais\b|\bdesconto\b|\bparcel|\br\$)/i
const MONEY = /r\$\s?\d|\b\d[\d.]*(?:,\d{2})?\s*reais\b|\b\d+\s*%|(?:pre[cç]o|valor|custa|desconto)\D{0,16}\d|\b\d{1,2}\s*h(?:oras?)?\b|\b\d{1,2}:\d{2}\b/i

export { C4_SLOGAN }

export function clinicPageUrl(slug, name = '') {
  const base = C4_SITE.endsWith('/') ? C4_SITE : `${C4_SITE}/`
  if (slug) return `${base}#/c/${slug}`
  const clean = String(name ?? '').trim()
  if (!clean) return `${base}#/c`
  return `${base}#/c?nome=${encodeURIComponent(clean)}`
}

export function forwardText(name, url) {
  const clinic = String(name || '').trim() || 'clínica'
  return `Dra., olha como ficaria o atendimento da ${clinic} no WhatsApp: ${url}`
}

export function forwardHref(name, url) {
  return `https://wa.me/?text=${encodeURIComponent(forwardText(name, url))}`
}

export function bookingText(name) {
  const clinic = String(name || '').trim()
  const who = clinic ? ` Sou da recepção da ${clinic}.` : ''
  return `Oi, Marcos!${who} Quero marcar 30 minutos para ver o C4 Clinic.`
}

export function bookingHref(name, phone = C4_WHATSAPP_E164) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(bookingText(name))}`
}

export function openingMessage(clinic) {
  const name = clinic?.name?.trim()
  const city = clinic?.city?.trim()
  const care = clinic?.procedure?.trim()
  const who = name ? `da ${name}` : 'da clínica'
  const place = city ? `, em ${city}` : ''
  const focus = care ? ` Por aqui, o caminho começa com ${care}.` : ''
  return `Oi! Aqui é o atendimento ${who}${place}.${focus} O que você quer tratar?`
}

function careOf(clinic) {
  return clinic?.procedure?.trim() || 'o que você quer tratar'
}

function evaluationOffer(procedure) {
  const care = String(procedure ?? '').trim()
  if (!care || care === 'o que você quer tratar') return 'uma avaliação'
  if (/^avalia/i.test(care)) return `a ${care}`
  return `uma avaliação de ${care}`
}

function attendance(clinic) {
  const name = clinic?.name?.trim()
  const city = clinic?.city?.trim()
  const who = name ? `da ${name}` : 'da clínica'
  return city ? `${who}, em ${city}` : who
}

export function scriptedReply({ clinic, text, turn }) {
  const where = attendance(clinic)
  const care = careOf(clinic)
  const step = Math.min(Math.max(Number(turn) || 1, 1), C4_MAX_TURNS)
  if (PRICE.test(text)) {
    return `Valores quem confirma é a equipe ${where}. Eu não passo preço por aqui. Se quiser, peço uma avaliação e a equipe confirma o horário.`
  }
  if (step <= 1) {
    return `Oi! Aqui é o atendimento ${where}. Me conta o que você quer tratar? Se for ${care}, a gente começa com uma avaliação.`
  }
  if (step === 2) {
    return `Certo. É a primeira vez que você procura isso, ou já é paciente ${where.replace(/, em .+$/, '')}?`
  }
  if (step === 3) {
    return `Posso pedir ${evaluationOffer(care)} para a equipe. O horário e os valores eles confirmam com você. Quer que eu peça?`
  }
  return `Combinado. A equipe ${where} confirma o encaixe da avaliação. No dia anterior eu te mando um lembrete, e outro perto do horário.`
}

export function scrubReply(text) {
  const raw = String(text ?? '')
    .replace(/\bclientes\b/gi, 'pacientes')
    .replace(/\bcliente\b/gi, 'paciente')
    .replace(/o\(a\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!raw) return ''
  if (MONEY.test(raw)) return ''
  return [...raw].slice(0, 500).join('').trim()
}

export function methodSteps(clinic) {
  const name = clinic?.name?.trim() || 'clínica'
  const care = clinic?.procedure?.trim() || 'avaliação'
  return [
    {
      id: 'captar',
      label: 'Captar',
      title: 'WhatsApp e Instagram, o dia inteiro',
      copy: 'A conversa começa na hora em que a paciente escreve, de dia ou de noite. A recepção vê tudo quando volta.',
      bubbles: [
        { from: 'patient', text: 'Oi, vi vocês no Instagram.' },
        { from: 'clinic', text: `Oi! Aqui é o atendimento da ${name}. O que você quer tratar?` },
      ],
    },
    {
      id: 'conversar',
      label: 'Conversar',
      title: 'Áudio e texto, com calma',
      copy: 'Entende áudio e texto. Pergunta o que a pessoa quer tratar e faz uma ou duas perguntas para entender o caso.',
      bubbles: [
        { from: 'patient', text: `Queria saber sobre ${care}.`, audio: true },
        { from: 'clinic', text: 'Ouvi seu áudio. É a primeira vez que você procura isso?' },
      ],
    },
    {
      id: 'converter',
      label: 'Converter',
      title: 'Volta quando a paciente para',
      copy: 'Se a paciente para de responder, a conversa continua com um convite para a avaliação. O horário fica com a equipe.',
      bubbles: [
        { from: 'note', text: 'A paciente parou de responder.' },
        { from: 'clinic', text: `Oi! Ainda quer ver ${evaluationOffer(care)}? A equipe confirma o encaixe.` },
      ],
    },
    {
      id: 'cuidar',
      label: 'Cuidar',
      title: 'Lembrete e pedido de avaliação',
      copy: 'Manda um lembrete no dia anterior e outro perto do horário. Depois da consulta, pede uma avaliação do atendimento.',
      bubbles: [
        { from: 'clinic', text: 'Lembrete: sua avaliação é amanhã. Te aviso de novo perto do horário.' },
        { from: 'clinic', text: 'Depois da consulta, se fizer sentido, peço sua avaliação do atendimento.' },
      ],
    },
  ]
}
