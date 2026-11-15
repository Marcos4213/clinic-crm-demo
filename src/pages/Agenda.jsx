import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clinicDateKey, formatVisitTime } from '../domain/insights'
import { appBase } from '../domain/lead-sheet'
import { brokerName } from '../domain/roulette'
import { DAY_HOURS, VISIT_STATUSES, formatVisitDay, formatVisitHeading, shiftDateKey, startOfWeekKey, visitHour, visitStatusLabel, visitsOnDate, weekDateKeys } from '../domain/visits'
import useCompactViewport from '../hooks/useCompactViewport'
import { useCrm } from '../state/useCrm'

const BROKER_TONE = {
  carlos: 'bg-emerald/20 text-emerald',
  ana: 'bg-[#7FB3D8]/20 text-[#D6E4F5]',
  paulo: 'bg-teal-100/30 text-emerald',
  lucia: 'bg-white/10 text-[#D6E4F5]',
}

function enrichVisit(visit, crm) {
  const lead = crm.leadProfiles?.find((item) => item.id === visit.leadId) || crm.leads?.find((item) => item.id === visit.leadId)
  const listing = crm.properties?.find((item) => item.id === visit.propertyId)
  return {
    ...visit,
    name: lead?.name || 'Lead',
    property: listing?.title || lead?.property || '',
    broker: brokerName(crm.brokers, visit.brokerId) || visit.broker || '',
    leadId: visit.leadId,
  }
}

function StatusActions({ visit, onChange, compact }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {VISIT_STATUSES.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={visit.status === item.id}
          onClick={() => onChange(visit.id, item.id)}
          className={`h-8 rounded-lg px-2 text-[11px] font-semibold ${
            visit.status === item.id ? 'bg-emerald text-navy-950' : 'border border-line text-ink'
          }`}
        >
          {item.id === 'feita' ? 'Feita' : item.label}
        </button>
      ))}
    </div>
  )
}

