const t = (hh, mm) => `2026-11-09T${hh}:${mm}:00.000-03:00`

function thread(id, name, procedure, waiting, messages) {
  return { id, name, procedure, waiting, channelLabel: 'Demonstração', messages }
}

export const demoWhatsappThreads = [
  thread('wa-maria', 'Maria Silva', 'Botox', true, [
    { id: 'wa-maria-1', role: 'ia', text: 'Oi, Maria. Vi seu interesse na avaliação de Botox. Posso te explicar como a consulta funciona?', at: t('09', '14') },
    { id: 'wa-maria-2', role: 'cliente', text: 'Quero entender como funciona a avaliação. Ainda estou pesquisando.', at: t('09', '16') },
  ]),
  thread('wa-joao', 'João Pedro', 'Implante capilar', true, [
    { id: 'wa-joao-1', role: 'cliente', text: 'Bom dia. Queria saber se a avaliação de implante pode ser nesta semana.', at: t('08', '41') },
    { id: 'wa-joao-2', role: 'humano', text: 'João, deixo dois horários ilustrativos: quinta às 10h ou sexta às 16h.', at: t('08', '48') },
    { id: 'wa-joao-3', role: 'cliente', text: 'Pode ser sexta. Ainda é só uma conversa de demonstração, certo?', at: t('08', '52') },
  ]),
  thread('wa-beatriz', 'Beatriz Lima', 'Lifting de sobrancelha', false, [
    { id: 'wa-beatriz-1', role: 'cliente', text: 'Confirmo a consulta de hoje.', at: t('07', '50') },
    { id: 'wa-beatriz-2', role: 'humano', text: 'Confirmado na amostra. Nenhum lembrete saiu do WhatsApp real.', at: t('07', '55') },
  ]),
]

export const demoInstagramThreads = [
  thread('ig-ana', 'Ana Beatriz Costa', 'Preenchimento labial', true, [
    { id: 'ig-ana-1', role: 'cliente', text: 'Vi o procedimento no feed. A avaliação é presencial?', at: t('10', '02') },
    { id: 'ig-ana-2', role: 'ia', text: 'Oi, Ana. Sim, a indicação fica na consulta. Este direct é só uma demonstração.', at: t('10', '06') },
  ]),
  thread('ig-camila', 'Camila Rocha', 'Rinoplastia', false, [
    { id: 'ig-camila-1', role: 'cliente', text: 'Vocês atendem rinoplastia?', at: t('11', '05') },
    { id: 'ig-camila-2', role: 'humano', text: 'Atendemos. A conversa fica nesta amostra e não entra no WhatsApp.', at: t('11', '12') },
  ]),
]

export const demoCommentRules = [
  { id: 'preco', keyword: 'preço', reply: 'Te respondi no direct com os próximos horários de avaliação.', active: true },
  { id: 'botox', keyword: 'botox', reply: 'A avaliação presencial define o plano. Posso te chamar no direct.', active: true },
  { id: 'agenda', keyword: 'agenda', reply: 'Vou te enviar as janelas da semana por mensagem direta.', active: false },
]

export const demoPortfolio = [
  { id: 'botox', name: 'Botox', kind: 'Procedimento', price: 1800, offer: 'Avaliação desta semana com retorno incluso na amostra' },
  { id: 'labial', name: 'Preenchimento labial', kind: 'Procedimento', price: 2200, offer: 'Condição ilustrativa para o primeiro retorno' },
  { id: 'capilar', name: 'Implante capilar', kind: 'Procedimento', price: 12000, offer: 'Plano apresentado só depois da avaliação' },
  { id: 'pele', name: 'Limpeza de pele', kind: 'Protocolo', price: 280, offer: 'Horário de encaixe na agenda interna' },
  { id: 'bio', name: 'Bioestimulador', kind: 'Procedimento', price: 2400, offer: 'Sem oferta automática até a equipe confirmar' },
  { id: 'skin', name: 'Skinbooster', kind: 'Protocolo', price: 1600, offer: 'Pacote de três sessões, só na vitrine da amostra' },
]

export const demoReviews = [
  { id: 'rev-1', name: 'Fernanda Oliveira', source: 'Google', stars: 5, text: 'Fui muito bem recebida na avaliação. Equipe clara e sem pressa.', at: '08/11' },
  { id: 'rev-2', name: 'Gustavo Martins', source: 'Google', stars: 5, text: 'Explicaram o implante com calma. Saí sabendo o próximo passo.', at: '08/11' },
  { id: 'rev-3', name: 'Helena Duarte', source: 'Google', stars: 4, text: 'Gostei do atendimento. Ainda vou decidir o mês do procedimento.', at: '07/11' },
]

export const demoCampaigns = [
  { id: 'camp-1', name: 'Lembrete de avaliação', audience: 'Interesses em Botox', when: 'Amanhã, 09:30', status: 'Prévia' },
  { id: 'camp-2', name: 'Retorno de quem ficou em silêncio', audience: 'Sem resposta há 3 dias', when: 'Sexta, 11:00', status: 'Prévia' },
]

export const demoFollowups = [
  { id: 'fu-1', name: 'Rafael Nunes', detail: 'Pediu para falar com a equipe sobre harmonização', when: 'Hoje, 16:30' },
  { id: 'fu-2', name: 'Larissa Pires', detail: 'Ainda escolhe o horário da limpeza de pele', when: 'Amanhã, 10:00' },
]

export const demoRemarketing = [
  { id: 'rm-1', name: 'Quem visitou o portfólio e não agendou', window: '7 dias', status: 'Prévia' },
  { id: 'rm-2', name: 'Avaliação feita sem retorno', window: '14 dias', status: 'Prévia' },
]

export const demoAutoReplies = [
  { id: 'auto-1', title: 'Fora do horário', text: 'Recebemos sua mensagem. A equipe responde no próximo horário de atendimento.' },
  { id: 'auto-2', title: 'Primeiro contato', text: 'Olá. Posso te ajudar a encontrar um horário de avaliação?' },
]

export const demoScheduledMessages = [
  { id: 'sch-1', name: 'Beatriz Lima', channel: 'WhatsApp', when: 'Hoje, 18:00', text: 'Como foi a consulta? Se quiser, deixe sua avaliação no Google.' },
  { id: 'sch-2', name: 'Ana Beatriz Costa', channel: 'Instagram', when: 'Amanhã, 09:00', text: 'Separei dois horários ilustrativos para a sua avaliação.' },
]

export const externalCalendars = [
  { id: 'google', name: 'Google Calendar', detail: 'A clínica continua na agenda que já usa. A sincronização entra na implantação.' },
  { id: 'doctoralia', name: 'Doctoralia', detail: 'Os horários publicados lá podem passar a aparecer aqui, sem troca brusca.' },
  { id: 'iclinic', name: 'iClinic', detail: 'A agenda interna do Automatize convive com o sistema atual da recepção.' },
]

export const CHANNEL_LABEL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
}
