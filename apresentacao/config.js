/**
 * Apresentação de envio da Automatize.
 * Página estática, sem login.
 *
 * WHATSAPP_E164 — WhatsApp do Marcos, destino do único CTA.
 * Só dígitos, com DDI. No Brasil: 55 + DDD + número (12 ou 13 dígitos).
 * Deixe "" até existir o número real. Não use número de exemplo.
 *
 * Sem editar este arquivo, o link enviado à clínica pode trazer o número:
 *   ?whatsapp=55DDDNUMERO
 * O parâmetro só vale com 10 a 15 dígitos. Qualquer outro texto é ignorado.
 *
 * Outros parâmetros:
 *   ?nicho=implantes|lentes|harmonizacao|plastica|dermatologia
 *   ?clinica=Nome da clínica
 *
 * Áudios do Marcos, na ordem, em apresentacao/audio/:
 *   marcos-1.mp3, marcos-2.mp3, marcos-3.mp3
 * Foto opcional: marcos.jpg, marcos.webp ou marcos.png.
 * Áudios do paciente: paciente-implantes.mp3, paciente-lentes.mp3,
 *   paciente-harmonizacao.mp3, paciente-plastica.mp3, paciente-dermato.mp3.
 * Se um áudio do paciente faltar, a bolha fica com a transcrição e o play desativado.
 * Veja apresentacao/audio/LEIA-ME.md.
 */

export const WHATSAPP_E164 = ''

export const MARCOS_PARTS = ['marcos-1.mp3', 'marcos-2.mp3', 'marcos-3.mp3']

export const MARCOS_PHOTO_FILES = ['marcos.jpg', 'marcos.webp', 'marcos.png']

export const PATIENT_FILES = {
  implantes: 'paciente-implantes.mp3',
  lentes: 'paciente-lentes.mp3',
  harmonizacao: 'paciente-harmonizacao.mp3',
  plastica: 'paciente-plastica.mp3',
  dermatologia: 'paciente-dermato.mp3',
}

export const PATIENT_LINES = {
  implantes: 'Oi, boa noite! Vi o perfil de vocês e queria saber como funciona o implante. Dá pra fazer uma avaliação essa semana?',
  lentes: 'Oi! Queria saber sobre as lentes nos dentes. Fica natural? Tem horário pra avaliação essa semana?',
  harmonizacao: 'Oi, tudo bem? Queria saber sobre harmonização facial. Consigo marcar uma avaliação pra essa semana?',
  plastica: 'Oi, boa noite. Queria entender como funciona a consulta pra cirurgia. Tem horário disponível?',
  dermatologia: 'Oi! Queria marcar uma consulta pra cuidar da pele. Tem horário essa semana?',
}

const ALIAS = {
  implantes: 'implantes',
  implante: 'implantes',
  lentes: 'lentes',
  'lentes-de-contato': 'lentes',
  'lentes-de-contato-dental': 'lentes',
  lente: 'lentes',
  harmonizacao: 'harmonizacao',
  facial: 'harmonizacao',
  plastica: 'plastica',
  'cirurgia-plastica': 'plastica',
  cirurgia: 'plastica',
  dermatologia: 'dermatologia',
  derma: 'dermatologia',
  dermato: 'dermatologia',
}

function conversation({ voice, file, firstReply, qualify, answer, offer, choice, booked, reminder, follow }) {
  return [
    { kind: 'voice', time: '21:18', text: voice, file },
    { kind: 'status', text: 'Resposta 24h' },
    { kind: 'typing' },
    { kind: 'equipe', time: '21:18', text: firstReply },
    { kind: 'status', text: 'Qualificação' },
    { kind: 'typing' },
    { kind: 'equipe', time: '21:19', text: qualify },
    { kind: 'paciente', time: '21:19', text: answer },
    { kind: 'status', text: 'Agendamento' },
    { kind: 'typing' },
    { kind: 'equipe', time: '21:19', text: offer },
    { kind: 'paciente', time: '21:20', text: choice },
    { kind: 'typing' },
    { kind: 'equipe', time: '21:20', text: booked },
    { kind: 'note', text: 'Véspera' },
    { kind: 'status', text: 'Lembrete' },
    { kind: 'typing' },
    { kind: 'equipe', time: '09:02', text: reminder },
    { kind: 'note', text: 'Sem resposta' },
    { kind: 'status', text: 'Recuperação' },
    { kind: 'typing' },
    { kind: 'equipe', time: '11:40', text: follow },
  ]
}

