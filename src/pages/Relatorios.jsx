import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clinicDateKey, formatResponse } from '../domain/insights'
import { mergeLeadsForReport, weeklyReport } from '../domain/report'
import { formatVisitDay, shiftDateKey, startOfWeekKey } from '../domain/visits'
import { useCrm } from '../state/useCrm'

function dash(value, suffix = '') {
  if (value == null || value === '') return '—'
  return `${value}${suffix}`
}

function Trend({ trend }) {
  if (!trend || trend.label === '—') return <span className="text-[11px] font-semibold text-muted">—</span>
  const tone = trend.dir === 'up' ? 'text-emerald' : trend.dir === 'down' ? 'text-[#E4C27A]' : 'text-muted'
  return <span className={`text-[11px] font-semibold ${tone}`}>{trend.label} vs semana anterior</span>
}

function Stat({ label, shortLabel, value, trend }) {
  return (
    <article aria-label={label} className="surface-card px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase sm:text-[11px]">
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </p>
      <p className="mt-2 text-[22px] leading-none font-extrabold tracking-tight tabular-nums sm:text-[28px]">{value}</p>
      <p className="mt-2"><Trend trend={trend} /></p>
    </article>
  )
}

export default function Relatorios() {
  const crm = useCrm()
  const today = clinicDateKey()
  const [weekStart, setWeekStart] = useState(() => startOfWeekKey(today))
  const report = useMemo(
    () =>
      weeklyReport({
        leads: mergeLeadsForReport(crm.leads ?? [], crm.leadProfiles ?? []),
        visits: crm.visits ?? [],
        brokers: crm.brokers ?? [],
        weekStart,
      }),
    [crm.leadProfiles, crm.leads, crm.visits, crm.brokers, weekStart],
  )
  const { current, trends } = report

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-24">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">Relatório semanal</h1>
            <p className="mt-1 text-[13px] text-muted">
              {formatVisitDay(weekStart)} — {formatVisitDay(shiftDateKey(weekStart, 6))}
            </p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Semana anterior" onClick={() => setWeekStart((current) => shiftDateKey(current, -7))} className="grid h-9 w-9 place-items-center rounded-lg border border-line">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setWeekStart(startOfWeekKey(today))} className="h-9 rounded-lg border border-line px-3 text-[12px] font-semibold">
              Esta semana
            </button>
            <button type="button" aria-label="Próxima semana" onClick={() => setWeekStart((current) => shiftDateKey(current, 7))} className="grid h-9 w-9 place-items-center rounded-lg border border-line">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => window.print()} className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
              Exportar PDF
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Volume de leads" shortLabel="Volume" value={String(current.volume)} trend={trends.volume} />
          <Stat label="Qualificados" value={current.qualified == null ? '—' : `${current.qualified}%`} trend={trends.qualified} />
          <Stat label="Tempo de assunção" shortLabel="Assunção" value={dash(formatResponse(current.assumption))} trend={trends.assumption} />
          <Stat label="Visitas agendadas" shortLabel="Agendadas" value={String(current.visits.agendadas)} trend={trends.agendadas} />
          <Stat label="Visitas feitas" shortLabel="Feitas" value={String(current.visits.feitas)} trend={trends.feitas} />
          <Stat label="No-show" value={String(current.visits.noShow)} trend={trends.noShow} />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Por corretor</h2>
            {report.byBroker.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">Sem leads nesta semana.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {report.byBroker.map((row) => (
                  <li key={row.id} className="rounded-xl bg-canvas px-3 py-2.5">
                    <p className="text-[13px] font-semibold">{row.name}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {row.leads} {row.leads === 1 ? 'lead' : 'leads'} · assunção {dash(formatResponse(row.assumption))} · {row.visits.feitas} feitas · {row.visits.noShow} no-show
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Por origem</h2>
            <ul className="mt-3 space-y-2">
              {report.bySource.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5">
                  <p className="text-[13px] font-semibold">{row.label}</p>
                  <p className="text-[12px] text-muted tabular-nums">
                    {row.leads} {row.leads === 1 ? 'lead' : 'leads'}
                    {row.qualified == null ? '' : ` · ${row.qualified}% qualificados`}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}
