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

describe('clinic settings', () => {
  it('edits the clinic hours and does not present a QR as the WhatsApp login', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    const onConnect = vi.fn()
    render(
      <MemoryRouter>
        <SettingsPanel
          clinicName="Clínica Aurora"
          settings={{ display_name: 'Clínica Aurora', day_start: '09:00:00', day_end: '18:00:00', slot_minutes: 30 }}
          integrations={integrations}
          onSaveProfile={onSaveProfile}
          signup={{ configured: true, connected: false, configId: '900000000000001' }}
          onConnect={onConnect}
        />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Nome que a equipe vê')).toHaveValue('Clínica Aurora')
    expect(screen.queryByText('Grok')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /qr code/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/conectado ao vivo/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar na Meta' }))
    expect(onConnect).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Gravar atendimento' }))
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Clínica Aurora', slotMinutes: '30' }))
  })

  it('names the missing Meta configuration instead of showing a QR', () => {
    render(
      <MemoryRouter>
        <SettingsPanel clinicName="Clínica Aurora" integrations={integrations} signup={{ configured: false, connected: false }} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/EMBEDDED_SIGNUP_CONFIG_ID/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mostrar QR do WhatsApp' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continuar na Meta' })).not.toBeInTheDocument()
  })
})