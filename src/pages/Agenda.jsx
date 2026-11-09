import { useState } from 'react'
import { formatInClinicZone } from '../../supabase/functions/_shared/schedule.js'
import { externalCalendars } from '../data/demo-catalog'
import { clinicDateKey } from '../domain/insights'
import { useCrm } from '../state/useCrm'

const STATUS_LABEL = {
  scheduled: 'Agendado',
  attended: 'Compareceu',
  no_show: 'Faltou',
  canceled: 'Cancelado',
}

export default function Agenda() {
  const crm = useCrm()
  const [date, setDate] = useState(() => clinicDateKey())
  const [time, setTime] = useState('10:00')
  const [alert, setAlert] = useState('')

  function onSubmit(event) {
    event.preventDefault()
    if (!crm.selected) {
      setAlert('Escolha um lead no funil antes de agendar.')
      return
    }
    const result = crm.addAppointment({ leadId: crm.selected.id, date, time })
    if (result.error === 'conflict') {
      setAlert('Esse horário já está ocupado.')
      return
    }
    if (result.error) {
      setAlert('Não foi possível agendar com esses dados.')
      return
    }
    setAlert('')
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">Agenda interna · America/Sao_Paulo</p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Agenda</h1>
        <p className="mt-2 text-[13px] leading-5 text-muted">
          Horários desta clínica. Google Calendar não está conectado. Conflito vale só para status agendado.
        </p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-4">
          <label className="text-[12px] font-semibold text-muted sm:col-span-2">
            Lead
            <input value={crm.selected?.name ?? 'Nenhum lead selecionado'} readOnly className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink" />
          </label>
          <label className="text-[12px] font-semibold text-muted" htmlFor="agenda-date">
            Data
            <input id="agenda-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink" />
          </label>
          <label className="text-[12px] font-semibold text-muted" htmlFor="agenda-time">
            Hora
            <input id="agenda-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-emerald px-3 text-[13px] font-semibold text-[#080F1C] sm:col-span-4">
            Agendar
          </button>
        </form>
        {alert && (
          <p role="alert" className="mt-3 text-[13px] text-ink">
            {alert}
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {crm.appointments.map((item) => {
            const lead = crm.leads.find((entry) => entry.id === item.lead_id)
            return (
              <li key={item.id} className="rounded-xl border border-line bg-surface px-3 py-3">
                <p className="text-[14px] font-semibold">{lead?.name ?? 'Lead'}</p>
                <p className="mt-1 text-[12px] text-muted">
                  {formatInClinicZone(new Date(item.starts_at))} · {STATUS_LABEL[item.status] ?? item.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['attended', 'no_show', 'canceled'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => crm.setAppointmentStatus(item.id, status)}
                      className="h-8 rounded-lg border border-line px-2 text-[12px] font-semibold text-ink"
                    >
                      {STATUS_LABEL[status]}
                    </button>
                  ))}
                  {item.status === 'attended' && crm.mode === 'workspace' && (
                    <button type="button" disabled className="h-8 rounded-lg border border-line px-2 text-[12px] font-semibold text-muted">
                      Pedir avaliação · Ativado na implantação
                    </button>
                  )}
                  {item.status === 'attended' && crm.mode !== 'workspace' && (
                    <button type="button" onClick={() => crm.askReview(item.id)} className="h-8 rounded-lg bg-emerald px-2 text-[12px] font-semibold text-[#080F1C]">
                      Pedir avaliação
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <section className="mt-8">
          <h2 className="text-[16px] font-semibold">Agendas que a clínica já usa</h2>
          <p className="mt-2 text-[13px] leading-5 text-muted">
            A recepção não precisa abandonar o sistema atual. A ligação fica para a implantação.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {externalCalendars.map((tool) => (
              <li key={tool.id} className="rounded-2xl border border-line bg-surface px-3 py-3">
                <p className="text-[14px] font-semibold">{tool.name}</p>
                <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-emerald uppercase">Não conectado</p>
                <p className="mt-2 text-[12px] leading-5 text-muted">{tool.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
