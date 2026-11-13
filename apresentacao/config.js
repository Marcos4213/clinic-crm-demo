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
 * Áudio do Marcos: só os nomes em MARCOS_PARTS. A duração sai do MP3.
 * Ao trocar o arquivo, aumente MARCOS_AUDIO_VERSION para o navegador não
 * reaproveitar o MP3 antigo. Veja apresentacao/audio/LEIA-ME.md.
 * Foto opcional: marcos.jpg, marcos.webp ou marcos.png.
 * Áudios do paciente: paciente-implantes.mp3, paciente-lentes.mp3,
 *   paciente-harmonizacao.mp3, paciente-plastica.mp3, paciente-dermato.mp3.
 * Se um áudio do paciente faltar, a bolha fica com a transcrição e o play desativado.
 * Veja apresentacao/audio/LEIA-ME.md.
 */

export const WHATSAPP_E164 = '5511913221587'

export const MARCOS_PARTS = ['marcos-1.mp3']

export const MARCOS_AUDIO_VERSION = '2'

export const MARCOS_PHOTO_FILES = ['marcos.jpg', 'marcos.webp', 'marcos.png']

export const PATIENT_FILES = {
  implantes: 'paciente-implantes.mp3',
  lentes: 'paciente-lentes.mp3',
  harmonizacao: 'paciente-harmonizacao.mp3',
  plastica: 'paciente-plastica.mp3',
  dermatologia: 'paciente-dermato.mp3',
}

export const SERVICE_NAME = {
  implantes: 'implante',
  lentes: 'lentes de contato',
  harmonizacao: 'harmonização',
  plastica: 'cirurgia plástica',
  dermatologia: 'consulta de pele',
}

export const PUBLIC_ORIGIN = 'https://apresentacao.devbrasil.online/'

export const DEMO_ORIGIN = 'https://automatize.devbrasil.online'

export const CTA_LABEL = 'Agendar 15 minutos com o Marcos'

export const CTA_HELP =
  'Uma apresentação rápida do aplicativo por dentro, e de onde a clínica perde paciente hoje.'

export const BOOKING_TEXT =
  'Olá, Marcos! Vi a apresentação da Automatize e quero agendar 15 minutos para ver o aplicativo por dentro.'

export const DOCTORALIA_STAT =
  'Pesquisa da Doctoralia: 80% dos pacientes escolhem o especialista pelas avaliações online.'

export const DOCTORALIA_SOURCE = 'Fonte: pesquisa Paciente Digital, Doctoralia, 2023. Não é um resultado da Automatize.'

function demoPath(route) {
  return `${DEMO_ORIGIN}/#${route}`
}

export const MODULE_DEMOS = {
  inicio: demoPath('/demo'),
  whatsapp: demoPath('/demo/whatsapp'),
  instagram: demoPath('/demo/instagram'),
  pipeline: demoPath('/demo/pipeline'),
  agenda: demoPath('/demo/agenda'),
  avaliacoes: demoPath('/demo/avaliacoes'),
  portfolio: demoPath('/demo/portfolio'),
  metricas: demoPath('/demo/metricas'),
  integracoes: demoPath('/demo/integracoes'),
}

export const MODULES = [
  {
    id: 'inicio',
    label: 'Início',
    demo: MODULE_DEMOS.inicio,
    copy: 'O doutor vê o dia. A recepção vê a fila, a agenda e o retorno.',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    demo: MODULE_DEMOS.whatsapp,
    copy: 'Resposta, agenda, follow-up e remarketing neste canal.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    demo: MODULE_DEMOS.instagram,
    mark: true,
    copy: 'Direct, comentário e agendamento. A conta entra na implantação.',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    demo: MODULE_DEMOS.pipeline,
    copy: 'Do primeiro contato ao paciente atendido, cada um no seu lugar.',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    demo: MODULE_DEMOS.agenda,
    copy: 'A agenda interna, ou a agenda que a clínica já usa.',
  },
  {
    id: 'avaliacoes',
    label: 'Google',
    demo: MODULE_DEMOS.avaliacoes,
    mark: true,
    copy: 'O pedido de avaliação sai depois da consulta. Entra na implantação.',
  },
  {
    id: 'portfolio',
    label: 'Portfólio',
    demo: MODULE_DEMOS.portfolio,
    copy: 'A IA aprende os serviços da clínica na implantação.',
  },
  {
    id: 'metricas',
    label: 'Métricas',
    demo: MODULE_DEMOS.metricas,
    copy: 'Funil, canal e tempo de resposta, com exportação. Os números da tela são fictícios.',
  },
  {
    id: 'integracoes',
    label: 'Integrações',
    demo: MODULE_DEMOS.integracoes,
    copy: 'WhatsApp, Instagram, Google e agendas. Nada fica ligado sem a implantação.',
  },
]

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

