import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'

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

describe('local agenda', () => {
  it('blocks a second appointment on the same slot and can reset the sample', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument()
    expect(screen.getByText(/Google Calendar não está conectado/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agendar' }))
    await user.click(screen.getByRole('button', { name: 'Agendar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Esse horário já está ocupado.')

    await user.click(screen.getByRole('link', { name: 'Pipeline' }))
    await user.click(screen.getByRole('button', { name: 'Restaurar amostra' }))
    expect(screen.getByRole('status')).toHaveTextContent('Amostra local restaurada')
  })
})
