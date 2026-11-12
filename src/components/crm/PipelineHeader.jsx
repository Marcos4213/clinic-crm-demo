import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { TEMPERATURES } from '../../domain/crm'
import { useCrm } from '../../state/useCrm'

const SAMPLE_STAGES = [
  ['em-atendimento', 'em atendimento'],
  ['qualificados', 'qualificados'],
  ['agendados', 'agendados'],
  ['fechados', 'fechados'],
]

export default function PipelineHeader() {
  const crm = useCrm()
  const { leads, sampleCounts, query, setQuery, temperature, setTemperature } = crm
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')

  return (
    <header className="shrink-0 border-b border-line bg-surface px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">Automatize.app · do primeiro contato ao paciente atendido</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] leading-none font-semibold tracking-tight text-ink">Pipeline</h1>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">
              {crm.mode === 'workspace' ? 'Clínica' : 'Demonstração local'}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-muted">
            {crm.mode === 'workspace'
              ? 'Registros desta clínica. Mensagens internas, sem envio externo.'
              : 'Dados fictícios só neste navegador. Nada é gravado na clínica.'}
          </p>
        </div>
        <dl aria-label="Contagens da amostra" className="flex flex-wrap gap-1.5">
          <div className="rounded-lg bg-canvas px-2.5 py-1.5">
            <dt className="sr-only">Leads no funil</dt>
            <dd className="text-[12px] font-semibold text-ink tabular-nums">{leads.length} no funil</dd>
          </div>
          {SAMPLE_STAGES.map(([id, label]) => (
            <div key={id} className="rounded-lg bg-canvas px-2.5 py-1.5">
              <dt className="sr-only">{label}</dt>
              <dd className="text-[12px] text-muted tabular-nums">
                <span className="font-semibold text-ink">{sampleCounts[id]}</span> {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Buscar leads"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, telefone ou procedimento"
            className="h-9 w-full rounded-lg border border-line bg-canvas pr-3 pl-9 text-[13px] text-ink outline-none placeholder:text-[#7D90A3]"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-2.5 text-[12px] font-semibold text-ink"
          >
            <X size={13} aria-hidden="true" />
            Limpar busca
          </button>
        )}
        <div role="radiogroup" aria-label="Filtrar por temperatura" className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
          {TEMPERATURES.map((item) => {
            const checked = temperature === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setTemperature(item.id)}
                className={`h-8 rounded-md px-2.5 text-[12px] font-semibold ${checked ? 'bg-emerald text-[#080F1C]' : 'text-muted'}`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      {crm.mode !== 'workspace' && (
        <button type="button" onClick={crm.resetDemo} className="mt-3 h-8 rounded-lg border border-line px-2.5 text-[12px] font-semibold text-ink">
          Restaurar amostra
        </button>
      )}
      {crm.createLead && (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            crm.createLead({ name: leadName, phone: leadPhone, procedure: 'Avaliação' })
            setLeadName('')
            setLeadPhone('')
          }}
        >
          <input aria-label="Nome do lead" required minLength={2} value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder="Nome" className="h-9 rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink" />
          <input aria-label="Telefone do lead" required minLength={8} value={leadPhone} onChange={(event) => setLeadPhone(event.target.value)} placeholder="Telefone" className="h-9 rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink" />
          <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12px] font-semibold text-[#080F1C]">
            Novo lead
          </button>
        </form>
      )}
    </header>
  )
}
