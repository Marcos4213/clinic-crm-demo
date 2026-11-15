import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'

beforeEach(() => {
  window.location.hash = '#/demo/imoveis'
  window.matchMedia = () => ({
    matches: false,
    media: '',
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
})

describe('property inventory', () => {
  it('lists properties, filters by sale and region, and opens the form', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Imóveis' })).toBeInTheDocument()
    expect(screen.getByText('IM-1042')).toBeInTheDocument()
    expect(screen.getByText('IM-1101')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por operação' }), 'venda')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por região' }), 'Vila Madalena')
    expect(screen.getByText('IM-1042')).toBeInTheDocument()
    expect(screen.queryByText('IM-1101')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Novo imóvel' }))
    expect(screen.getByRole('heading', { name: 'Novo imóvel' })).toBeInTheDocument()
  })
})
