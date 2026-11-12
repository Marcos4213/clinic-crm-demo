import { Check, CheckCheck } from 'lucide-react'
import { formatStamp } from '../../domain/crm'

const ROLE_LABEL = { ia: 'IA', cliente: 'Paciente', humano: 'Humano' }

function Receipt({ receipt }) {
  const read = receipt === 'read'
  const label = read ? 'Indicador visual de demonstração: lido' : 'Indicador visual de demonstração: entregue'
  const Icon = read ? CheckCheck : Check
  return (
    <span role="img" aria-label={label} title={label} className={read ? 'text-teal-700' : 'text-[#6B8196]'}>
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

export default function MessageBubble({ message }) {
  const outgoing = message.role !== 'cliente'
  const bubble =
    message.role === 'cliente'
      ? 'border border-line bg-canvas rounded-bl-md'
      : message.role === 'humano'
        ? 'border border-[#D5E2F2] bg-human rounded-br-md'
        : 'bg-client rounded-br-md'

  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[86%]">
        <div className={`mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase ${outgoing ? 'justify-end' : ''}`}>
          <span>{ROLE_LABEL[message.role]}</span>
          {message.localDemo && <span>local</span>}
        </div>
        <div className={`rounded-2xl px-3 py-2 text-[13px] leading-5 text-ink ${bubble}`}>
          <p className="whitespace-pre-wrap">{message.text}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted">
            <time dateTime={message.at}>{formatStamp(message.at)}</time>
            {message.receipt && <Receipt receipt={message.receipt} />}
          </div>
        </div>
      </div>
    </div>
  )
}
