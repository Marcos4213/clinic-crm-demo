const t = (hh, mm) => `2026-11-09T${hh}:${mm}:00.000-03:00`

function thread(id, name, procedure, waiting, messages) {
  return { id, name, procedure, waiting, channelLabel: 'Demonstração', messages }
}

function waThread(id, name, property, waiting, messages, extra) {
  return { ...thread(id, name, property, waiting, messages), property, ...extra }
}

export const demoWhatsappThreads = [
  waThread('wa-maria', 'Maria Silva', 'Apto 2 dorm. · Vila Madalena', true, [
    { id: 'wa-maria-1', role: 'ia', text: 'Oi, Maria. Vi seu interesse no apartamento de 2 dormitórios na Vila Madalena. É para compra ou aluguel?', at: t('09', '14') },
    { id: 'wa-maria-2', role: 'cliente', text: 'Compra. Quero nessa região, até 850 mil, com entrada e financiamento. Preciso ver ainda este mês.', at: t('09', '16') },
    { id: 'wa-maria-3', role: 'ia', text: 'Combinado. Faixa e prazo fecham com o que temos. Posso te passar para o Carlos, corretor da vez, e agendar a visita?', at: t('09', '18') },
  ], { leadId: 'maria', temperature: 'quente', broker: 'Carlos Mendes', waitingFor: '12 min', helenaActive: true, interest: 'Compra · até R$ 850 mil · este mês', region: 'Vila Madalena' }),
  waThread('wa-joao', 'João Pedro', 'Casa em condomínio · Alphaville', true, [
    { id: 'wa-joao-1', role: 'cliente', text: 'Bom dia. Queria um aluguel de casa em Alphaville, até 8 mil.', at: t('08', '41') },
    { id: 'wa-joao-2', role: 'ia', text: 'Oi, João. Aluguel em Alphaville, até R$ 8 mil. Qual o prazo para mudar?', at: t('08', '48') },
    { id: 'wa-joao-3', role: 'cliente', text: 'Se achar uma boa, em 30 dias está bom.', at: t('08', '52') },
  ], { leadId: 'joao', temperature: 'morno', broker: 'Ana Souza', waitingFor: '28 min', helenaActive: true, interest: 'Aluguel · até R$ 8 mil · 30 dias', region: 'Alphaville' }),
  waThread('wa-beatriz', 'Beatriz Lima', 'Cobertura · Moema', false, [
    { id: 'wa-beatriz-1', role: 'cliente', text: 'Confirmo a visita de hoje às 16h.', at: t('07', '50') },
    { id: 'wa-beatriz-2', role: 'humano', text: 'Confirmado, Beatriz. O Carlos te espera às 16h no imóvel.', at: t('07', '55') },
  ], { leadId: 'beatriz', temperature: 'quente', broker: 'Carlos Mendes', helenaActive: false, interest: 'Compra · visita hoje às 16h', region: 'Moema' }),
]

export const demoInstagramThreads = [
  thread('ig-ana', 'Ana Beatriz Costa', 'Studio · Vila Olímpia', true, [
    { id: 'ig-ana-1', role: 'cliente', text: 'Vi o studio no feed. A visita é presencial?', at: t('10', '02') },
    { id: 'ig-ana-2', role: 'ia', text: 'Oi, Ana. Sim, a visita é no imóvel. Este direct é só uma demonstração.', at: t('10', '06') },
  ]),
  thread('ig-camila', 'Camila Rocha', 'Apto 3 dorm. · Jardins', false, [
    { id: 'ig-camila-1', role: 'cliente', text: 'Vocês têm apto de 3 dormitórios nos Jardins?', at: t('11', '05') },
    { id: 'ig-camila-2', role: 'humano', text: 'Temos. A conversa fica nesta amostra e não entra no WhatsApp.', at: t('11', '12') },
  ]),
]

export const demoCommentRules = [
  { id: 'preco', keyword: 'preço', reply: 'Te respondi no direct com os imóveis da faixa.', active: true },
  { id: 'visita', keyword: 'visita', reply: 'A visita é no imóvel. Posso te chamar no direct para marcar.', active: true },
  { id: 'agenda', keyword: 'agenda', reply: 'Vou te enviar os horários da semana por mensagem direta.', active: false },
]

export const demoPortfolio = []

export const demoReviews = [
  { id: 'rev-1', name: 'Fernanda Oliveira', source: 'Google', stars: 5, text: 'Fui muito bem recebida na visita. Equipe clara e sem pressa.', at: '08/11' },
  { id: 'rev-2', name: 'Gustavo Martins', source: 'Google', stars: 5, text: 'Explicaram o imóvel com calma. Saí sabendo o próximo passo.', at: '08/11' },
  { id: 'rev-3', name: 'Helena Duarte', source: 'Google', stars: 4, text: 'Gostei do atendimento. Ainda vou decidir o mês da mudança.', at: '07/11' },
]

