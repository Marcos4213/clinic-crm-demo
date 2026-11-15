import { describe, expect, it } from 'vitest'
import { compatibleProperties, filterProperties, parseBudgetCeiling, propertyMatchesQualification } from './properties'

const listing = [
  { id: 'a', code: 'IM-1042', title: 'Apto 2 dorm. · Vila Madalena', dealType: 'venda', propertyType: 'apartamento', region: 'Vila Madalena', price: 790000, bedrooms: 2, status: 'disponivel' },
  { id: 'b', code: 'IM-1048', title: 'Apto 2 dorm. · Vila Madalena', dealType: 'venda', propertyType: 'apartamento', region: 'Vila Madalena', price: 920000, bedrooms: 2, status: 'disponivel' },
  { id: 'c', code: 'IM-1101', title: 'Casa em condomínio · Alphaville', dealType: 'aluguel', propertyType: 'casa', region: 'Alphaville', price: 7500, bedrooms: 3, status: 'disponivel' },
  { id: 'd', code: 'IM-1415', title: 'Apto · Brooklin', dealType: 'venda', propertyType: 'apartamento', region: 'Brooklin', price: 1050000, bedrooms: 2, status: 'vendido' },
]

describe('property matching', () => {
  it('parses Brazilian budget ceilings', () => {
    expect(parseBudgetCeiling('Até R$ 850 mil')).toBe(850000)
    expect(parseBudgetCeiling('Até R$ 8 mil')).toBe(8000)
    expect(parseBudgetCeiling('Até R$ 2,4 milhões')).toBe(2400000)
    expect(parseBudgetCeiling('Até R$ 2,5 mil')).toBe(2500)
  })

  it('matches by deal, region and budget and hides sold listings by default', () => {
    const maria = { dealType: 'Compra', region: 'Vila Madalena', budget: 'Até R$ 850 mil' }
    expect(compatibleProperties(listing, maria).map((item) => item.id)).toEqual(['a'])
    expect(propertyMatchesQualification(listing[1], maria)).toBe(false)
    const joao = { dealType: 'Aluguel', region: 'Alphaville', budget: 'Até R$ 8 mil' }
    expect(compatibleProperties(listing, joao).map((item) => item.id)).toEqual(['c'])
    expect(compatibleProperties(listing, { dealType: 'Compra', region: 'Brooklin', budget: 'Até R$ 1,1 milhão' })).toEqual([])
  })

  it('filters the inventory by operation, type and bedrooms', () => {
    expect(filterProperties(listing, { dealType: 'venda', type: 'apartamento', bedrooms: '2' }).map((item) => item.id)).toEqual(['a', 'b', 'd'])
    expect(filterProperties(listing, { dealType: 'aluguel', region: 'Alphaville' }).map((item) => item.id)).toEqual(['c'])
  })
})
