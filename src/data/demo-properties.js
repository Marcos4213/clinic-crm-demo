import { clinicDateKey } from '../domain/insights'
import { shiftDateKey, startOfWeekKey } from '../domain/visits'
import { zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'

export const demoProperties = [
  { id: 'im-1042', code: 'IM-1042', title: 'Apto 2 dorm. · Vila Madalena', dealType: 'venda', propertyType: 'apartamento', region: 'Vila Madalena', price: 790000, bedrooms: 2, area: 68, status: 'disponivel', photo: '/imoveis/im-1042.svg', details: 'Andar alto, vaga coberta.' },
  { id: 'im-1048', code: 'IM-1048', title: 'Apto 2 dorm. · Vila Madalena', dealType: 'venda', propertyType: 'apartamento', region: 'Vila Madalena', price: 920000, bedrooms: 2, area: 74, status: 'disponivel', photo: '/imoveis/im-1048.svg', details: 'Acima da faixa da Maria.' },
  { id: 'im-1101', code: 'IM-1101', title: 'Casa em condomínio · Alphaville', dealType: 'aluguel', propertyType: 'casa', region: 'Alphaville', price: 7500, bedrooms: 3, area: 180, status: 'disponivel', photo: '/imoveis/im-1101.svg', details: 'Lazer completo, 3 suítes.' },
  { id: 'im-1107', code: 'IM-1107', title: 'Casa em condomínio · Alphaville', dealType: 'venda', propertyType: 'casa', region: 'Alphaville', price: 2100000, bedrooms: 4, area: 260, status: 'reservado', photo: '/imoveis/im-1107.svg', details: 'Reserva do Gustavo em andamento.' },
  { id: 'im-2030', code: 'IM-2030', title: 'Cobertura · Moema', dealType: 'venda', propertyType: 'cobertura', region: 'Moema', price: 3150000, bedrooms: 3, area: 210, status: 'reservado', photo: '/imoveis/im-2030.svg', details: 'Visita da Beatriz hoje às 16h.' },
  { id: 'im-1188', code: 'IM-1188', title: 'Sala comercial · Pinheiros', dealType: 'aluguel', propertyType: 'sala', region: 'Pinheiros', price: 11500, bedrooms: 0, area: 92, status: 'disponivel', photo: '/imoveis/im-1188.svg', details: 'Frente para a rua, 2 vagas.' },
  { id: 'im-0901', code: 'IM-0901', title: 'Kitnet · Vila Mariana', dealType: 'aluguel', propertyType: 'kitnet', region: 'Vila Mariana', price: 2300, bedrooms: 1, area: 28, status: 'disponivel', photo: '/imoveis/im-0901.svg', details: 'Mobiliada, perto do metrô.' },
  { id: 'im-2210', code: 'IM-2210', title: 'Apto 3 dorm. · Jardins', dealType: 'venda', propertyType: 'apartamento', region: 'Jardins', price: 2350000, bedrooms: 3, area: 148, status: 'disponivel', photo: '/imoveis/im-2210.svg', details: 'Pronto para documentar.' },
  { id: 'im-1304', code: 'IM-1304', title: 'Casa · Granja Viana', dealType: 'venda', propertyType: 'casa', region: 'Granja Viana', price: 1750000, bedrooms: 3, area: 220, status: 'disponivel', photo: '/imoveis/im-1304.svg', details: 'Visita do Pedro hoje às 15h.' },
  { id: 'im-2077', code: 'IM-2077', title: 'Apto 2 dorm. · Moema', dealType: 'venda', propertyType: 'apartamento', region: 'Moema', price: 940000, bedrooms: 2, area: 71, status: 'disponivel', photo: '/imoveis/im-2077.svg', details: 'Visita do Thiago de manhã.' },
  { id: 'im-0802', code: 'IM-0802', title: 'Studio · Vila Olímpia', dealType: 'venda', propertyType: 'studio', region: 'Vila Olímpia', price: 590000, bedrooms: 1, area: 32, status: 'disponivel', photo: '/imoveis/im-0802.svg', details: 'Na faixa da Ana Beatriz.' },
  { id: 'im-1415', code: 'IM-1415', title: 'Apto · Brooklin', dealType: 'venda', propertyType: 'apartamento', region: 'Brooklin', price: 1050000, bedrooms: 2, area: 78, status: 'vendido', photo: '/imoveis/im-1415.svg', details: 'Fechado com a Fernanda.' },
  { id: 'im-1160', code: 'IM-1160', title: 'Casa em condomínio · Alphaville', dealType: 'venda', propertyType: 'casa', region: 'Alphaville', price: 2050000, bedrooms: 4, area: 240, status: 'vendido', photo: '/imoveis/im-1160.svg', details: 'Fechado com o Gustavo.' },
  { id: 'im-1020', code: 'IM-1020', title: 'Apto 1 dorm. · Pinheiros', dealType: 'aluguel', propertyType: 'apartamento', region: 'Pinheiros', price: 4200, bedrooms: 1, area: 42, status: 'disponivel', photo: '/imoveis/im-1020.svg', details: 'Na faixa da Helena Duarte.' },
]

export const defaultLinkedProperties = {
  beatriz: 'im-2030',
  pedro: 'im-1304',
  thiago: 'im-2077',
  fernanda: 'im-1415',
  gustavo: 'im-1160',
}

function visitAt(dateKey, time, rest) {
  const start = zonedLocalToUtc(dateKey, time)
  if (!start) return null
  return {
    ...rest,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
    reminderStatus: 'pendente_envio',
  }
}

export function seedDemoVisits(today = clinicDateKey()) {
  const monday = startOfWeekKey(today)
  const thursday = shiftDateKey(monday, 3)
  const friday = shiftDateKey(monday, 4)
  return [
    visitAt(thursday, '14:00', { id: 'v-rafael', leadId: 'rafael', propertyId: 'im-1188', brokerId: 'carlos', status: 'agendada' }),
    visitAt(friday, '10:00', { id: 'v-camila', leadId: 'camila', propertyId: 'im-2210', brokerId: 'ana', status: 'agendada' }),
    visitAt(today, '11:00', { id: 'v-thiago', leadId: 'thiago', propertyId: 'im-2077', brokerId: 'ana', status: 'no_show' }),
    visitAt(today, '15:00', { id: 'v-pedro', leadId: 'pedro', propertyId: 'im-1304', brokerId: 'carlos', status: 'feita' }),
    visitAt(today, '16:00', { id: 'v-beatriz', leadId: 'beatriz', propertyId: 'im-2030', brokerId: 'carlos', status: 'confirmada' }),
  ].filter(Boolean)
}

export function cloneProperties() {
  return demoProperties.map((item) => ({ ...item }))
}

export function withPropertyLinks(profiles) {
  return profiles.map((lead) => ({
    ...lead,
    propertyId: lead.propertyId || defaultLinkedProperties[lead.id] || null,
    suggestedPropertyIds: lead.suggestedPropertyIds ? [...lead.suggestedPropertyIds] : [],
  }))
}
