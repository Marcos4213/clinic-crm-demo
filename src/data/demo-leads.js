const at = (day, hh, mm) => `2026-11-${day}T${hh}:${mm}:00.000-03:00`

export const demoBrokers = [
  { id: 'carlos', name: 'Carlos Mendes', active: true, sortOrder: 1 },
  { id: 'ana', name: 'Ana Souza', active: true, sortOrder: 2 },
  { id: 'paulo', name: 'Paulo Ribeiro', active: true, sortOrder: 3 },
  { id: 'lucia', name: 'Lúcia Ferreira', active: false, sortOrder: 4 },
]

export const demoNextBrokerId = 'paulo'

function profile(entry) {
  return {
    helenaActive: false,
    waiting: false,
    notes: [],
    events: [],
    messages: [],
    nextStep: null,
    qualification: null,
    ...entry,
  }
}

export const demoLeadProfiles = [
  profile({
    id: 'maria',
    name: 'Maria Silva',
    property: 'Apto 2 dorm. · Vila Madalena',
    temperature: 'quente',
    brokerId: 'carlos',
    waiting: true,
    helenaActive: true,
    waitingFor: '12 min',
    qualification: {
      dealType: 'Compra',
      region: 'Vila Madalena',
      budget: 'Até R$ 850 mil',
      payment: 'Entrada e financiamento',
      deadline: 'Este mês',
    },
    nextStep: { text: 'Agendar visita', at: '2026-11-17', brokerId: 'carlos' },
    notes: [
      { id: 'note-maria-1', author: 'Luciana', body: 'Prefere andar alto e vaga coberta. Combinar visita ainda esta semana.', at: at('09', '11', '05') },
    ],
    events: [
      { id: 'ev-maria-1', type: 'qualification', actor: 'Helena', detail: 'Compra, Vila Madalena, até R$ 850 mil, entrada e financiamento, este mês.', at: at('09', '09', '16') },
      { id: 'ev-maria-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para quente.', at: at('09', '09', '17') },
      { id: 'ev-maria-3', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Carlos Mendes, corretor da vez.', at: at('09', '09', '18') },
    ],
    messages: [
      { id: 'wa-maria-1', role: 'ia', text: 'Oi, Maria. Vi seu interesse no apartamento de 2 dormitórios na Vila Madalena. É para compra ou aluguel?', at: at('09', '09', '14') },
      { id: 'wa-maria-2', role: 'cliente', text: 'Compra. Quero nessa região, até 850 mil, com entrada e financiamento. Preciso ver ainda este mês.', at: at('09', '09', '16') },
      { id: 'wa-maria-3', role: 'ia', text: 'Combinado. Faixa e prazo fecham com o que temos. Posso te passar para o Carlos, corretor da vez, e agendar a visita?', at: at('09', '09', '18') },
    ],
  }),
  profile({
    id: 'joao',
    name: 'João Pedro',
    property: 'Casa em condomínio · Alphaville',
    temperature: 'morno',
    brokerId: 'ana',
    waiting: true,
    helenaActive: true,
    waitingFor: '28 min',
    qualification: {
      dealType: 'Aluguel',
      region: 'Alphaville',
      budget: 'Até R$ 8 mil',
      payment: 'Aluguel mensal',
      deadline: '30 dias',
    },
    nextStep: { text: 'Enviar duas opções de casa', at: '2026-11-16', brokerId: 'ana' },
    notes: [
      { id: 'note-joao-1', author: 'Luciana', body: 'Quer condomínio com lazer. Sem pressa de visita até ver a faixa.', at: at('09', '10', '20') },
    ],
    events: [
      { id: 'ev-joao-1', type: 'qualification', actor: 'Helena', detail: 'Aluguel, Alphaville, até R$ 8 mil, mudar em 30 dias.', at: at('09', '08', '52') },
      { id: 'ev-joao-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para morno.', at: at('09', '08', '53') },
      { id: 'ev-joao-3', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Ana Souza, corretor da vez.', at: at('09', '08', '54') },
    ],
    messages: [
      { id: 'wa-joao-1', role: 'cliente', text: 'Bom dia. Queria um aluguel de casa em Alphaville, até 8 mil.', at: at('09', '08', '41') },
      { id: 'wa-joao-2', role: 'ia', text: 'Oi, João. Aluguel em Alphaville, até R$ 8 mil. Qual o prazo para mudar?', at: at('09', '08', '48') },
      { id: 'wa-joao-3', role: 'cliente', text: 'Se achar uma boa, em 30 dias está bom.', at: at('09', '08', '52') },
    ],
  }),
  profile({
    id: 'rafael',
    name: 'Rafael Nunes',
    property: 'Sala comercial · Pinheiros',
    temperature: 'quente',
    brokerId: 'carlos',
    waiting: true,
    helenaActive: false,
    waitingFor: '9 min',
    qualification: {
      dealType: 'Aluguel',
      region: 'Pinheiros',
      budget: 'Até R$ 12 mil',
      payment: 'Aluguel e condomínio',
      deadline: 'Este mês',
    },
    nextStep: { text: 'Confirmar horário de visita', at: '2026-11-16', brokerId: 'carlos' },
    notes: [
      { id: 'note-rafael-1', author: 'Luciana', body: 'Assumi e deixei com o Carlos. Cliente já escolheu a sala.', at: at('14', '11', '40') },
    ],
    events: [
      { id: 'ev-rafael-1', type: 'qualification', actor: 'Helena', detail: 'Aluguel comercial em Pinheiros, até R$ 12 mil, este mês.', at: at('14', '10', '12') },
      { id: 'ev-rafael-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para quente.', at: at('14', '10', '13') },
      { id: 'ev-rafael-3', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Carlos Mendes, corretor da vez.', at: at('14', '10', '14') },
      { id: 'ev-rafael-4', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('14', '11', '38') },
    ],
    messages: [
      { id: 'msg-rafael-1', role: 'cliente', text: 'Procuro sala em Pinheiros, até 12 mil, para este mês.', at: at('14', '10', '05') },
      { id: 'msg-rafael-2', role: 'ia', text: 'Tenho uma sala que fecha com a faixa. Posso te passar para o Carlos?', at: at('14', '10', '14') },
      { id: 'msg-rafael-3', role: 'humano', actor: 'Luciana', text: 'Rafael, o Carlos te atende e já deixa um horário de visita.', at: at('14', '11', '40') },
    ],
  }),
  profile({
    id: 'larissa',
    name: 'Larissa Pires',
    property: 'Kitnet · Vila Mariana',
    temperature: 'frio',
    helenaActive: true,
    qualification: {
      dealType: 'Aluguel',
      region: 'Vila Mariana',
      budget: 'Até R$ 2,5 mil',
      payment: 'A definir',
      deadline: 'Sem prazo',
    },
    nextStep: { text: 'Retomar em 7 dias', at: '2026-11-22', brokerId: 'paulo' },
    events: [
      { id: 'ev-larissa-1', type: 'qualification', actor: 'Helena', detail: 'Aluguel de kitnet na Vila Mariana, até R$ 2,5 mil, sem prazo.', at: at('08', '17', '20') },
      { id: 'ev-larissa-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para frio.', at: at('08', '17', '21') },
    ],
    messages: [
      { id: 'msg-larissa-1', role: 'cliente', text: 'Estou só pesquisando kitnet na Vila Mariana. Ainda não sei quando mudo.', at: at('08', '17', '12') },
      { id: 'msg-larissa-2', role: 'ia', text: 'Tudo bem, Larissa. Quando tiver um prazo, eu te mostro as opções da faixa.', at: at('08', '17', '20') },
    ],
  }),
  profile({
    id: 'camila',
    name: 'Camila Rocha',
    property: 'Apto 3 dorm. · Jardins',
    temperature: 'morno',
    brokerId: 'ana',
    qualification: {
      dealType: 'Compra',
      region: 'Jardins',
      budget: 'Até R$ 2,4 milhões',
      payment: 'À vista e permuta',
      deadline: '60 dias',
    },
    nextStep: { text: 'Enviar documentação do imóvel', at: '2026-11-18', brokerId: 'ana' },
    events: [
      { id: 'ev-camila-1', type: 'qualification', actor: 'Helena', detail: 'Compra nos Jardins, até R$ 2,4 milhões, à vista e permuta.', at: at('07', '15', '10') },
      { id: 'ev-camila-2', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Ana Souza, corretor da vez.', at: at('07', '15', '12') },
      { id: 'ev-camila-3', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('07', '15', '40') },
    ],
  }),
  profile({
    id: 'beatriz',
    name: 'Beatriz Lima',
    property: 'Cobertura · Moema',
    temperature: 'quente',
    brokerId: 'carlos',
    qualification: {
      dealType: 'Compra',
      region: 'Moema',
      budget: 'Até R$ 3,2 milhões',
      payment: 'Financiamento',
      deadline: 'Este mês',
    },
    nextStep: { text: 'Realizar a visita', at: '2026-11-15', brokerId: 'carlos' },
    notes: [
      { id: 'note-beatriz-1', author: 'Luciana', body: 'Visita confirmada hoje às 16h. Carlos espera no imóvel.', at: at('15', '07', '56') },
    ],
    events: [
      { id: 'ev-beatriz-1', type: 'qualification', actor: 'Helena', detail: 'Compra de cobertura em Moema, até R$ 3,2 milhões, financiamento.', at: at('12', '16', '04') },
      { id: 'ev-beatriz-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para quente.', at: at('12', '16', '05') },
      { id: 'ev-beatriz-3', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Carlos Mendes, corretor da vez.', at: at('12', '16', '06') },
      { id: 'ev-beatriz-4', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('13', '09', '12') },
      { id: 'ev-beatriz-5', type: 'visit', actor: 'Carlos Mendes', detail: 'Visita marcada para hoje às 16:00 na cobertura de Moema.', at: at('15', '07', '55') },
    ],
    messages: [
      { id: 'wa-beatriz-1', role: 'cliente', text: 'Confirmo a visita de hoje às 16h.', at: at('15', '07', '50') },
      { id: 'wa-beatriz-2', role: 'humano', actor: 'Luciana', text: 'Confirmado, Beatriz. O Carlos te espera às 16h no imóvel.', at: at('15', '07', '55') },
    ],
  }),
  profile({
    id: 'pedro',
    name: 'Pedro Henrique Souza',
    property: 'Casa · Granja Viana',
    temperature: 'quente',
    brokerId: 'carlos',
    qualification: {
      dealType: 'Compra',
      region: 'Granja Viana',
      budget: 'Até R$ 1,8 milhão',
      payment: 'Entrada e financiamento',
      deadline: '90 dias',
    },
    nextStep: { text: 'Registrar resultado da visita', at: '2026-11-15', brokerId: 'carlos' },
    events: [
      { id: 'ev-pedro-1', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Carlos Mendes, corretor da vez.', at: at('14', '09', '20') },
      { id: 'ev-pedro-2', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('14', '09', '40') },
      { id: 'ev-pedro-3', type: 'visit', actor: 'Carlos Mendes', detail: 'Visita realizada hoje às 15:00.', at: at('15', '15', '00') },
    ],
  }),
  profile({
    id: 'thiago',
    name: 'Thiago Mendes',
    property: 'Apto 2 dorm. · Moema',
    temperature: 'morno',
    brokerId: 'ana',
    qualification: {
      dealType: 'Compra',
      region: 'Moema',
      budget: 'Até R$ 980 mil',
      payment: 'Financiamento',
      deadline: 'Este mês',
    },
    nextStep: { text: 'Remarcar visita', at: '2026-11-16', brokerId: 'ana' },
    notes: [
      { id: 'note-thiago-1', author: 'Luciana', body: 'Não compareceu às 11h. Ana reagenda amanhã.', at: at('15', '11', '25') },
    ],
    events: [
      { id: 'ev-thiago-1', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Ana Souza, corretor da vez.', at: at('13', '14', '02') },
      { id: 'ev-thiago-2', type: 'visit', actor: 'Ana Souza', detail: 'No-show na visita das 11:00.', at: at('15', '11', '20') },
    ],
  }),
  profile({
    id: 'fernanda',
    name: 'Fernanda Oliveira',
    property: 'Apto · Brooklin',
    temperature: 'morno',
    brokerId: 'ana',
    qualification: {
      dealType: 'Compra',
      region: 'Brooklin',
      budget: 'Até R$ 1,1 milhão',
      payment: 'Financiamento',
      deadline: 'Concluído',
    },
    nextStep: { text: 'Acompanhar assinatura', at: '2026-11-20', brokerId: 'ana' },
    events: [
      { id: 'ev-fernanda-1', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Ana Souza, corretor da vez.', at: at('04', '11', '10') },
      { id: 'ev-fernanda-2', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('04', '11', '30') },
    ],
  }),
  profile({
    id: 'gustavo',
    name: 'Gustavo Martins',
    property: 'Casa em condomínio · Alphaville',
    temperature: 'quente',
    brokerId: 'carlos',
    qualification: {
      dealType: 'Compra',
      region: 'Alphaville',
      budget: 'Até R$ 2,1 milhões',
      payment: 'À vista',
      deadline: 'Concluído',
    },
    nextStep: { text: 'Encerrar pasta do lead', at: '2026-11-18', brokerId: 'carlos' },
    events: [
      { id: 'ev-gustavo-1', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Carlos Mendes, corretor da vez.', at: at('02', '16', '12') },
      { id: 'ev-gustavo-2', type: 'assumed', actor: 'Luciana', detail: 'Luciana assumiu o atendimento.', at: at('02', '16', '40') },
    ],
  }),
  profile({
    id: 'helena',
    name: 'Helena Duarte',
    property: 'Apto 1 dorm. · Pinheiros',
    temperature: 'morno',
    brokerId: 'paulo',
    qualification: {
      dealType: 'Aluguel',
      region: 'Pinheiros',
      budget: 'Até R$ 4,5 mil',
      payment: 'Aluguel mensal',
      deadline: '45 dias',
    },
    nextStep: { text: 'Enviar duas plantas', at: '2026-11-17', brokerId: 'paulo' },
    events: [
      { id: 'ev-helena-1', type: 'qualification', actor: 'Helena', detail: 'Aluguel em Pinheiros, até R$ 4,5 mil, 45 dias.', at: at('10', '13', '22') },
      { id: 'ev-helena-2', type: 'assigned', actor: 'Roleta', detail: 'Caiu para Paulo Ribeiro, corretor da vez.', at: at('10', '13', '23') },
    ],
  }),
  profile({
    id: 'ana',
    name: 'Ana Beatriz Costa',
    property: 'Studio · Vila Olímpia',
    temperature: 'frio',
    helenaActive: true,
    qualification: {
      dealType: 'Compra',
      region: 'Vila Olímpia',
      budget: 'Até R$ 620 mil',
      payment: 'A definir',
      deadline: 'Sem prazo',
    },
    nextStep: { text: 'Aguardar retorno', at: '2026-11-21', brokerId: 'paulo' },
    events: [
      { id: 'ev-ana-1', type: 'qualification', actor: 'Helena', detail: 'Compra de studio na Vila Olímpia, até R$ 620 mil, sem prazo.', at: at('11', '18', '40') },
      { id: 'ev-ana-2', type: 'temperature', actor: 'Helena', detail: 'Mudou para frio.', at: at('11', '18', '41') },
    ],
  }),
]

export function cloneBrokers() {
  return demoBrokers.map((broker) => ({ ...broker }))
}

export function cloneLeadProfiles() {
  return demoLeadProfiles.map((lead) => ({
    ...lead,
    qualification: lead.qualification ? { ...lead.qualification } : null,
    nextStep: lead.nextStep ? { ...lead.nextStep } : null,
    notes: lead.notes.map((note) => ({ ...note })),
    events: lead.events.map((event) => ({ ...event })),
    messages: lead.messages.map((message) => ({ ...message })),
  }))
}
