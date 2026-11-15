import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Search, Send } from 'lucide-react'
import { initials, temperatureLabel } from '../../domain/crm'
import { appBase, leadIdFromThread } from '../../domain/lead-sheet'
import useCompactViewport from '../../hooks/useCompactViewport'
import { useCrm } from '../../state/useCrm'

const TEMPERATURE_TONE = {
  quente: 'bg-emerald/15 text-emerald',
  morno: 'bg-[#8A6A2F]/30 text-[#E4C27A]',
  frio: 'bg-white/10 text-muted',
}

function TemperatureBadge({ temperature }) {
  if (!temperature) return null
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase ${TEMPERATURE_TONE[temperature] ?? 'bg-white/10 text-muted'}`}>
      {temperatureLabel(temperature)}
    </span>
  )
}

function matchesQuery(thread, query) {
  const needle = query.trim().toLocaleLowerCase('pt-BR')
  if (!needle) return true
  return [thread.name, thread.property, thread.procedure, thread.region, thread.broker, thread.interest]
    .filter(Boolean)
    .some((field) => String(field).toLocaleLowerCase('pt-BR').includes(needle))
}

function sortThreads(threads) {
  return [...threads].sort((a, b) => Number(Boolean(b.waiting)) - Number(Boolean(a.waiting)))
}

function roleLabel(message, thread) {
  if (message.role === 'ia') return 'Helena'
  if (message.role === 'humano' || message.local) return 'Você'
  return thread.name.split(' ')[0]
}

export default function ThreadDesk({ threads, emptyTitle, emptyDetail, composeLabel = 'Mensagem' }) {
  const crm = useCrm()
  const location = useLocation()
  const base = appBase(location.pathname)
  const compact = useCompactViewport()
  const [query, setQuery] = useState('')
  const [pendingOnly, setPendingOnly] = useState(true)
  const [temperature, setTemperature] = useState('todos')
  const [pane, setPane] = useState('list')
  const [activeId, setActiveId] = useState(() => sortThreads(threads).find((thread) => thread.waiting)?.id ?? threads[0]?.id ?? null)
  const [extra, setExtra] = useState({})
  const [paused, setPaused] = useState({})
  const [draft, setDraft] = useState('')

  const visible = useMemo(() => {
    const filtered = threads.filter((thread) => {
      if (pendingOnly && !thread.waiting) return false
      if (temperature !== 'todos' && thread.temperature !== temperature) return false
      return matchesQuery(thread, query)
    })
    return sortThreads(filtered)
  }, [threads, pendingOnly, temperature, query])

  const active = threads.find((thread) => thread.id === activeId) ?? null
  const messages = active ? [...active.messages, ...(extra[active.id] ?? [])] : []
  const helenaOn = Boolean(active && (active.helenaActive ?? true) && paused[active.id] !== true)
  const showList = !compact || pane === 'list'
  const showChat = !compact ? Boolean(active) : pane === 'chat' && Boolean(active)

  function openThread(id) {
    setActiveId(id)
    setDraft('')
    if (compact) setPane('chat')
  }

  function sendMessage() {
    const text = draft.trim()
    if (!active || !text || helenaOn) return
    setExtra((current) => ({
      ...current,
      [active.id]: [...(current[active.id] ?? []), { id: `local-${active.id}-${messages.length}`, role: 'humano', text, local: true }],
    }))
    setDraft('')
  }

  function assume() {
    if (!active) return
    setPaused((current) => ({ ...current, [active.id]: true }))
    const profileId = leadIdFromThread(active)
    if (profileId && crm.assumeLead) crm.assumeLead(profileId)
  }

  function returnToHelena() {
    if (!active) return
    setPaused((current) => ({ ...current, [active.id]: false }))
  }

  const list = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-line lg:border-r lg:border-b-0">
      <div className="shrink-0 space-y-2 border-b border-line px-3 py-3">
        {crm.nextBroker && (
          <p className="text-[12px] text-muted">
            Próximo da vez:{' '}
            <Link to={`${base}/equipe`} className="font-semibold text-emerald">
              {crm.nextBroker.name}
            </Link>
          </p>
        )}
        <div className="relative">
          <Search size={15} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Buscar conversas"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, imóvel ou região"
            className="h-9 w-full rounded-lg border border-line bg-canvas pr-3 pl-9 text-[13px] text-ink outline-none placeholder:text-[#7D90A3]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            ['pendentes', pendingOnly, () => setPendingOnly(true), 'Pendentes'],
            ['todos', !pendingOnly, () => setPendingOnly(false), 'Todos'],
          ].map(([id, on, onClick, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={onClick}
              className={`h-7 rounded-full px-2.5 text-[11px] font-semibold ${on ? 'bg-emerald text-navy-950' : 'bg-canvas text-muted'}`}
            >
              {label}
            </button>
          ))}
          {['quente', 'morno', 'frio'].map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={temperature === id}
              onClick={() => setTemperature((current) => (current === id ? 'todos' : id))}
              className={`h-7 rounded-full px-2.5 text-[11px] font-semibold ${temperature === id ? 'bg-emerald text-navy-950' : 'bg-canvas text-muted'}`}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <h2 className="text-[16px] font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-muted">{emptyDetail}</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversas">
          {visible.map((thread) => {
            const selected = thread.id === activeId && (!compact || pane === 'chat')
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  aria-pressed={thread.id === activeId}
                  onClick={() => openThread(thread.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${selected ? 'bg-surface' : 'hover:bg-white/5'}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-800 text-[11px] font-semibold">
                    {initials(thread.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{thread.name}</span>
                      {thread.waiting && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald" aria-label="Aguardando resposta" />}
                      {thread.waiting && thread.waitingFor && (
                        <span className="ml-auto shrink-0 text-[11px] font-semibold text-emerald tabular-nums">{thread.waitingFor}</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">{thread.property || thread.procedure}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <TemperatureBadge temperature={thread.temperature} />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const chat = active && (
    <section aria-label={`Conversa com ${active.name}`} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3">
        {compact && (
          <button type="button" onClick={() => setPane('list')} className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-info">
            <ArrowLeft size={14} aria-hidden="true" />
            Conversas
          </button>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold">{active.name}</h2>
            <p className="mt-0.5 truncate text-[12px] text-muted">{active.property || active.procedure}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <TemperatureBadge temperature={active.temperature} />
              {active.waiting && active.waitingFor && <span className="text-[11px] font-semibold text-emerald">À espera há {active.waitingFor}</span>}
              {leadIdFromThread(active) && (
                <Link to={`${base}/leads/${leadIdFromThread(active)}`} className="text-[11px] font-semibold text-emerald">
                  Ficha
                </Link>
              )}
            </div>
          </div>
          {helenaOn ? (
            <button type="button" onClick={assume} className="h-9 shrink-0 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
              Assumir
            </button>
          ) : (
            <button type="button" onClick={returnToHelena} className="h-9 shrink-0 rounded-lg border border-emerald px-3 text-[12.5px] font-semibold text-emerald">
              Devolver à Helena
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-ink">{helenaOn ? 'Helena no plantão' : 'Você assumiu'}</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-chat px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex max-w-[85%] flex-col ${message.role === 'cliente' ? 'self-start' : 'self-end'}`}>
            <span className="mb-1 px-1 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">{roleLabel(message, active)}</span>
            <p
              className={`rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                message.role === 'cliente' ? 'bg-surface' : message.role === 'ia' ? 'bg-client text-ink' : 'bg-human'
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form
        className="shrink-0 border-t border-line bg-surface p-3"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage()
        }}
      >
        {helenaOn && <p className="mb-2 text-[12px] leading-4 text-muted">A Helena está no plantão. Assuma para responder.</p>}
        <label className="sr-only" htmlFor={`draft-${active.id}`}>
          {composeLabel}
        </label>
        <textarea
          id={`draft-${active.id}`}
          aria-label={`Mensagem para ${active.name}`}
          value={draft}
          disabled={helenaOn}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              sendMessage()
            }
          }}
          rows={2}
          placeholder="Escreva uma resposta…"
          className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={helenaOn || !draft.trim()}
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950 disabled:cursor-not-allowed disabled:bg-[#24344A] disabled:text-muted"
        >
          <Send size={14} aria-hidden="true" />
          Enviar
        </button>
      </form>
    </section>
  )

  const sheet = active && !compact && (
    <aside aria-label={`Ficha de ${active.name}`} className="hidden w-[280px] shrink-0 flex-col border-l border-line bg-surface xl:flex">
      <div className="px-4 py-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Lead</p>
        <h2 className="mt-1 text-[16px] font-semibold">{active.name}</h2>
        <div className="mt-4 space-y-3 text-[13px]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Imóvel</p>
            <p className="mt-0.5 font-semibold">{active.property || active.procedure}</p>
            {active.interest && <p className="mt-0.5 text-muted">{active.interest}</p>}
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Temperatura</p>
            <div className="mt-1">
              <TemperatureBadge temperature={active.temperature} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Corretor da vez</p>
            <p className="mt-0.5 font-semibold">{active.broker || 'A definir'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Tempo à espera</p>
            <p className="mt-0.5 font-semibold tabular-nums">{active.waiting ? active.waitingFor || 'Aguardando' : 'Em dia'}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {helenaOn ? (
            <button type="button" onClick={assume} className="h-9 w-full rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
              Assumir
            </button>
          ) : (
            <button type="button" onClick={returnToHelena} className="h-9 w-full rounded-lg border border-emerald px-3 text-[12.5px] font-semibold text-emerald">
              Devolver à Helena
            </button>
          )}
          {leadIdFromThread(active) && (
            <Link to={`${base}/leads/${leadIdFromThread(active)}`} className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-line text-[12.5px] font-semibold text-ink">
              Abrir ficha
            </Link>
          )}
        </div>
      </div>
    </aside>
  )

  if (threads.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <div className="surface-card px-5 py-10 text-center">
          <h2 className="text-[18px] font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-muted">{emptyDetail}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1">
      {showList && list}
      {showChat && chat}
      {showChat && sheet}
    </div>
  )
}
