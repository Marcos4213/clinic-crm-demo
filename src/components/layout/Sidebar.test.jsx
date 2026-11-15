import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App.jsx'

function desktopMedia() {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
}

function compactMedia() {
  window.matchMedia = (query) => ({
    matches: query.includes('max-width: 1023px'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
}

beforeEach(() => {
  window.location.hash = '#/demo'
  localStorage.clear()
  desktopMedia()
})

describe('Plantão sidebar', () => {
  it('shows every section on the desktop sidebar, including former Mais destinations', () => {
    render(<App />)
    const sidebar = screen.getByRole('complementary', { name: 'Seções do Plantão' })
    for (const label of ['Início', 'Conversas', 'Leads', 'Visitas', 'Imóveis', 'WhatsApp', 'Instagram', 'Equipe', 'Relatórios', 'Avaliações', 'Ajustes', 'Integrações']) {
      expect(within(sidebar).getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(within(sidebar).getByRole('button', { name: /Alertas/ })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Ajuda' })).toBeInTheDocument()
    expect(within(sidebar).getByText('Operação')).toBeInTheDocument()
    expect(within(sidebar).getByText('Canais')).toBeInTheDocument()
    expect(within(sidebar).getByText('Gestão')).toBeInTheDocument()
    expect(within(sidebar).getByText('Aurora Imóveis')).toBeInTheDocument()
  })

  it('shows the real stale-lead count and does not invent one', async () => {
    const user = userEvent.setup()
    render(<App />)
    const sidebar = screen.getByRole('complementary', { name: 'Seções do Plantão' })
    expect(within(sidebar).getByRole('button', { name: 'Alertas, 2' })).toBeInTheDocument()
    await user.click(within(sidebar).getByRole('button', { name: 'Alertas, 2' }))
    expect(screen.getByRole('dialog', { name: 'Central de alertas' })).toHaveTextContent('Maria Silva')
    expect(screen.getByRole('dialog', { name: 'Central de alertas' })).toHaveTextContent('João Pedro')
  })

  it('collapses to icons, persists the state, and expands again with [', async () => {
    const user = userEvent.setup()
    render(<App />)
    const sidebar = screen.getByRole('complementary', { name: 'Seções do Plantão' })
    await user.click(screen.getByRole('button', { name: 'Recolher menu' }))
    expect(localStorage.getItem('plantao.sidebarCollapsed')).toBe('1')
    expect(sidebar.className).toMatch(/lg:w-\[68px\]/)
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expandir menu' }))
    expect(localStorage.getItem('plantao.sidebarCollapsed')).toBe('0')
    expect(screen.getByRole('button', { name: 'Recolher menu' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: '[', code: 'BracketLeft' })
    expect(localStorage.getItem('plantao.sidebarCollapsed')).toBe('1')
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
  })

  it('opens the full drawer from Mais on a compact viewport', async () => {
    compactMedia()
    const user = userEvent.setup()
    render(<App />)
    const mais = screen.getByRole('button', { name: 'Mais' })
    expect(mais).toHaveAttribute('aria-expanded', 'false')
    await user.click(mais)
    expect(mais).toHaveAttribute('aria-expanded', 'true')
    const sidebar = screen.getByRole('complementary', { name: 'Seções do Plantão' })
    expect(sidebar.className).toMatch(/translate-x-0/)
    expect(within(sidebar).getByRole('link', { name: 'Relatórios' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Integrações' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Avaliações' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar menu' }))
    expect(mais).toHaveAttribute('aria-expanded', 'false')
  })
})
