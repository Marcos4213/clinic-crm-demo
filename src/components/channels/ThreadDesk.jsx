import { useState } from 'react'
import { initials } from '../../domain/crm'

export default function ThreadDesk({ threads, emptyTitle, emptyDetail, composeLabel }) {
  const [activeId, setActiveId] = useState(threads[0]?.id ?? null)
  const [extra, setExtra] = useState({})
  const [draft, setDraft] = useState('')
  const active = threads.find((thread) => thread.id === activeId) ?? null
  const messages = active ? [...active.messages, ...(extra[active.id] ?? [])] : []

  function sendPreview() {
    const text = draft.trim()
    if (!active || !text) return
    setExtra((current) => ({
      ...current,
      [active.id]: [...(current[active.id] ?? []), { id: `local-${active.id}-${messages.length}`, role: 'humano', text, local: true }],
    }))
    setDraft('')
  }

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
    <div className="grid min-h-[560px] flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ul className="border-b border-line lg:border-r lg:border-b-0" aria-label="Conversas desta amostra">
        {threads.map((thread) => {
          const selected = thread.id === activeId
          return (
            <li key={thread.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(thread.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${selected ? 'bg-surface' : 'hover:bg-white/5'}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-800 text-[11px] font-semibold">
                  {initials(thread.name)}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold">{thread.name}</span>
                    {thread.waiting && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">{thread.procedure}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {active && (
        <section aria-label={`Conversa de demonstração com ${active.name}`} className="flex min-h-[420px] flex-col lg:min-h-0">
          <header className="border-b border-line px-4 py-3">
            <h2 className="text-[16px] font-semibold">{active.name}</h2>
            <p className="text-[12px] text-muted">{active.procedure} · amostra fictícia · não é um envio real</p>
          </header>
          <div className="flex min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto bg-chat px-4 py-4">
            {messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                  message.role === 'cliente' ? 'self-start bg-surface' : 'self-end bg-client'
                }`}
              >
                {message.text}
                {message.local && <span className="mt-1 block text-[10px] font-semibold tracking-[0.12em] text-emerald uppercase">Prévia local</span>}
              </p>
            ))}
          </div>
          <form
            className="border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault()
              sendPreview()
            }}
          >
            <label className="block text-[12px] font-semibold text-muted" htmlFor={`draft-${active.id}`}>
              {composeLabel}
              <textarea
                id={`draft-${active.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink"
              />
            </label>
            <button type="submit" className="mt-2 h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C]">
              Guardar prévia na demonstração
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
