import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

function desktopMedia() {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
}

function compactMedia() {
  window.matchMedia = (query) => ({
    matches: query.includes('max-width: 1023px'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })
}

beforeEach(() => {
  window.location.hash = '#/demo/pipeline'
  desktopMedia()
})

describe('pipeline selection', () => {
  it('shows Maria Silva first and switches the conversation to João Pedro', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { level: 2, name: 'Maria Silva' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Selecionar Maria Silva' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('log', { name: 'Mensagens com Maria Silva' })).toHaveTextContent(
      'Vi seu interesse na avaliação de Botox.',
    )

    await user.click(screen.getByRole('button', { name: 'Selecionar João Pedro' }))

    expect(screen.getByRole('heading', { level: 2, name: 'João Pedro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Selecionar João Pedro' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Selecionar Maria Silva' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('log', { name: 'Mensagens com João Pedro' })).toHaveTextContent(
      'Obrigado pelo interesse em implante capilar.',
    )
    expect(screen.queryByText('Vi seu interesse na avaliação de Botox.')).not.toBeInTheDocument()
  })
})

describe('per-lead takeover and composer', () => {
  it('pauses and restores the assistant for one lead only', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Assumir Atendimento (Pausar IA)' }))
    expect(screen.getByRole('button', { name: 'Reativar IA' })).toBeInTheDocument()
    expect(screen.getByText('Controle humano')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Selecionar João Pedro' }))
    expect(screen.getByRole('button', { name: 'Assumir Atendimento (Pausar IA)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Selecionar Maria Silva' }))
    expect(screen.getByRole('button', { name: 'Reativar IA' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reativar IA' }))
    expect(screen.getByRole('button', { name: 'Assumir Atendimento (Pausar IA)' })).toBeInTheDocument()
    expect(screen.getByText('IA conduzindo')).toBeInTheDocument()
  })

  it('keeps the composer disabled until takeover, rejects blank text, and sends with Enter', async () => {
    const user = userEvent.setup()
    render(<App />)

    const box = screen.getByRole('textbox', { name: 'Mensagem para Maria Silva' })
    expect(box).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar mensagem local' })).toBeDisabled()
    expect(screen.getByText('A IA está conduzindo esta conversa. Assuma o atendimento para escrever.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Assumir Atendimento (Pausar IA)' }))
    expect(box).toBeEnabled()

    await user.type(box, 'rascunho parcial')
    await user.click(screen.getByRole('button', { name: 'Selecionar João Pedro' }))
    await user.click(screen.getByRole('button', { name: 'Selecionar Maria Silva' }))
    expect(screen.getByRole('textbox', { name: 'Mensagem para Maria Silva' })).toHaveValue('rascunho parcial')

    const restored = screen.getByRole('textbox', { name: 'Mensagem para Maria Silva' })
    await user.clear(restored)
    await user.type(restored, '   ')
    await user.keyboard('{Enter}')
    expect(screen.queryByText(/^\s+$/)).not.toBeInTheDocument()
    expect(restored).toHaveValue('   ')

    await user.clear(restored)
    await user.type(restored, 'Posso te explicar a avaliação.')
    await user.keyboard('{Enter}')

    const log = screen.getByRole('log', { name: 'Mensagens com Maria Silva' })
    expect(within(log).getByText('Posso te explicar a avaliação.')).toBeInTheDocument()
    expect(within(log).getByText('Humano')).toBeInTheDocument()
    expect(within(log).getByText('local')).toBeInTheDocument()
    expect(restored).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Selecionar João Pedro' }))
    expect(screen.queryByText('Posso te explicar a avaliação.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Selecionar Maria Silva' }))
    expect(screen.getByText('Posso te explicar a avaliação.')).toBeInTheDocument()
  })
})

describe('move, counts, and filter', () => {
  it('moves Maria Silva and updates the stage counts', async () => {
    const user = userEvent.setup()
    render(<App />)

    const atendimento = screen.getByRole('region', { name: 'Em Atendimento (IA)' })
    const qualificados = screen.getByRole('region', { name: 'Qualificados' })
    expect(within(atendimento).getByText('4 leads nesta etapa')).toBeInTheDocument()
    expect(within(qualificados).getByText('3 leads nesta etapa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mover Maria Silva' }))
    await user.click(screen.getByRole('menuitem', { name: 'Qualificados' }))

    expect(within(screen.getByRole('region', { name: 'Qualificados' })).getByRole('button', { name: 'Selecionar Maria Silva' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Em Atendimento (IA)' })).queryByRole('button', { name: 'Selecionar Maria Silva' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Em Atendimento (IA)' })).getByText('3 leads nesta etapa')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Qualificados' })).getByText('4 leads nesta etapa')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Maria Silva agora está em Qualificados')
  })

  it('filters by procedure and temperature', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('searchbox', { name: 'Buscar leads' }), 'botox')
    expect(screen.getByRole('button', { name: 'Selecionar Maria Silva' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Selecionar Fernanda Oliveira' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Selecionar João Pedro' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Qualificados' })).getByText('0 leads nesta etapa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
    await user.click(screen.getByRole('radio', { name: 'Frio' }))
    expect(screen.getByRole('button', { name: 'Selecionar Helena Duarte' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Selecionar Maria Silva' })).not.toBeInTheDocument()
    expect(screen.getByText('Este lead está fora do filtro atual. Ajuste a busca ou escolha um lead visível.')).toBeInTheDocument()
  })
})

describe('other sections and compact layout', () => {
  it('opens an in-app mass-send screen that cannot dispatch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'WhatsApp' }))
    await user.click(screen.getByRole('link', { name: 'Disparos em Massa' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Disparos em Massa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envio desativado — sem integração' })).toBeDisabled()
    expect(screen.getByText(/nenhuma campanha é criada/i)).toBeInTheDocument()
  })

  it('renders the board and the conversation together on a desktop viewport', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Funil comercial' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Conversa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mostrar funil' })).not.toBeInTheDocument()
  })

  it('toggles the funnel and the conversation on a compact viewport', async () => {
    compactMedia()
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'Mostrar funil' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('region', { name: 'Conversa' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Funil comercial' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Selecionar João Pedro' }))
    expect(screen.getByRole('region', { name: 'Conversa' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'João Pedro' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Funil comercial' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar ao funil' }))
    expect(screen.getByRole('region', { name: 'Funil comercial' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Conversa' })).not.toBeInTheDocument()
  })
})