export const demoCampaigns = [
  { id: 'camp-1', name: 'Lembrete de visita', audience: 'Leads quentes do ZAP', when: 'Amanhã, 09:30', status: 'Prévia' },
  { id: 'camp-2', name: 'Retorno de quem ficou em silêncio', audience: 'Sem resposta há 3 dias', when: 'Sexta, 11:00', status: 'Prévia' },
]

export const demoFollowups = [
  { id: 'fu-1', name: 'Rafael Nunes', detail: 'Pediu para falar com a equipe sobre a sala em Pinheiros', when: 'Hoje, 16:30' },
  { id: 'fu-2', name: 'Larissa Pires', detail: 'Ainda escolhe o horário da visita na kitnet', when: 'Amanhã, 10:00' },
]

export const demoRemarketing = [
  { id: 'rm-1', name: 'Quem viu o imóvel e não agendou visita', window: '7 dias', status: 'Prévia' },
  { id: 'rm-2', name: 'Visita feita sem retorno', window: '14 dias', status: 'Prévia' },
]

export const demoAutoReplies = [
  { id: 'auto-1', title: 'Fora do horário', text: 'Recebemos sua mensagem. A equipe responde no próximo horário de atendimento.' },
  { id: 'auto-2', title: 'Primeiro contato', text: 'Olá. Posso te ajudar a encontrar um horário de visita?' },
]

export const demoScheduledMessages = [
  { id: 'sch-1', name: 'Beatriz Lima', channel: 'WhatsApp', when: 'Hoje, 18:00', text: 'Como foi a visita? Se quiser, deixe sua avaliação no Google.' },
  { id: 'sch-2', name: 'Ana Beatriz Costa', channel: 'Instagram', when: 'Amanhã, 09:00', text: 'Separei dois horários ilustrativos para a sua visita.' },
]

export const externalCalendars = [
  { id: 'google', name: 'Google Calendar', detail: 'A imobiliária continua na agenda que já usa. A sincronização entra na implantação.' },
]

export const CHANNEL_LABEL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
}

export const demoDashboardLeads = [
  { id: 'maria', name: 'Maria Silva', property: 'Apto 2 dorm. · Vila Madalena', temperature: 'quente', column: 'em-atendimento', broker: 'Carlos Mendes', waiting: true, helenaActive: true, waitingFor: '12 min' },
  { id: 'joao', name: 'João Pedro', property: 'Casa em condomínio · Alphaville', temperature: 'morno', column: 'em-atendimento', broker: 'Ana Souza', waiting: true, helenaActive: true, waitingFor: '28 min' },
  { id: 'rafael', name: 'Rafael Nunes', property: 'Sala comercial · Pinheiros', temperature: 'quente', column: 'em-atendimento', broker: 'Carlos Mendes', waiting: true, helenaActive: false, waitingFor: '9 min' },
  { id: 'larissa', name: 'Larissa Pires', property: 'Kitnet · Vila Mariana', temperature: 'frio', column: 'em-atendimento', helenaActive: true, waiting: false },
  { id: 'camila', name: 'Camila Rocha', property: 'Apto 3 dorm. · Jardins', temperature: 'morno', column: 'qualificados', broker: 'Ana Souza', assumptionMinutes: 7 },
  { id: 'beatriz', name: 'Beatriz Lima', property: 'Cobertura · Moema', temperature: 'quente', column: 'agendados', broker: 'Carlos Mendes', assumptionMinutes: 4 },
  { id: 'pedro', name: 'Pedro Henrique Souza', property: 'Casa · Granja Viana', temperature: 'quente', column: 'agendados', broker: 'Carlos Mendes', assumptionMinutes: 5 },
  { id: 'thiago', name: 'Thiago Mendes', property: 'Apto 2 dorm. · Moema', temperature: 'morno', column: 'agendados', broker: 'Ana Souza', assumptionMinutes: 5 },
  { id: 'fernanda', name: 'Fernanda Oliveira', property: 'Apto · Brooklin', temperature: 'morno', column: 'fechados', broker: 'Ana Souza', assumptionMinutes: 6 },
  { id: 'gustavo', name: 'Gustavo Martins', property: 'Casa em condomínio · Alphaville', temperature: 'quente', column: 'fechados', broker: 'Carlos Mendes', assumptionMinutes: 3 },
]

export const demoVisits = [
  { id: 'v-thiago', leadId: 'thiago', name: 'Thiago Mendes', property: 'Apto 2 dorm. · Moema', time: '11:00', status: 'no_show', broker: 'Ana Souza' },
  { id: 'v-pedro', leadId: 'pedro', name: 'Pedro Henrique Souza', property: 'Casa · Granja Viana', time: '15:00', status: 'attended', broker: 'Carlos Mendes' },
  { id: 'v-beatriz', leadId: 'beatriz', name: 'Beatriz Lima', property: 'Cobertura · Moema', time: '16:00', status: 'scheduled', broker: 'Carlos Mendes' },
]
