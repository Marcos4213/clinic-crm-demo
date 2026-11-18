import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { C4_AGENT_LINE, C4_AGENT_NAME, C4_HEADLINE } from '../c4/config'
import App from '../App'
import ClinicDemo from './ClinicDemo'

function renderClinic(path, fetchImpl) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/c4" element={<ClinicDemo fetchImpl={fetchImpl} />} />
        <Route path="/c/:slug" element={<ClinicDemo fetchImpl={fetchImpl} />} />
        <Route path="/c" element={<ClinicDemo fetchImpl={fetchImpl} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('clinic demo page', () => {
  it('opens a real clinic and keeps the login route', async () => {
    window.location.hash = '#/c/clinica-atman'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: C4_HEADLINE })).toBeInTheDocument()
    expect(screen.getByText(/Simulando Clínica Atman · Rio de Janeiro · avaliação para cirurgia plástica/)).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: C4_AGENT_LINE }).length).toBeGreaterThan(0)
    expect(screen.getByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent(C4_AGENT_NAME)
    expect(screen.getByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent('Clínica Atman')
    expect(screen.getByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent('avaliação para cirurgia plástica')
    expect(screen.getByText('Demonstração')).toBeInTheDocument()
    expect(screen.getByText('Do primeiro oi à consulta, nenhum paciente perdido.')).toBeInTheDocument()
    expect(screen.getByText(/apoia a recepção/)).toBeInTheDocument()
    expect(screen.queryByText(/cliente/i)).not.toBeInTheDocument()

    const share = screen.getByRole('link', { name: 'Encaminhar para a doutora' })
    expect(decodeURIComponent(share.getAttribute('href'))).toContain(
      'Dra., olha como ficaria o atendimento da Clínica Atman no WhatsApp: https://c4.devbrasil.online/#/c/clinica-atman',
    )
    const book = screen.getByRole('link', { name: 'Marcar 30 minutos com o Marcos' })
    expect(book.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5511913221587\?text=/)

    window.location.hash = '#/'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('answers with the clinic procedure when the assistant call fails', async () => {
    const user = userEvent.setup()
    renderClinic('/c/clinica-maison-regato', () => Promise.reject(new Error('offline')))

    expect(screen.getByRole('heading', { level: 1, name: C4_HEADLINE })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Mensagem do paciente'), 'Oi, queria saber da harmonização')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))

    const log = await screen.findByRole('log', { name: 'Mensagens da demonstração' })
    expect(log).toHaveTextContent(C4_AGENT_NAME)
    expect(log).toHaveTextContent('Clínica Maison Regato')
    expect(log).toHaveTextContent('harmonização facial')
    expect(log).toHaveTextContent('O que você quer tratar?')
    expect(log.textContent.toLowerCase()).not.toMatch(/cliente|o\(a\)|r\$/)
  })

  it('opens a generic demo that does not need a clinic name', async () => {
    const user = userEvent.setup()
    renderClinic('/c4', () => Promise.reject(new Error('offline')))

    expect(screen.getByRole('heading', { level: 1, name: C4_HEADLINE })).toBeInTheDocument()
    expect(screen.getByText(/A equipe continua no comando/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Nome da clínica')).not.toBeInTheDocument()
    expect(screen.getByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent(C4_AGENT_NAME)
    expect(screen.getByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent('estética, odontologia ou cirurgia plástica')

    await user.type(screen.getByLabelText('Mensagem do paciente'), 'Oi')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
    expect(await screen.findByRole('log', { name: 'Mensagens da demonstração' })).toHaveTextContent('procedimento')
    expect(decodeURIComponent(screen.getByRole('link', { name: 'Encaminhar para a doutora' }).getAttribute('href'))).toContain(
      'https://c4.devbrasil.online/',
    )
  })
})
