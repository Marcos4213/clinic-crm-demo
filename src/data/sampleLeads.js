const t = (hh, mm) => `2026-11-08T${hh}:${mm}:00.000-03:00`

function msg(id, role, text, at, receipt = null) {
  return { id, role, text, at, receipt, localDemo: false }
}

const rows = [
  {
    id: 'maria',
    name: 'Maria Silva',
    phone: '+55 00 90000-0101',
    procedure: 'Apto 2 dorm. · Vila Madalena',
    temperature: 'quente',
    column: 'em-atendimento',
    aiActive: true,
    messages: [
      msg('maria-1', 'ia', 'Vi seu interesse no apartamento de 2 dormitórios na Vila Madalena.', t('09', '14'), 'read'),
      msg('maria-2', 'cliente', 'Compra. Quero nessa região, até 850 mil, com entrada e financiamento. Preciso ver ainda este mês.', t('09', '16')),
      msg(
        'maria-3',
        'ia',
        'Combinado. Faixa e prazo fecham com o que temos. Posso te passar para o Carlos e agendar a visita?',
        t('09', '18'),
        'delivered',
      ),
    ],
  },
  {
    id: 'helena',
    name: 'Helena Duarte',
    phone: '+55 00 90000-0102',
    procedure: 'Apto 1 dorm. · Pinheiros',
    temperature: 'frio',
    column: 'em-atendimento',
    aiActive: true,
    messages: [
      msg('helena-1', 'ia', 'Helena, recebemos seu interesse no apto de 1 dormitório em Pinheiros. Posso te contar as opções de aluguel?', t('09', '22'), 'read'),
      msg('helena-2', 'cliente', 'Pode sim, mas só daqui a 45 dias.', t('09', '31')),
    ],
  },
  {
    id: 'ana',
    name: 'Ana Beatriz Costa',
    phone: '+55 00 90000-0103',
    procedure: 'Studio · Vila Olímpia',
    temperature: 'quente',
    column: 'em-atendimento',
    aiActive: true,
    messages: [
      msg('ana-1', 'cliente', 'Vi o studio na Vila Olímpia e queria uma orientação inicial.', t('10', '02')),
      msg('ana-2', 'ia', 'Olá, Ana Beatriz. A orientação começa pela visita. Este canal é só uma demonstração.', t('10', '04'), 'delivered'),
    ],
  },
  {
    id: 'larissa',
    name: 'Larissa Pires',
    phone: '+55 00 90000-0104',
    procedure: 'Kitnet · Vila Mariana',
    temperature: 'frio',
    column: 'em-atendimento',
    aiActive: true,
    messages: [
      msg('larissa-1', 'ia', 'Larissa, você pediu informações sobre a kitnet na Vila Mariana. Prefere manhã ou tarde para uma visita fictícia?', t('10', '11'), 'delivered'),
      msg('larissa-2', 'cliente', 'Ainda não sei. Pode ser qualquer horário.', t('10', '20')),
    ],
  },
  {
    id: 'joao',
    name: 'João Pedro',
    phone: '+55 00 90000-0105',
    procedure: 'Casa em condomínio · Alphaville',
    temperature: 'morno',
    column: 'qualificados',
    aiActive: true,
    messages: [
      msg('joao-1', 'ia', 'Obrigado pelo interesse na casa em Alphaville. Você busca aluguel?', t('08', '40'), 'read'),
      msg('joao-2', 'cliente', 'Sim. Queria um aluguel de casa em Alphaville, até 8 mil, sem compromisso.', t('08', '46')),
      msg('joao-3', 'ia', 'Perfeito. Registro seu interesse como qualificado nesta amostra.', t('08', '48'), 'delivered'),
    ],
  },
  {
    id: 'camila',
    name: 'Camila Rocha',
    phone: '+55 00 90000-0106',
    procedure: 'Apto 3 dorm. · Jardins',
    temperature: 'quente',
    column: 'qualificados',
    aiActive: true,
    messages: [
      msg('camila-1', 'cliente', 'Quero saber sobre o apto de 3 dormitórios nos Jardins e o prazo de liberação, em linhas gerais.', t('11', '05')),
      msg('camila-2', 'ia', 'Camila, a disponibilidade e o prazo só ficam claros na visita. Posso anotar um horário fictício.', t('11', '08'), 'delivered'),
    ],
  },
  {
    id: 'rafael',
    name: 'Rafael Nunes',
    phone: '+55 00 90000-0107',
    procedure: 'Sala comercial · Pinheiros',
    temperature: 'morno',
    column: 'qualificados',
    aiActive: false,
    messages: [
      msg('rafael-1', 'ia', 'Rafael, vi seu interesse na sala comercial em Pinheiros.', t('11', '16'), 'read'),
      msg('rafael-2', 'cliente', 'Pode me passar para alguém da equipe?', t('11', '18')),
      msg('rafael-3', 'humano', 'Rafael, assumi o atendimento nesta demonstração. Nada será enviado para fora.', t('11', '21'), 'delivered'),
    ],
  },
  {
    id: 'beatriz',
    name: 'Beatriz Lima',
    phone: '+55 00 90000-0108',
    procedure: 'Cobertura · Moema',
    temperature: 'quente',
    column: 'agendados',
    aiActive: false,
    messages: [
      msg('beatriz-1', 'ia', 'Beatriz, há um horário fictício de visita na quinta às 15h.', t('12', '00'), 'read'),
      msg('beatriz-2', 'cliente', 'Pode confirmar quinta.', t('12', '04')),
      msg('beatriz-3', 'humano', 'Confirmado na amostra: quinta às 15h. Nenhum lembrete real será disparado.', t('12', '06'), 'read'),
    ],
  },
  {
    id: 'pedro',
    name: 'Pedro Henrique Souza',
    phone: '+55 00 90000-0109',
    procedure: 'Casa · Granja Viana',
    temperature: 'frio',
    column: 'agendados',
    aiActive: true,
    messages: [
      msg('pedro-1', 'ia', 'Pedro Henrique, sua visita à casa na Granja Viana ficou registrada na amostra para terça às 11h.', t('13', '10'), 'delivered'),
      msg('pedro-2', 'cliente', 'Está bom, mas talvez eu remarque.', t('13', '14')),
    ],
  },
  {
    id: 'thiago',
    name: 'Thiago Mendes',
    phone: '+55 00 90000-0110',
    procedure: 'Apto 2 dorm. · Moema',
    temperature: 'morno',
    column: 'agendados',
    aiActive: true,
    messages: [
      msg('thiago-1', 'cliente', 'Quero o apto de 2 dormitórios em Moema. Tem visita essa semana?', t('13', '30')),
      msg('thiago-2', 'ia', 'Na amostra, deixo sexta às 9h como horário ilustrativo.', t('13', '33'), 'delivered'),
    ],
  },
  {
    id: 'fernanda',
    name: 'Fernanda Oliveira',
    phone: '+55 00 90000-0111',
    procedure: 'Apto · Brooklin',
    temperature: 'morno',
    column: 'fechados',
    aiActive: false,
    messages: [
      msg('fernanda-1', 'ia', 'Fernanda, a visita ao apto no Brooklin foi concluída nesta amostra.', t('14', '02'), 'read'),
      msg('fernanda-2', 'cliente', 'Obrigada, fechei com a equipe no retorno.', t('14', '06')),
      msg('fernanda-3', 'humano', 'Protocolo encerrado no funil de demonstração.', t('14', '08'), 'read'),
    ],
  },
  {
    id: 'gustavo',
    name: 'Gustavo Martins',
    phone: '+55 00 90000-0112',
    procedure: 'Casa em condomínio · Alphaville',
    temperature: 'quente',
    column: 'fechados',
    aiActive: false,
    messages: [
      msg('gustavo-1', 'cliente', 'Fechei a casa em Alphaville depois da visita.', t('15', '12')),
      msg('gustavo-2', 'humano', 'Gustavo, deixei o lead em Fechados só nesta demonstração.', t('15', '15'), 'delivered'),
    ],
  },
]

const extras = {
  maria: { value: 1800, channel: 'whatsapp' },
  helena: { value: 2400, channel: 'whatsapp' },
  ana: { value: 2200, channel: 'instagram' },
  larissa: { value: 280, channel: 'whatsapp' },
  joao: { value: 12000, channel: 'whatsapp' },
  camila: { value: 18000, channel: 'instagram' },
  rafael: { value: 4500, channel: 'whatsapp' },
  beatriz: { value: 3500, channel: 'whatsapp' },
  pedro: { value: 350, channel: 'instagram' },
  thiago: { value: 1600, channel: 'whatsapp' },
  fernanda: { value: 1800, channel: 'whatsapp' },
  gustavo: { value: 12000, channel: 'instagram' },
}

export const sampleLeads = rows.map((lead) => ({ ...lead, sample: true, ...extras[lead.id] }))
