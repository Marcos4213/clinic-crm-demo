import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  it('edits the clinic hours and reads only the WhatsApp QR', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    const onSaveWhatsapp = vi.fn()
    const stop = vi.fn()
    window.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: 'https://wa.me/5511988887777' }]
      }
    }
    navigator.mediaDevices = { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) }
    HTMLMediaElement.prototype.play = vi.fn(async () => {})
    render(
      <MemoryRouter>
        <SettingsPanel
          clinicName="Clínica Aurora"
          settings={{ display_name: 'Clínica Aurora', day_start: '09:00:00', day_end: '18:00:00', slot_minutes: 30, business_faq: 'Avaliação presencial.' }}
          integrations={integrations}
          onSaveProfile={onSaveProfile}
          onSaveWhatsapp={onSaveWhatsapp}
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
    await user.click(screen.getByRole('button', { name: 'Escanear QR do WhatsApp' }))
    await waitFor(() => expect(onSaveWhatsapp).toHaveBeenCalledWith('https://wa.me/5511988887777'))
    expect(screen.getByText('Número lido: +5511988887777')).toBeInTheDocument()
    expect(stop).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Gravar atendimento' }))
    expect(onSaveProfile).toHaveBeenCalledWith({ displayName: 'Clínica Aurora', dayStart: '09:00', dayEnd: '18:00', slotMinutes: '30' })
  })

  it('rejects a QR that is not WhatsApp and hides the technical line form', async () => {
    const user = userEvent.setup()
    window.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: 'https://evil.example/painel' }]
      }
    }
    navigator.mediaDevices = { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop() {} }] })) }
    HTMLMediaElement.prototype.play = vi.fn(async () => {})
    const onSaveWhatsapp = vi.fn()
    render(
      <MemoryRouter>
        <SettingsPanel clinicName="Clínica Aurora" role="staff" integrations={integrations} onSaveWhatsapp={onSaveWhatsapp} />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('Identificador da linha')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar linha nesta clínica' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Escanear QR do WhatsApp' }))
    expect(await screen.findByText('Esse QR não é do WhatsApp.')).toBeInTheDocument()
    expect(onSaveWhatsapp).not.toHaveBeenCalled()
  })
})