import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'

beforeEach(() => {
  window.location.hash = '#/'
})

describe('auth entry', () => {
  it('shows email login and the separate local demo', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir demonstração local' })).toHaveAttribute('href', '#/demo')
    await user.click(screen.getByRole('link', { name: 'Criar clínica' }))
    expect(screen.getByRole('heading', { name: 'Criar clínica' })).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })
})
