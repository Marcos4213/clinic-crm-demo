export const PROPERTY_TYPES = [
  { id: 'apartamento', label: 'Apartamento' },
  { id: 'casa', label: 'Casa' },
  { id: 'cobertura', label: 'Cobertura' },
  { id: 'sala', label: 'Sala' },
  { id: 'kitnet', label: 'Kitnet' },
  { id: 'studio', label: 'Studio' },
]

export const DEAL_TYPES = [
  { id: 'venda', label: 'Venda' },
  { id: 'aluguel', label: 'Aluguel' },
]

export const PROPERTY_STATUSES = [
  { id: 'disponivel', label: 'Disponível' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'vendido', label: 'Vendido' },
  { id: 'alugado', label: 'Alugado' },
]

export const SALE_RANGES = [
  { id: 's1', label: 'Até R$ 800 mil', min: 0, max: 800000 },
  { id: 's2', label: 'R$ 800 mil a R$ 1,5 mi', min: 800000, max: 1500000 },
  { id: 's3', label: 'R$ 1,5 mi a R$ 3 mi', min: 1500000, max: 3000000 },
  { id: 's4', label: 'Acima de R$ 3 mi', min: 3000000, max: Infinity },
]

export const RENT_RANGES = [
  { id: 'r1', label: 'Até R$ 3 mil', min: 0, max: 3000 },
  { id: 'r2', label: 'R$ 3 a 8 mil', min: 3000, max: 8000 },
  { id: 'r3', label: 'R$ 8 a 15 mil', min: 8000, max: 15000 },
  { id: 'r4', label: 'Acima de R$ 15 mil', min: 15000, max: Infinity },
]

export function propertyTypeLabel(id) {
  return PROPERTY_TYPES.find((item) => item.id === id)?.label ?? id
}

export function dealTypeLabel(id) {
  return DEAL_TYPES.find((item) => item.id === id)?.label ?? id
}

export function propertyStatusLabel(status, dealType) {
  if (status === 'vendido' || status === 'alugado') {
    return dealType === 'aluguel' || status === 'alugado' ? 'Alugado' : 'Vendido'
  }
  return PROPERTY_STATUSES.find((item) => item.id === status)?.label ?? status
}

export function formatPropertyPrice(property) {
  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price ?? 0)
  return property.dealType === 'aluguel' ? `${amount}/mês` : amount
}

function parsePtNumber(value) {
  if (value.includes(',')) return Number(value.replace(/\./g, '').replace(',', '.'))
  return Number(value.replace(/\./g, ''))
}

export function parseBudgetCeiling(text) {
  if (!text) return null
  const raw = String(text).toLowerCase()
  const million = /([\d]+(?:[.,]\d+)?)\s*milh(?:[oõ]es|[aã]o)/.exec(raw)
  if (million) return Math.round(parsePtNumber(million[1]) * 1_000_000)
  const mil = /([\d]+(?:[.,]\d+)?)\s*mil\b/.exec(raw)
  if (mil) return Math.round(parsePtNumber(mil[1]) * 1_000)
  const currency = /r\$\s*([\d.]+(?:,\d+)?)/.exec(raw)
  if (currency) return Math.round(parsePtNumber(currency[1]))
  return null
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function qualificationDealType(qualification) {
  const value = normalize(qualification?.dealType)
  if (value === 'compra' || value === 'venda') return 'venda'
  if (value === 'aluguel') return 'aluguel'
  return null
}

export function propertyMatchesQualification(property, qualification) {
  if (!property || !qualification) return false
  const deal = qualificationDealType(qualification)
  if (deal && property.dealType !== deal) return false
  const region = normalize(qualification.region)
  if (region) {
    const haystack = `${property.region} ${property.title}`
    if (!normalize(haystack).includes(region)) return false
  }
  const ceiling = parseBudgetCeiling(qualification.budget)
  if (ceiling != null && Number(property.price) > ceiling) return false
  return true
}

export function compatibleProperties(properties = [], qualification, { includeClosed = false } = {}) {
  return properties.filter((property) => {
    if (!includeClosed && (property.status === 'vendido' || property.status === 'alugado')) return false
    return propertyMatchesQualification(property, qualification)
  })
}

export function filterProperties(properties = [], filters = {}) {
  return properties.filter((property) => {
    if (filters.dealType && property.dealType !== filters.dealType) return false
    if (filters.type && property.propertyType !== filters.type) return false
    if (filters.region && property.region !== filters.region) return false
    if (filters.bedrooms) {
      if (filters.bedrooms === '4+' && property.bedrooms < 4) return false
      if (filters.bedrooms !== '4+' && String(property.bedrooms) !== String(filters.bedrooms)) return false
    }
    if (filters.rangeId) {
      const ranges = property.dealType === 'aluguel' ? RENT_RANGES : SALE_RANGES
      const range = ranges.find((item) => item.id === filters.rangeId)
      if (!range || property.price < range.min || property.price >= range.max) return false
    }
    if (filters.query) {
      const q = normalize(filters.query)
      const blob = normalize([property.code, property.title, property.region, property.propertyType].join(' '))
      if (!blob.includes(q)) return false
    }
    return true
  })
}

export function propertyRegions(properties = []) {
  return [...new Set(properties.map((item) => item.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function nextPropertyCode(properties = []) {
  const numbers = properties
    .map((item) => Number(/(\d+)/.exec(item.code || '')?.[1] || 0))
    .filter((value) => Number.isFinite(value))
  const next = Math.max(1000, ...numbers) + 1
  return `IM-${next}`
}

export function priceRangesFor(dealType) {
  if (dealType === 'aluguel') return RENT_RANGES
  if (dealType === 'venda') return SALE_RANGES
  return [...SALE_RANGES, ...RENT_RANGES]
}