function conversation({ voice, file, firstReply, qualify, answer, offer, choice, booked, reminder, confirm, follow }) {
  return [
    { kind: 'voice', time: '21:18', text: voice, file },
    { kind: 'status', text: 'Resposta na hora' },
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
    { kind: 'paciente', time: '09:04', text: confirm },
    { kind: 'note', text: 'Depois da avaliação' },
    { kind: 'status', text: 'Follow-up' },
    { kind: 'typing' },
    { kind: 'equipe', time: '18:10', text: follow },
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
      confirm: 'Confirmado. Estarei lá.',
      follow: 'Oi. Passando para saber como foi a avaliação de implante. Se quiser, deixo o pedido de avaliação no Google.',
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
      confirm: 'Confirmado. Estarei lá.',
      follow: 'Oi. Como foi a avaliação das lentes? Se fizer sentido, peço a avaliação no Google.',
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
      confirm: 'Confirmado. Estarei lá.',
      follow: 'Oi. Como foi a avaliação de harmonização? Se quiser, deixo o pedido de avaliação no Google.',
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
      confirm: 'Confirmado. Estarei lá.',
      follow: 'Oi. Como foi a avaliação na {place}? Se quiser, deixo o pedido de avaliação no Google.',
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
      confirm: 'Confirmado. Estarei lá.',
      follow: 'Oi. Como foi a consulta de pele? Se quiser, deixo o pedido de avaliação no Google.',
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

export function whatsappText({ clinic = '', nicheLabel = '' } = {}) {
  const lines = [BOOKING_TEXT]
  if (clinic) lines.push(`Clínica: ${clinic}.`)
  if (nicheLabel) lines.push(`Nicho: ${nicheLabel}.`)
  return lines.join(' ')
}

export function whatsappHref(phone, details = {}) {
  const digits = cleanPhone(phone)
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappText(details))}`
}

export function pageModel(search, configuredPhone = WHATSAPP_E164) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  const nicheQuery = params.get('nicho')
  const niche = resolveNiche(nicheQuery)
  const clinic = cleanClinic(params.get('clinica'))
  const nicheLabel = nicheQuery ? (NICHES.find((item) => item.id === niche)?.label ?? '') : ''
  const whatsappParam = cleanPhone(params.get('whatsapp'))
  const phone = resolvePhone(whatsappParam, configuredPhone)
  const place = clinic ? `da ${clinic}` : 'da clínica'
  return {
    niche,
    clinic,
    nicheLabel,
    whatsappParam,
    phone,
    href: whatsappHref(phone, { clinic, nicheLabel }),
    kicker: clinic
      ? `Para a recepção da ${clinic} encaminhar e para o doutor ver em poucos minutos.`
      : 'Para a recepção encaminhar e para o doutor ver em poucos minutos.',
    place,
    heroPlace: clinic ? `para a ${clinic}` : 'para a sua clínica',
    header: clinic || 'Sua clínica',
    initial: [...(clinic || 'Sua clínica')][0].toUpperCase(),
    ctaHelp: CTA_HELP,
    ctaLabel: CTA_LABEL,
    service: SERVICE_NAME[niche],
    thread: buildThread(niche, clinic),
  }
}

export const DEFAULT_UNANSWERED_PERCENT = 30

export const DEFAULT_BOOKING_PERCENT = 25

export const WORK_DAYS = 22

export const FUNNEL = [
  {
    id: 'resposta',
    label: 'Responde na hora',
    title: 'Maria escreve às 22h. A resposta chega em segundos.',
    time: '22:04',
    chat: [
      { from: 'patient', text: 'Oi! Queria marcar uma avaliação. Vocês atendem sábado?' },
      { from: 'clinic', text: 'Oi, Maria! Boa noite 😊 Aqui é a Ana, da clínica.' },
      { from: 'clinic', text: 'Atendemos sim! A avaliação é com a Dra. Paula e dura uns 40 minutos.' },
      { from: 'clinic', text: 'Prefere sábado às 9h ou terça às 18h?' },
    ],
    instagram: 'Vi o vídeo no Reels 😍 vocês atendem sábado?',
    method: 'Resposta imediata, 24 horas',
    why: 'Quem pergunta à noite costuma escrever para mais de uma clínica. A primeira que responde bem sai na frente.',
  },
  {
    id: 'agenda',
    label: 'Marca sozinho',
    title: 'Ela escolhe o horário e a consulta já entra na agenda.',
    time: '22:05',
    chat: [
      { from: 'patient', text: 'Sábado às 9h!' },
      { from: 'clinic', text: 'Prontinho, Maria! ✅ Sábado, às 9h, com a Dra. Paula.' },
      { from: 'clinic', text: 'Te mando um lembrete na véspera. Qualquer dúvida, é só chamar aqui.' },
    ],
    method: 'Duas opções de horário',
    why: 'Em vez de “qual horário você quer?”, a paciente escolhe entre duas opções. Menos vai e vem, mais consulta marcada.',
  },
  {
    id: 'lembrete',
    label: 'Lembra na véspera',
    title: 'Na sexta, ela confirma com uma resposta.',
    time: 'Sex · 10:00',
    chat: [
      { from: 'clinic', text: 'Oi, Maria! Passando pra lembrar da sua avaliação amanhã, sábado, às 9h 😊' },
      { from: 'clinic', text: 'Responde 1 pra confirmar ou 2 pra remarcar.' },
      { from: 'patient', text: '1' },
      { from: 'clinic', text: 'Confirmado! Até amanhã, Maria.' },
    ],
    method: 'Lembrete com confirmação',
    why: 'Revisão Cochrane (2013): lembretes por mensagem aumentam o comparecimento em consultas, comparados a nenhum lembrete.',
  },
  {
    id: 'retorno',
    label: 'Recupera quem sumiu',
    title: 'João perguntou e não marcou. Ele recebe um retorno.',
    time: '2 dias depois',
    patient: 'João',
    chat: [
      { from: 'patient', text: 'Quanto fica a avaliação?' },
      { from: 'note', text: 'João não respondeu mais.' },
      { from: 'clinic', text: 'Oi, João! Vi que você perguntou da avaliação e acabou não dando tempo de marcar.' },
      { from: 'clinic', text: 'Ainda tenho quinta às 18h. Quer que eu reserve pra você?' },
      { from: 'patient', text: 'Quero sim!' },
    ],
    method: 'Follow-up de quem não marcou',
    why: 'A maioria não disse não, só se distraiu. Um retorno educado no momento certo traz de volta quem a recepção não teve tempo de chamar.',
  },
  {
    id: 'google',
    label: 'Pede avaliação no Google',
    title: 'Depois da consulta, Maria recebe o pedido de avaliação.',
    time: 'Sáb · 11:30',
    chat: [
      { from: 'clinic', text: 'Maria, obrigada por vir hoje! 💙 Foi um prazer te atender.' },
      { from: 'clinic', text: 'Se puder, conta como foi no Google. Leva 1 minuto: g.page/clinica' },
      { from: 'patient', text: 'Claro! Amei o atendimento ⭐⭐⭐⭐⭐' },
    ],
    method: 'Pedido no momento certo',
    why: 'Pedir logo depois da consulta, com a experiência fresca. A avaliação é o que o próximo paciente lê antes de escolher a clínica.',
  },
  {
    id: 'crm',
    label: 'O doutor acompanha',
    title: 'O doutor vê tudo no celular, sem perguntar pra recepção.',
    time: 'Hoje',
    card: true,
    stats: [
      ['Mensagens hoje', '18'],
      ['Consultas marcadas', '7'],
      ['Recuperados no retorno', '2'],
      ['Avaliações no Google', '3'],
    ],
    rows: [
      ['Maria', 'Veio · avaliou no Google ⭐'],
      ['João', 'Marcou após o retorno'],
      ['Carla', 'Aguardando confirmação'],
    ],
    method: 'Tudo num painel',
    why: 'Cada paciente com a etapa em que está: chegou, marcou, confirmou, veio, avaliou. O doutor acompanha o resultado sem depender de planilha.',
  },
]

function readCount(value, { min, max }) {
  if (typeof value === 'string' && value.trim() === '') return null
  if (value == null) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return null
  return number
}

export function clinicEstimate({
  messagesPerDay,
  daysPerMonth = WORK_DAYS,
  unansweredPercent = DEFAULT_UNANSWERED_PERCENT,
  bookingPercent = DEFAULT_BOOKING_PERCENT,
  averageValue,
} = {}) {
  const messages = readCount(messagesPerDay, { min: 0, max: 10000 })
  const days = readCount(daysPerMonth, { min: 1, max: 31 })
  const unanswered = readCount(unansweredPercent, { min: 0, max: 100 })
  const booking = readCount(bookingPercent, { min: 0, max: 100 })
  if (messages == null || days == null || unanswered == null || booking == null) return null
  const money = readCount(averageValue, { min: 0, max: 1000000 })
  const conversationsExact = messages * days * (unanswered / 100)
  const patientsExact = conversationsExact * (booking / 100)
  const revenueExact = money == null || money === 0 ? null : Math.round(patientsExact) * money
  return {
    messages,
    days,
    unanswered,
    booking,
    averageValue: revenueExact == null ? null : money,
    conversationsExact,
    patientsExact,
    revenueExact,
    conversations: Math.round(conversationsExact),
    patients: Math.round(patientsExact),
    revenue: revenueExact == null ? null : Math.round(revenueExact),
  }
}

const ptNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const ptWhole = new Intl.NumberFormat('pt-BR')
const ptMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function estimateCopy(result) {
  if (!result) return null
  const conversations = `${ptNumber.format(result.messages)} mensagens × ${ptNumber.format(result.days)} dias × ${ptNumber.format(result.unanswered)}% = ${ptNumber.format(result.conversationsExact)}`
  const patients = `${ptNumber.format(result.conversationsExact)} conversas × ${ptNumber.format(result.booking)}% = ${ptNumber.format(result.patientsExact)}`
  const revenue =
    result.revenue == null
      ? ''
      : `${ptNumber.format(result.patientsExact)} × ${ptMoney.format(result.averageValue)} = ${ptMoney.format(result.revenueExact)}`
  return {
    conversations,
    patients,
    revenue,
    conversationsValue: ptWhole.format(result.conversations),
    patientsValue: ptWhole.format(result.patients),
    revenueValue: result.revenue == null ? '' : ptMoney.format(result.revenue),
  }
}
