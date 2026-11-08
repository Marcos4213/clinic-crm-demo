import { BarChart3 } from 'lucide-react'
import { countByColumn, temperatureLabel } from '../domain/crm'
import { useCrm } from '../state/useCrm'
import SectionPage from './SectionPage'

export default function Reports() {
  const { leads } = useCrm()
  const counts = countByColumn(leads)
  const temperatures = ['quente', 'morno', 'frio'].map((id) => ({
    id,
    label: temperatureLabel(id),
    count: leads.filter((lead) => lead.temperature === id).length,
  }))
  const procedures = [...leads.reduce((map, lead) => map.set(lead.procedure, (map.get(lead.procedure) ?? 0) + 1), new Map())].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'),
  )

  return (
    <SectionPage icon={BarChart3} kicker="Clinic CRM · amostra local" title="Relatórios">
      <p className="text-[14px] leading-6 text-ink">Números calculados só com a amostra fictícia carregada neste navegador.</p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas px-3 py-2.5">
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Leads na amostra</dt>
          <dd className="mt-1 text-[20px] font-semibold tabular-nums">{leads.length}</dd>
        </div>
        {[
          ['em-atendimento', 'Em Atendimento (IA)'],
          ['qualificados', 'Qualificados'],
          ['agendados', 'Agendados'],
          ['fechados', 'Fechados'],
        ].map(([id, label]) => (
          <div key={id} className="rounded-xl bg-canvas px-3 py-2.5">
            <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{label}</dt>
            <dd className="mt-1 text-[20px] font-semibold tabular-nums">{counts[id]}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-5 text-[13px] font-semibold tracking-[0.12em] text-muted uppercase">Temperatura</h2>
      <ul className="mt-2 space-y-1.5">
        {temperatures.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-[13.5px]">
            <span>{item.label}</span>
            <span className="font-semibold tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-5 text-[13px] font-semibold tracking-[0.12em] text-muted uppercase">Procedimento</h2>
      <ul className="mt-2 space-y-1.5">
        {procedures.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between gap-4 text-[13.5px]">
            <span>{name}</span>
            <span className="font-semibold tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </SectionPage>
  )
}
