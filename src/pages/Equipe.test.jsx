import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CrmProvider } from '../state/CrmProvider'
import Equipe from './Equipe.jsx'

function renderEquipe() {
  return render(
    <MemoryRouter initialEntries={['/demo/equipe']}>
      <CrmProvider>
        <Equipe />
      </CrmProvider>
    </MemoryRouter>,
  )
}

describe('equipe roulette', () => {
  it('lists brokers and highlights the next in line', () => {
    renderEquipe()
    expect(screen.getByRole('heading', { name: 'Equipe' })).toBeInTheDocument()
    expect(screen.getAllByText('Paulo Ribeiro').length).toBeGreaterThan(0)
    expect(screen.getByText('Ativo · próximo da vez')).toBeInTheDocument()
    expect(screen.getByText('Lúcia Ferreira')).toBeInTheDocument()
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('pauses the current broker and advances the turn', async () => {
    const user = userEvent.setup()
    renderEquipe()
    const current = screen.getByText('Ativo · próximo da vez').closest('li')
    await user.click(within(current).getByRole('button', { name: 'Pausar' }))
    expect(within(current).getByText('Pausado')).toBeInTheDocument()
    expect(screen.getByText('Ativo · próximo da vez')).toBeInTheDocument()
    expect(screen.getAllByText('Carlos Mendes').length).toBeGreaterThan(0)
  })
})
