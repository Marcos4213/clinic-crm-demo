import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPanel } from './Settings.jsx'

const integrations = [
  { provider: 'whatsapp', state: 'pending', detail: 'IDs salvos' },
  { provider: 'grok', state: 'unconfigured', detail: 'raw' },
  { provider: 'instagram', state: 'unconfigured', detail: 'raw' },
  { provider: 'google_calendar', state: 'unconfigured', detail: 'raw' },
]
const png = 'data:image/png;base64,iVBORw0KGgo='

describe('clinic settings', () => {
  it('edits the clinic hours and shows the WhatsApp QR on the computer', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    const onLoadQr = vi.fn(async () => ({ image: png }))
    render(
      <MemoryRouter>
        <SettingsPanel
          clinicName="Clínica Aurora"
          settings={{ display_name: 'Clínica Aurora', day_start: '09:00:00', day_end: '18:00:00', slot_minutes: 30, business_faq: 'Avaliação presencial.' }}
          integrations={integrations}
          onSaveProfile={onSaveProfile}
          onLoadQr={onLoadQr}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Ajustes da clínica' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome que a equipe vê')).toHaveValue('Clínica Aurora')
    expect(screen.queryByText('pending')).not.toBeInTheDocument()
    expect(screen.queryByText('Grok')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/o que a ia/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Identificador da linha')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /conectar instagram/i })).not.toBeInTheDocument()
    expect(screen.getByText(/O Instagram ainda não entra no atendimento/)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'QR Code do WhatsApp da clínica' })).toHaveAttribute('src', png)
    await user.click(screen.getByRole('button', { name: 'Gravar atendimento' }))
    expect(onSaveProfile).toHaveBeenCalledWith({ displayName: 'Clínica Aurora', dayStart: '09:00', dayEnd: '18:00', slotMinutes: '30' })
  })

  it('hides the technical line form when the QR cannot open', async () => {
    render(
      <MemoryRouter>
        <SettingsPanel clinicName="Clínica Aurora" role="staff" integrations={integrations} onLoadQr={async () => null} />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('Identificador da linha')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar linha nesta clínica' })).not.toBeInTheDocument()
    expect(await screen.findByText('O QR não abriu. Tente de novo.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'QR Code do WhatsApp da clínica' })).not.toBeInTheDocument()
  })
})