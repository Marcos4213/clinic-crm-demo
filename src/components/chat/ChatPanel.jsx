import { ArrowLeft, Send } from 'lucide-react'
import { initials } from '../../domain/crm'
import MessageBubble from './MessageBubble'
import TemperatureMark from '../crm/TemperatureMark'

export default function ChatPanel({ lead, hiddenByFilter, draft, onDraft, onToggleTakeover, onSend, compact, onBack, className = '' }) {
  return (
    <section aria-label="Conversa" className={`min-h-0 bg-white ${className}`}>
      {hiddenByFilter ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-xs text-center">
            <p className="text-[13.5px] leading-5 font-medium text-ink">
              Este lead está fora do filtro atual. Ajuste a busca ou escolha um lead visível.
            </p>
            <p className="mt-2 text-[12px] text-muted">{lead?.name} continua selecionado.</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-line px-4 py-3">
            {compact && (
              <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-700">
                <ArrowLeft size={14} aria-hidden="true" />
                Voltar ao funil
              </button>
            )}
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-[12px] font-semibold text-white" aria-hidden="true">
                {initials(lead.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] leading-5 font-semibold tracking-tight text-ink">{lead.name}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                  <span>{lead.procedure}</span>
                  <TemperatureMark temperature={lead.temperature} />
                </p>
                <p className="mt-1 font-mono text-[11px] text-[#24384C] tabular-nums">
                  {lead.phone}{' '}
                  <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">número fictício</span>
                </p>
                <p className="mt-1 text-[12px] font-semibold text-ink">{lead.aiActive ? 'IA conduzindo' : 'Controle humano'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTakeover}
              className={`mt-3 h-9 w-full rounded-lg px-3 text-[12.5px] font-semibold transition-colors duration-150 ${
                lead.aiActive ? 'bg-teal-700 text-white hover:bg-[#0C5E5B]' : 'border border-navy-900 bg-white text-navy-900 hover:bg-canvas'
              }`}
            >
              {lead.aiActive ? 'Assumir Atendimento (Pausar IA)' : 'Reativar IA'}
            </button>
            <p className="mt-2 text-[11px] leading-4 text-muted">
              Canal de demonstração do Clinic CRM. Não é o WhatsApp e não há envio externo.
            </p>
            <p className="text-[11px] leading-4 text-muted">Os tiques não confirmam entrega real.</p>
          </header>
          <div role="log" aria-label={`Mensagens com ${lead.name}`} className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto bg-chat px-3 py-4">
            <p className="mx-auto w-fit rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-muted">08/11/2026 · amostra</p>
            {lead.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
          <div className="shrink-0 border-t border-line bg-white px-3 py-3">
            {lead.aiActive && (
              <p className="mb-2 text-[12px] leading-4 text-muted">A IA está conduzindo esta conversa. Assuma o atendimento para escrever.</p>
            )}
            <textarea
              aria-label={`Mensagem para ${lead.name}`}
              disabled={lead.aiActive}
              value={draft}
              rows={2}
              onChange={(event) => onDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSend()
                }
              }}
              placeholder="Escreva uma resposta local…"
              className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink outline-none placeholder:text-[#7D90A3] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={lead.aiActive}
              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#D7DEE6] disabled:text-[#3E5166]"
            >
              <Send size={14} aria-hidden="true" />
              Enviar mensagem local
            </button>
            <p className="mt-2 text-[10.5px] leading-4 text-muted">Enter envia · Shift+Enter quebra a linha · a mensagem fica só neste navegador.</p>
          </div>
        </div>
      )}
    </section>
  )
}
