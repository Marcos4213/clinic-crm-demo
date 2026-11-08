import { BarChart3 } from 'lucide-react'
import { reportFromWorkspace } from '../../supabase/functions/_shared/schedule.js'
import { temperatureLabel } from '../domain/crm'
import { useCrm } from '../state/useCrm'
import SectionPage from './SectionPage'

export default function Reports() {
  const crm = useCrm()
  const { leads } = crm
  const report = reportFromWorkspace({
    leads: leads.map((lead) => ({ ...lead, stage: lead.stage ?? lead.column })),
    appointments: crm.appointments ?? [],
    stageEvents: crm.stageEvents ?? [],
  })
  const counts = report.stageCounts
  const temperatures = ['quente', 'morno', 'frio'].map((id) => ({
    id,
    label: temperatureLabel(id),
    count: report.temperatureCounts[id],
  }))
  const procedures = [...leads.reduce((map, lead) => map.set(lead.procedure, (map.get(lead.procedure) ?? 0) + 1), new Map())].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'),
  )
  const localDemo = crm.mode !== 'workspace'

  return (
    <SectionPage icon={BarChart3} kicker={localDemo ? 'Convertize · amostra local' : 'Convertize · dados da clínica'} title="Relatórios">
      <p className="text-[14px] leading-6 text-ink">
        {localDemo
          ? 'Números calculados só com a amostra fictícia deste navegador. Sem receita e sem ROI.'
          : 'Números calculados com os registros desta clínica. Sem receita inventada e sem ROI.'}
      </p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas px-3 py-2.5">
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Leads na amostra</dt>
          <dd className="mt-1 text-[20px] font-semibold tabular-nums">{report.leadCount}</dd>
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
