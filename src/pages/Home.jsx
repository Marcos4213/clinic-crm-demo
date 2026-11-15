import { useState } from 'react'
import { Link } from 'react-router-dom'
import { demoDashboardLeads } from '../data/demo-catalog'
import {
  averageAssumptionMinutes,
  clinicDateKey,
  brokerRanking,
  formatResponse,
  formatVisitTime,
  hotLeadsWaiting,
  interestOf,
  pendingDeskLeads,
  pendingStatus,
  qualifiedRate,
  visitStatusLabel,
} from '../domain/insights'
import { AlertActions } from '../components/alerts/AlertCenter'
import { useCrm } from '../state/useCrm'

function Stat({ label, shortLabel, value }) {
  return (
    <article aria-label={label} className="surface-card px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase sm:text-[11px] sm:tracking-[0.14em]">
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </p>
      <p className="mt-2 text-[22px] leading-none font-extrabold tracking-tight tabular-nums sm:text-[28px]">{value}</p>
    </article>
  )
}

function dash(value) {
  return value == null || value === '' ? '—' : value
}

export default function Home() {
  const crm = useCrm()
  const demo = crm.mode !== 'workspace'
  const [preview, setPreview] = useState('owner')
  const persona = demo ? preview : crm.role === 'owner' ? 'owner' : 'staff'
  const base = demo ? '/demo' : '/app'
  const leads = demo ? demoDashboardLeads : crm.leads
  const volume = leads.length
  const qualified = qualifiedRate(leads)
  const assumption = formatResponse(averageAssumptionMinutes(leads))
  const hot = hotLeadsWaiting(leads)
  const ranking = brokerRanking(leads)
  const pending = pendingDeskLeads(leads)
  const visits = (crm.visits ?? []).filter((item) => {
    const start = item.startsAt || item.starts_at
    return start && clinicDateKey(new Date(start)) === clinicDateKey()
  }).map((item) => {
    const lead = (crm.leadProfiles || []).find((entry) => entry.id === item.leadId) || (crm.leads || []).find((entry) => entry.id === item.leadId || entry.id === item.lead_id)
    const listing = (crm.properties || []).find((entry) => entry.id === item.propertyId)
    return {
      id: item.id,
      leadId: item.leadId || item.lead_id,
      name: lead?.name ?? item.name ?? 'Lead',
      property: listing?.title || lead?.property || item.property || '',
      time: formatVisitTime(item.startsAt || item.starts_at),
      status: item.status,
      broker: item.broker || lead?.broker,
    }
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight sm:text-[32px]">Início</h1>
          {demo && (
            <div role="radiogroup" aria-label="Visão" className="inline-flex gap-1">
              {[
                ['owner', 'Dono'],
                ['staff', 'Atendente'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={persona === id}
                  onClick={() => setPreview(id)}
                  className={`h-7 rounded-full px-2.5 text-[11px] font-semibold ${
                    persona === id ? 'bg-surface text-ink ring-1 ring-line' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>

        {persona === 'owner' ? (
          <>
            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Volume de leads" shortLabel="Volume" value={String(volume)} />
              <Stat label="Qualificados" value={qualified == null ? '—' : `${qualified}%`} />
              <Stat label="Tempo de assunção" shortLabel="Assunção" value={dash(assumption)} />
            </section>
            {(crm.alerts ?? []).length > 0 && (
              <section className="surface-card p-4 ring-1 ring-emerald/40">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold">Leads parados</h2>
                  <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[11px] font-semibold text-emerald">{crm.alerts.length}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {crm.alerts.map((alert) => (
                    <li key={alert.id} className="rounded-xl bg-canvas px-3 py-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`${base}/leads/${alert.leadId}`} className="text-[13px] font-semibold hover:text-emerald">
                            {alert.name}
                          </Link>
                          <p className="mt-0.5 text-[12px] text-muted">{alert.reason}</p>
                        </div>
                        <AlertActions leadId={alert.leadId} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="grid gap-3 lg:grid-cols-2">
              <article className="surface-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold">Leads quentes aguardando corretor</h2>
                  <Link to={`${base}/whatsapp`} className="text-[12px] font-semibold text-emerald">
                    Conversas
                  </Link>
                </div>
                {hot.length === 0 ? (
                  <p className="mt-3 text-[13px] leading-5 text-muted">Nenhum lead quente aguardando.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {hot.map((lead) => (
                      <li key={lead.id}>
                        <Link to={`${base}/leads/${lead.id}`} className="block rounded-xl bg-canvas px-3 py-2.5 hover:bg-white/5">
                          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                            <span className="truncate">{lead.name}</span>
                            {lead.waitingFor && <span className="shrink-0 text-emerald tabular-nums">{lead.waitingFor}</span>}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-muted">{interestOf(lead)}</p>
                          {lead.broker && <p className="mt-0.5 text-[12px] text-muted">{lead.broker}</p>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="surface-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold">Corretores</h2>
                  <Link to={`${base}/equipe`} className="text-[12px] font-semibold text-emerald">
                    Equipe
                  </Link>
                </div>
                {ranking.length === 0 ? (
                  <p className="mt-3 text-[13px] leading-5 text-muted">Sem tempo de assunção para comparar.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {ranking.map((row, index) => (
                      <li key={row.broker} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold">
                            <span className="mr-2 text-muted tabular-nums">{index + 1}</span>
                            {row.broker}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {row.leads} {row.leads === 1 ? 'lead' : 'leads'}
                          </p>
                        </div>
                        <p className="shrink-0 text-[13px] font-semibold tabular-nums">{formatResponse(row.minutes)}</p>
                      </li>
                    ))}
                  </ol>
                )}
                {crm.nextBroker && (
                  <p className="mt-3 text-[12px] text-muted">
                    Próximo da vez:{' '}
                    <span className="font-semibold text-emerald">{crm.nextBroker.name}</span>
                  </p>
                )}
              </article>
            </section>
          </>
        ) : (
          <section className="grid gap-3 lg:grid-cols-2">
            <article className="surface-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold">Pendentes</h2>
                <Link to={`${base}/whatsapp`} className="text-[12px] font-semibold text-emerald">
                  Conversas
                </Link>
              </div>
              {pending.length === 0 ? (
                <p className="mt-3 text-[13px] leading-5 text-muted">Nenhum lead pendente.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {pending.map((lead) => (
                    <li key={lead.id}>
                      <Link to={`${base}/leads/${lead.id}`} className="block rounded-xl bg-canvas px-3 py-2.5 hover:bg-white/5">
                        <p className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                          <span className="truncate">{lead.name}</span>
                          {lead.waitingFor && <span className="shrink-0 text-emerald tabular-nums">{lead.waitingFor}</span>}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-muted">{interestOf(lead)}</p>
                        <p className="mt-1 text-[11px] font-semibold text-emerald">{pendingStatus(lead)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="surface-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold">Visitas de hoje</h2>
                <Link to={`${base}/agenda`} className="text-[12px] font-semibold text-emerald">
                  Visitas
                </Link>
              </div>
              {visits.length === 0 ? (
                <p className="mt-3 text-[13px] leading-5 text-muted">Nenhuma visita hoje.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {visits.map((item) => (
                    <li key={item.id}>
                      {item.leadId ? (
                        <Link to={`${base}/leads/${item.leadId}`} className="block rounded-xl bg-canvas px-3 py-2.5 hover:bg-white/5">
                          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                            <span className="truncate">{item.name}</span>
                            <span className="shrink-0 tabular-nums">{item.time}</span>
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-muted">{item.property}</p>
                          <p className="mt-1 text-[11px] font-semibold text-emerald">{visitStatusLabel(item.status)}</p>
                        </Link>
                      ) : (
                        <div className="rounded-xl bg-canvas px-3 py-2.5">
                          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                            <span className="truncate">{item.name}</span>
                            <span className="shrink-0 tabular-nums">{item.time}</span>
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-muted">{item.property}</p>
                          <p className="mt-1 text-[11px] font-semibold text-emerald">{visitStatusLabel(item.status)}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        )}
      </div>
    </div>
  )
}
