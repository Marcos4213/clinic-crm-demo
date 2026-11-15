import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'
import { clinicDateKey } from '../domain/insights'

beforeEach(() => {
  window.location.hash = '#/demo/agenda'
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

describe('visit agenda', () => {
  it('shows the week calendar without clinic tools and blocks a conflicting visit from the lead sheet', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Visitas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semana' })).toBeInTheDocument()
    expect(screen.getByText(/Beatriz Lima/)).toBeInTheDocument()
    expect(screen.getByText(/lembrete fica pendente de envio/i)).toBeInTheDocument()
    expect(screen.queryByText('Doctoralia')).not.toBeInTheDocument()
    expect(screen.queryByText('iClinic')).not.toBeInTheDocument()
    expect(screen.queryByText(/clínica/i)).not.toBeInTheDocument()

    window.location.hash = '#/demo/leads/beatriz'
    expect(await screen.findByRole('heading', { name: 'Beatriz Lima' })).toBeInTheDocument()
    const time = screen.getByLabelText('Horário da visita')
    await user.clear(time)
    await user.type(time, '16:00')
    const date = screen.getByLabelText('Data da visita')
    await user.clear(date)
    await user.type(date, clinicDateKey())
    await user.click(screen.getByRole('button', { name: 'Marcar visita' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Esse horário já está ocupado para o corretor.')
  })
})