function VisitCard({ visit, base, onStatus, showBroker = true }) {
  return (
    <article className="rounded-2xl bg-canvas px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">
            <Link to={`${base}/leads/${visit.leadId}`} className="hover:text-emerald">
              {visit.name}
            </Link>
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{visit.property}</p>
          <p className="mt-1 text-[12px] font-semibold tabular-nums">
            {formatVisitTime(visit.startsAt)}
            {showBroker && visit.broker ? ` · ${visit.broker}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-emerald uppercase">
          {visitStatusLabel(visit.status)}
        </span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-muted">Lembrete pendente de envio</p>
      <StatusActions visit={visit} onChange={onStatus} compact />
    </article>
  )
}

function WeekGrid({ days, visits, crm, onOpen }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-line">
          <div />
          {days.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              <p className="text-[11px] font-semibold tracking-wide text-muted">{formatVisitDay(day)}</p>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
            {DAY_HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="h-16 border-t border-line px-2 pt-1 text-[10px] font-semibold text-muted tabular-nums">{String(hour).padStart(2, '0')}:00</div>
                {days.map((day) => (
                  <div key={`${day}-${hour}`} className="h-16 border-t border-l border-line" />
                ))}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) =>
            visitsOnDate(visits, day).map((visit) => {
              const hour = visitHour(visit)
              if (hour < 8 || hour >= 20) return null
              const top = ((hour - 8) / DAY_HOURS.length) * 100
              const listing = crm.properties?.find((item) => item.id === visit.propertyId)
              const lead = crm.leadProfiles?.find((item) => item.id === visit.leadId)
              const tone = BROKER_TONE[visit.brokerId] || 'bg-emerald/20 text-emerald'
              return (
                <button
                  key={visit.id}
                  type="button"
                  onClick={() => onOpen?.(visit)}
                  className={`absolute rounded-md px-1.5 py-1 text-left ${tone}`}
                  style={{
                    top: `${top}%`,
                    left: `calc(4rem + (100% - 4rem) * ${dayIndex} / 7 + 3px)`,
                    width: 'calc((100% - 4rem) / 7 - 6px)',
                    minHeight: '2.25rem',
                  }}
                >
                  <p className="truncate text-[11px] font-semibold">{formatVisitTime(visit.startsAt)} · {lead?.name || 'Lead'}</p>
                  <p className="truncate text-[10px] opacity-80">{listing?.code || listing?.title || ''}</p>
                </button>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

export default function Agenda() {
  const crm = useCrm()
  const compact = useCompactViewport()
  const location = useLocation()
  const base = appBase(location.pathname)
  const today = clinicDateKey()
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState('semana')
  const [brokerId, setBrokerId] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const allVisits = useMemo(
    () => (crm.visits ?? []).map((item) => enrichVisit(item, crm)),
    [crm],
  )
  const filtered = useMemo(
    () => allVisits.filter((item) => !brokerId || item.brokerId === brokerId),
    [allVisits, brokerId],
  )
  const days = weekDateKeys(date)
  const weekStart = startOfWeekKey(date)
  const dayVisits = visitsOnDate(filtered, date)
  const selected = filtered.find((item) => item.id === selectedId)
  const view = compact ? 'dia' : mode

  function jump(daysCount) {
    setDate((current) => shiftDateKey(current, daysCount))
    setSelectedId(null)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-24">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">Visitas</h1>
            <p className="mt-1 text-[13px] text-muted">{formatVisitHeading(date)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!compact && (
              <div className="flex rounded-lg border border-line p-0.5">
                <button type="button" onClick={() => setMode('dia')} className={`h-8 rounded-md px-3 text-[12px] font-semibold ${view === 'dia' ? 'bg-emerald text-navy-950' : 'text-ink'}`}>
                  Dia
                </button>
                <button type="button" onClick={() => setMode('semana')} className={`h-8 rounded-md px-3 text-[12px] font-semibold ${view === 'semana' ? 'bg-emerald text-navy-950' : 'text-ink'}`}>
                  Semana
                </button>
              </div>
            )}
            <label className="text-[11px] font-semibold text-muted">
              <span className="sr-only">Filtrar por corretor</span>
              <select aria-label="Filtrar por corretor" value={brokerId} onChange={(event) => setBrokerId(event.target.value)} className="h-8 rounded-lg border border-line bg-surface px-2 text-[12px] font-semibold text-ink">
                <option value="">Todos os corretores</option>
                {(crm.brokers || []).map((broker) => (
                  <option key={broker.id} value={broker.id}>{broker.name}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="flex items-center gap-2">
          <button type="button" aria-label={view === 'semana' ? 'Semana anterior' : 'Dia anterior'} onClick={() => jump(view === 'semana' ? -7 : -1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setDate(today)} className="h-9 rounded-lg border border-line px-3 text-[12px] font-semibold text-ink">
            Hoje
          </button>
          <button type="button" aria-label={view === 'semana' ? 'Próxima semana' : 'Próximo dia'} onClick={() => jump(view === 'semana' ? 7 : 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          {view === 'semana' && (
            <p className="ml-1 text-[12px] text-muted">
              {formatVisitDay(weekStart)} — {formatVisitDay(days[6])}
            </p>
          )}
        </div>

        {view === 'semana' ? (
          <WeekGrid days={days} visits={filtered} crm={crm} onOpen={(visit) => { setDate(clinicDateKey(new Date(visit.startsAt))); setSelectedId(visit.id); setMode('dia') }} />
        ) : (
          <section className="space-y-2">
            {dayVisits.length === 0 ? (
              <p className="surface-card px-4 py-8 text-center text-[14px] text-muted">Nenhuma visita neste dia.</p>
            ) : (
              dayVisits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} base={base} onStatus={crm.setVisitStatus} showBroker={!brokerId} />
              ))
            )}
          </section>
        )}

        {view === 'semana' && selected && (
          <VisitCard visit={enrichVisit(selected, crm)} base={base} onStatus={crm.setVisitStatus} />
        )}

        <p className="text-[12px] text-muted">Para marcar uma visita, abra a ficha do lead. O lembrete fica pendente de envio e nenhuma mensagem sai daqui.</p>
      </div>
    </div>
  )
}

export { enrichVisit }