export const NICHES = [
  {
    id: 'implantes',
    label: 'Implantes',
    steps: conversation({
      voice: PATIENT_LINES.implantes,
      file: PATIENT_FILES.implantes,
      firstReply: 'Boa noite. Ouvi seu áudio. Aqui é {team}. O implante começa com uma avaliação, e dá para ver um horário nesta semana.',
      qualify: 'Esta seria a sua primeira avaliação?',
      answer: 'Sim, a primeira.',
      offer: 'Tenho terça às 10h ou quinta às 16h. Qual fica melhor?',
      choice: 'Terça às 10h.',
      booked: 'Avaliação de implante marcada: terça, 10h. Te aviso na véspera.',
      reminder: 'Lembrete: amanhã, terça, 10h, sua avaliação de implante. Você confirma?',
      follow: 'Oi. Você viu os horários e a conversa ficou parada. Quer que eu separe um horário nesta semana?',
    }),
  },
  {
    id: 'lentes',
    label: 'Lentes de contato',
    steps: conversation({
      voice: PATIENT_LINES.lentes,
      file: PATIENT_FILES.lentes,
      firstReply: 'Oi. Ouvi seu áudio. Aqui é {team}. As lentes são avaliadas de perto, para ver o que fica natural. Dá para olhar um horário nesta semana.',
      qualify: 'É a primeira avaliação de lentes?',
      answer: 'Primeira vez.',
      offer: 'Tenho quarta às 9h ou sexta às 15h. Qual prefere?',
      choice: 'Sexta às 15h.',
      booked: 'Avaliação de lentes marcada: sexta, 15h. Te lembro na véspera.',
      reminder: 'Lembrete: amanhã, sexta, 15h, sua avaliação de lentes. Confirma?',
      follow: 'Oi. A conversa sobre lentes ficou em aberto. Quer um horário de avaliação nesta semana?',
    }),
  },
  {
    id: 'harmonizacao',
    label: 'Harmonização',
    steps: conversation({
      voice: PATIENT_LINES.harmonizacao,
      file: PATIENT_FILES.harmonizacao,
      firstReply: 'Oi. Ouvi seu áudio. Aqui é {team}. A harmonização facial começa com uma avaliação. Consigo procurar um horário nesta semana.',
      qualify: 'Você já fez harmonização antes?',
      answer: 'Ainda não.',
      offer: 'Tenho segunda às 11h ou quarta às 18h. Qual encaixa melhor?',
      choice: 'Quarta às 18h.',
      booked: 'Avaliação de harmonização marcada: quarta, 18h.',
      reminder: 'Lembrete: amanhã, quarta, 18h, sua avaliação de harmonização. Você confirma?',
      follow: 'Oi. Você perguntou sobre harmonização e a conversa parou. Se quiser, eu vejo o próximo horário.',
    }),
  },
  {
    id: 'plastica',
    label: 'Plástica',
    steps: conversation({
      voice: PATIENT_LINES.plastica,
      file: PATIENT_FILES.plastica,
      firstReply: 'Boa noite. Ouvi seu áudio. Aqui é {team}. A consulta com o doutor é para entender a cirurgia. Vou ver se há horário.',
      qualify: 'Qual região você quer avaliar, em linhas gerais?',
      answer: 'O abdômen.',
      offer: 'Tenho quinta às 8h ou sexta às 14h. Qual prefere?',
      choice: 'Quinta às 8h.',
      booked: 'Avaliação marcada: quinta, 8h. Te envio o lembrete na véspera.',
      reminder: 'Lembrete: amanhã, quinta, 8h, sua avaliação na {place}. Confirma presença?',
      follow: 'Oi. Sua pergunta sobre a avaliação ficou sem retorno. Quer que eu procure outro horário?',
    }),
  },
  {
    id: 'dermatologia',
    label: 'Dermatologia',
    steps: conversation({
      voice: PATIENT_LINES.dermatologia,
      file: PATIENT_FILES.dermatologia,
      firstReply: 'Oi. Ouvi seu áudio. Aqui é {team}. A consulta para cuidar da pele pode ser nesta semana. Posso confirmar uma coisa?',
      qualify: 'É a primeira consulta com a gente?',
      answer: 'É a primeira.',
      offer: 'Tenho terça às 14h ou quinta às 9h. Qual fica melhor?',
      choice: 'Terça às 14h.',
      booked: 'Consulta marcada: terça, 14h. Eu te lembro na véspera.',
      reminder: 'Lembrete: amanhã, terça, 14h, sua consulta de dermatologia. Confirma?',
      follow: 'Oi. A marcação ficou pendente. Se ainda quiser, eu reservo um horário.',
    }),
  },
]

