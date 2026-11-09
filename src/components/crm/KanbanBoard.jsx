import { useState } from 'react'
import { COLUMNS, stageCountLabel } from '../../domain/crm'
import { formatBrl } from '../../domain/insights'
import LeadCard from './LeadCard'

const RAILS = {
  'em-atendimento': 'bg-teal-700',
  qualificados: 'bg-blue-700',
  agendados: 'bg-[#8A6A2F]',
  fechados: 'bg-[#2F6B4F]',
}

export default function KanbanBoard({ leads, selectedId, onSelect, onMove }) {
  const [overId, setOverId] = useState(null)

  return (
    <div role="region" aria-label="Funil comercial" className="scroll-thin min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full w-max min-w-full gap-3 px-3 py-3 sm:px-4">
        {COLUMNS.map((column) => {
          const items = leads.filter((lead) => lead.column === column.id)
          const value = items.reduce((sum, lead) => sum + (typeof lead.value === 'number' ? lead.value : 0), 0)
          const over = overId === column.id
          return (
            <section
              key={column.id}
              aria-label={column.label}
              onDragOver={(event) => {
                event.preventDefault()
                setOverId(column.id)
              }}
              onDragLeave={() => setOverId((current) => (current === column.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault()
                setOverId(null)
                const leadId = event.dataTransfer.getData('text/plain')
                if (leadId) onMove(leadId, column.id)
              }}
              className={`flex h-full min-w-0 flex-[1_0_248px] flex-col rounded-2xl bg-chat p-2 ${
                over ? 'outline outline-2 outline-offset-[-2px] outline-teal-700' : ''
              }`}
            >
              <header className="px-1.5 pt-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-start gap-2 text-[12.5px] leading-4 font-semibold text-ink">
                    <span className={`mt-1 h-3.5 w-0.5 shrink-0 rounded-full ${RAILS[column.id]}`} aria-hidden="true" />
                    {column.label}
                  </h3>
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-ink tabular-nums">{items.length}</span>
                </div>
                {value > 0 && <p className="mt-1 pl-2.5 text-[11px] font-semibold text-emerald tabular-nums">{formatBrl(value)}</p>}
                <p className="sr-only">{stageCountLabel(items.length)}</p>
              </header>
              <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                {items.length === 0 && <p className="px-1.5 py-6 text-center text-[12px] text-muted">Nenhum lead com esse filtro.</p>}
                {items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    selected={lead.id === selectedId}
                    onSelect={() => onSelect(lead.id)}
                    onMove={(columnId) => onMove(lead.id, columnId)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
