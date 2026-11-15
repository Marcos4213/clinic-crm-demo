import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { QUALIFICATION_FIELDS, appBase, buildTimeline, formatSheetDate, formatSheetTime } from '../domain/lead-sheet'
import { brokerName } from '../domain/roulette'
import { useCrm } from '../state/useCrm'

function TemperatureBadge({ temperature }) {
  if (!temperature) return null
  const styles = {
    quente: 'bg-emerald/15 text-emerald',
    morno: 'bg-teal-100/40 text-[#D6E4F5]',
    frio: 'bg-white/5 text-muted',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[temperature] || styles.frio}`}>
      {temperature[0].toUpperCase() + temperature.slice(1)}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{label}</p>
      <div className="mt-0.5 text-[13px] leading-5 font-semibold text-ink">{children || '—'}</div>
    </div>
  )
}

function workspaceProfile(crm, id) {
  const lead = crm.leads?.find((item) => item.id === id)
  if (!lead) return null
  return {
    id: lead.id,
    name: lead.name,
    property: lead.procedure || lead.property || '',
    temperature: lead.temperature,
    brokerId: lead.broker_id || null,
    helenaActive: lead.aiActive,
    waiting: false,
    qualification: null,
    nextStep: lead.next_step
      ? { text: lead.next_step, at: lead.next_step_at, brokerId: lead.next_step_broker_id }
      : null,
    notes: [],
    events: (crm.stageEvents || [])
      .filter((event) => event.lead_id === id)
      .map((event) => ({
        id: event.id,
        type: 'assigned',
        detail: `Saiu de ${event.from_stage || '—'} para ${event.to_stage}.`,
        at: event.created_at,
      })),
    messages: (lead.messages || []).map((message) => ({
      ...message,
      text: message.text || message.body,
      at: message.at || message.created_at,
    })),
  }
}

export default function LeadProfile() {
  const { leadId } = useParams()
  const location = useLocation()
  const crm = useCrm()
  const base = appBase(location.pathname)
  const demo = crm.mode === 'demo'
  const profile = useMemo(
    () => crm.leadProfiles?.find((item) => item.id === leadId) || workspaceProfile(crm, leadId),
    [crm, leadId],
  )
  const [note, setNote] = useState('')
  const [step, setStep] = useState({
    text: profile?.nextStep?.text || '',
    at: profile?.nextStep?.at || '',
    brokerId: profile?.nextStep?.brokerId || profile?.brokerId || '',
  })

  useEffect(() => {
    setStep({
      text: profile?.nextStep?.text || '',
      at: profile?.nextStep?.at || '',
      brokerId: profile?.nextStep?.brokerId || profile?.brokerId || '',
    })
  }, [profile?.id, profile?.nextStep?.text, profile?.nextStep?.at, profile?.nextStep?.brokerId, profile?.brokerId])

  const timeline = useMemo(
    () => (profile ? buildTimeline({ messages: profile.messages, events: profile.events }) : []),
    [profile],
  )
  const brokers = crm.brokers || []
  const canEdit = demo && Boolean(profile)

  if (!profile) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <Link to={base} className="inline-flex items-center gap-1 text-[12px] font-semibold text-info">
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="mt-4 text-[24px] font-extrabold tracking-tight">Lead não encontrado</h1>
      </div>
    )
  }

  const responsible = brokerName(brokers, profile.brokerId) || profile.broker || 'A definir'
  const nextBroker = brokerName(brokers, step.brokerId) || brokerName(brokers, profile.nextStep?.brokerId)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-24">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`${base}/whatsapp`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-info">
              <ArrowLeft size={14} aria-hidden="true" />
              Voltar
            </Link>
            <h1 className="mt-2 truncate text-[24px] font-extrabold tracking-tight sm:text-[28px]">{profile.name}</h1>
            <p className="mt-1 truncate text-[13px] text-muted">{profile.property}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TemperatureBadge temperature={profile.temperature} />
              <span className="text-[12px] font-semibold text-ink">{responsible}</span>
              {profile.waiting && profile.waitingFor && (
                <span className="text-[12px] font-semibold text-emerald">À espera há {profile.waitingFor}</span>
              )}
            </div>
          </div>
          {demo && (
            <div className="flex shrink-0 flex-col gap-2">
              {profile.helenaActive ? (
                <button
                  type="button"
                  onClick={() => crm.assumeLead(profile.id)}
                  className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950"
                >
                  Assumir
                </button>
              ) : (
                <p className="text-right text-[12px] font-semibold text-ink">Você assumiu</p>
              )}
            </div>
          )}
        </header>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Qualificação da Helena</h2>
          {profile.qualification ? (
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUALIFICATION_FIELDS.map((field) => (
                <div key={field.key}>
                  <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{field.label}</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold">{profile.qualification[field.key] || '—'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Ainda sem respostas de qualificação.</p>
          )}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Próximo passo</h2>
          {canEdit ? (
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                crm.saveNextStep(profile.id, { text: step.text.trim(), at: step.at, brokerId: step.brokerId || null })
              }}
            >
              <label className="block text-[12px] font-semibold text-muted sm:col-span-2">
                Passo
                <input
                  value={step.text}
                  onChange={(event) => setStep((current) => ({ ...current, text: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink"
                />
              </label>
              <label className="block text-[12px] font-semibold text-muted">
                Data
                <input
                  type="date"
                  value={step.at}
                  onChange={(event) => setStep((current) => ({ ...current, at: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink"
                />
              </label>
              <label className="block text-[12px] font-semibold text-muted">
                Corretor responsável
                <select
                  value={step.brokerId}
                  onChange={(event) => setStep((current) => ({ ...current, brokerId: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink"
                >
                  <option value="">A definir</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
                  Gravar passo
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 space-y-2">
              <Field label="Passo">{profile.nextStep?.text}</Field>
              <Field label="Data">{formatSheetDate(profile.nextStep?.at)}</Field>
              <Field label="Corretor">{nextBroker}</Field>
            </div>
          )}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Corretor</h2>
          <p className="mt-2 text-[13px] font-semibold">{responsible}</p>
          {demo && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="block min-w-0 flex-1 text-[12px] font-semibold text-muted">
                Reatribuir
                <select
                  aria-label="Reatribuir corretor"
                  value={profile.brokerId || ''}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value) crm.assignLeadTo(profile.id, value, { source: 'manual' })
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink"
                >
                  <option value="">A definir</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                      {!broker.active ? ' (pausado)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => crm.assignByRoulette(profile.id)}
                className="h-10 shrink-0 self-end rounded-lg border border-emerald px-3 text-[12.5px] font-semibold text-emerald"
              >
                Atribuir pela roleta
              </button>
            </div>
          )}
          {crm.nextBroker && (
            <p className="mt-3 text-[12px] text-muted">
              Próximo da vez:{' '}
              <Link to={`${base}/equipe`} className="font-semibold text-emerald">
                {crm.nextBroker.name}
              </Link>
            </p>
          )}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Notas internas</h2>
          {profile.notes?.length ? (
            <ul className="mt-3 space-y-2">
              {profile.notes
                .slice()
                .sort((a, b) => new Date(b.at) - new Date(a.at))
                .map((item) => (
                  <li key={item.id} className="rounded-xl bg-canvas px-3 py-2.5">
                    <p className="flex items-center justify-between gap-2 text-[11px] text-muted">
                      <span className="font-semibold text-ink">{item.author}</span>
                      <span className="tabular-nums">{formatSheetTime(item.at)}</span>
                    </p>
                    <p className="mt-1 text-[13px] leading-5">{item.body}</p>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Nenhuma nota ainda.</p>
          )}
          {demo && (
            <form
              className="mt-3"
              onSubmit={(event) => {
                event.preventDefault()
                crm.addLeadNote(profile.id, note)
                setNote('')
              }}
            >
              <label className="block text-[12px] font-semibold text-muted" htmlFor="lead-note">
                Nova nota
                <textarea
                  id="lead-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink"
                />
              </label>
              <button
                type="submit"
                disabled={!note.trim()}
                className="mt-2 h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950 disabled:cursor-not-allowed disabled:bg-[#24344A] disabled:text-muted"
              >
                Gravar nota
              </button>
            </form>
          )}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Linha do tempo</h2>
          {timeline.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum evento ainda.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {timeline.map((item) => (
                <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <p className="pt-0.5 text-[11px] leading-4 text-muted tabular-nums">{formatSheetTime(item.at)}</p>
                  <div className="rounded-xl bg-canvas px-3 py-2.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                      {item.type === 'message' ? item.actor : item.type === 'temperature' ? 'Temperatura' : item.type === 'assumed' ? 'Assunção' : item.type === 'assigned' ? 'Corretor' : item.type === 'visit' ? 'Visita' : item.type === 'qualification' ? 'Qualificação' : item.type === 'note' ? 'Nota' : 'Helena'}
                    </p>
                    <p className="mt-1 text-[13px] leading-5">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
