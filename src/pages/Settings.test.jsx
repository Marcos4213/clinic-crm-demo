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
  it('lets the owner edit the clinic and register the WhatsApp line', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    const onBindWhatsapp = vi.fn()
    render(
      <MemoryRouter>
      <SettingsPanel
        clinicName="Clínica Aurora"
        role="owner"
        settings={{ display_name: 'Clínica Aurora', day_start: '09:00:00', day_end: '18:00:00', slot_minutes: 30, business_faq: 'Avaliação presencial.' }}
        integrations={integrations}
        onSaveProfile={onSaveProfile}
        onBindWhatsapp={onBindWhatsapp}
      />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Ajustes da clínica' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome que a equipe vê')).toHaveValue('Clínica Aurora')
    expect(screen.queryByText('pending')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /conectar instagram/i })).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Identificador da linha'))
    await user.type(screen.getByLabelText('Identificador da linha'), '8100000000000001')
    await user.type(screen.getByLabelText('Conta comercial'), '8200000000000001')
    await user.type(screen.getByLabelText('Aplicativo'), '8300000000000001')
    await user.click(screen.getByRole('button', { name: 'Registrar linha nesta clínica' }))
    expect(onBindWhatsapp).toHaveBeenCalledWith({
      phone: '8100000000000001',
      waba: '8200000000000001',
      app: '8300000000000001',
    })
    await user.click(screen.getByRole('button', { name: 'Gravar atendimento' }))
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Clínica Aurora', slotMinutes: '30' }))
  })

  it('keeps the line form away from staff', () => {
    render(
      <MemoryRouter>
        <SettingsPanel clinicName="Clínica Aurora" role="staff" integrations={integrations} />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('Identificador da linha')).not.toBeInTheDocument()
    expect(screen.getByText('Quem administra a clínica registra a linha.')).toBeInTheDocument()
  })
})
