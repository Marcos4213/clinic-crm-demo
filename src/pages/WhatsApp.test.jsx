import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhatsAppPanel } from './WhatsApp.jsx'

describe('whatsapp test screen', () => {
  it('shows the section name and stays disconnected without a route', () => {
    render(<WhatsAppPanel role="owner" messages={[]} />)
    expect(screen.getByRole('heading', { level: 1, name: 'WhatsApp' })).toBeInTheDocument()
    expect(screen.getByText('Não conectado')).toBeInTheDocument()
    expect(screen.queryByText(/conectado ao vivo/i)).not.toBeInTheDocument()
  })

  it('labels an accepted message without calling it delivered', () => {
    render(
      <WhatsAppPanel
        route={{ id: 'route-1' }}
        messages={[{ id: 'm1', body: 'Oi', status: 'accepted' }]}
        role="staff"
        canSend={false}
      />,
    )
    expect(screen.getByText('Aceito pela API')).toBeInTheDocument()
    expect(screen.queryByText('Entregue')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar mensagem de teste' })).toBeDisabled()
  })

  it('lets only the owner bind a number and sends only after confirmation', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { rerender } = render(<WhatsAppPanel role="staff" route={{ id: 'route-1' }} canSend onSend={onSend} />)
    expect(screen.queryByRole('heading', { name: 'Vincular número' })).not.toBeInTheDocument()
    rerender(<WhatsAppPanel role="owner" route={{ id: 'route-1' }} canSend onSend={onSend} />)
    expect(screen.getByLabelText('Phone number ID')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem de teste' }))
    expect(onSend).not.toHaveBeenCalled()
    await user.click(screen.getByLabelText('Confirmo o envio manual'))
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem de teste' }))
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ confirm: true }))
  })
})