export function resolveNiche(value) {
  if (!value) return 'implantes'
  const key = String(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
  return ALIAS[key] || 'implantes'
}

export function cleanClinic(value) {
  if (!value) return ''
  const text = String(value)
    .replace(/[\p{Cc}\p{Cf}<>]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!/\p{L}/u.test(text)) return ''
  return [...text].slice(0, 42).join('').trim()
}

export function cleanPhone(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return digits
}

export function resolvePhone(fromUrl, configured = WHATSAPP_E164) {
  return cleanPhone(fromUrl) || cleanPhone(configured)
}

function teamPhrase(clinic) {
  return clinic ? `a equipe da ${clinic}` : 'a nossa equipe'
}

function placePhrase(clinic) {
  return clinic || 'clínica'
}

function fill(text, clinic) {
  return text.replaceAll('{team}', teamPhrase(clinic)).replaceAll('{place}', placePhrase(clinic))
}

export function buildThread(nicheId, clinic) {
  const id = resolveNiche(nicheId)
  const niche = NICHES.find((item) => item.id === id) ?? NICHES[0]
  return niche.steps.map((step) => (step.text ? { ...step, text: fill(step.text, clinic) } : { ...step }))
}

export function whatsappText(clinic) {
  const place = clinic ? `da ${clinic}` : 'da clínica'
  return `Olá. Vi a apresentação da Automatize sobre o WhatsApp ${place}. Quero marcar uma conversa com o doutor.`
}

export function whatsappHref(phone, clinic) {
  const digits = cleanPhone(phone)
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappText(clinic))}`
}

export function pageModel(search, configuredPhone = WHATSAPP_E164) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  const niche = resolveNiche(params.get('nicho'))
  const clinic = cleanClinic(params.get('clinica'))
  const whatsappParam = cleanPhone(params.get('whatsapp'))
  const phone = resolvePhone(whatsappParam, configuredPhone)
  const place = clinic ? `da ${clinic}` : 'da clínica'
  return {
    niche,
    clinic,
    whatsappParam,
    phone,
    href: whatsappHref(phone, clinic),
    kicker: clinic
      ? `Para a equipe da ${clinic} mostrar ao doutor`
      : 'Para a equipe da recepção mostrar ao doutor',
    place,
    header: clinic || 'Sua clínica',
    initial: [...(clinic || 'Sua clínica')][0].toUpperCase(),
    ctaHelp: `Uma call curta para o doutor ver o fluxo no WhatsApp ${place}.`,
    thread: buildThread(niche, clinic),
  }
}
