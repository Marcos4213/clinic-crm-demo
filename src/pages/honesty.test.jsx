import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CrmContext } from '../state/crm-context'
import Home from './Home'
import Portfolio from './Portfolio'
import Reviews from './Reviews'
import { MassPane } from './channel-panes'

const workspace = {
  mode: 'workspace',
  role: 'owner',
  clinic: { name: 'Clínica Aurora' },
  leads: [],
  appointments: [],
  stageEvents: [],
  integrations: [],
  reviewAsks: [],
}

function renderWorkspace(ui) {
  return render(
    <MemoryRouter>
      <CrmContext.Provider value={workspace}>{ui}</CrmContext.Provider>
    </MemoryRouter>,
  )
}

describe('real account stays honest', () => {
  it('does not invent pipeline revenue, reviews, or campaigns', () => {
    renderWorkspace(<Home />)
    expect(screen.getByText('Ativado na implantação')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp não conectado')).toBeInTheDocument()
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()

    renderWorkspace(<Reviews />)
    expect(screen.getByRole('heading', { name: 'A captação ainda não está ligada' })).toBeInTheDocument()
    expect(screen.queryByText('Fernanda Oliveira')).not.toBeInTheDocument()

    renderWorkspace(<Portfolio />)
    expect(screen.getByRole('heading', { name: 'A vitrine ainda não foi cadastrada' })).toBeInTheDocument()
    expect(screen.queryByText('R$ 1.800')).not.toBeInTheDocument()

    renderWorkspace(<MassPane />)
    expect(screen.getByRole('button', { name: 'Envio desativado — sem integração' })).toBeDisabled()
    expect(screen.queryByText('Lembrete de avaliação')).not.toBeInTheDocument()
  })
})