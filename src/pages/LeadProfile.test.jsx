import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CrmProvider } from '../state/CrmProvider'
import LeadProfile from './LeadProfile.jsx'

function renderFicha(id = 'maria') {
  return render(
    <MemoryRouter initialEntries={[`/demo/leads/${id}`]}>
      <CrmProvider>
        <Routes>
          <Route path="/demo/leads/:leadId" element={<LeadProfile />} />
        </Routes>
      </CrmProvider>
    </MemoryRouter>,
  )
}

describe('lead profile', () => {
  it('shows Helena qualification, next step, notes and timeline', () => {
    renderFicha()
    expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument()
    expect(screen.getByText('Qualificação da Helena')).toBeInTheDocument()
    expect(screen.getByText('Compra')).toBeInTheDocument()
    expect(screen.getByText('Vila Madalena')).toBeInTheDocument()
    expect(screen.getByText('Até R$ 850 mil')).toBeInTheDocument()
    expect(screen.getByText('Entrada e financiamento')).toBeInTheDocument()
    expect(screen.getByText('Este mês')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Agendar visita')).toBeInTheDocument()
    expect(screen.getByText('Prefere andar alto e vaga coberta. Combinar visita ainda esta semana.')).toBeInTheDocument()
    expect(screen.getByText('Caiu para Carlos Mendes, corretor da vez.')).toBeInTheDocument()
    expect(screen.getByText('Mudou para quente.')).toBeInTheDocument()
    expect(screen.getByText(/Posso te passar para o Carlos/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Imóveis compatíveis' })).toBeInTheDocument()
    expect(screen.getByText('IM-1042')).toBeInTheDocument()
    expect(screen.queryByText('IM-1048')).not.toBeInTheDocument()
  })

  it('records an internal note locally', async () => {
    const user = userEvent.setup()
    renderFicha()
    await user.type(screen.getByLabelText('Nova nota'), 'Cliente pediu vaga para dois carros.')
    await user.click(screen.getByRole('button', { name: 'Gravar nota' }))
    expect(screen.getByText('Cliente pediu vaga para dois carros.')).toBeInTheDocument()
  })
})
