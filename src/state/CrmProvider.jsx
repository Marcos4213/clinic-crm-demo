import { useMemo, useState } from 'react'
import { sampleLeads } from '../data/sampleLeads'
import { columnLabel, countByColumn, filterLeads, moveLead, sendHumanMessage, setAiActive } from '../domain/crm'
import { hasScheduledConflict, zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'
import { clinicDateKey } from '../domain/insights'
import { CrmContext } from './crm-context'

const cloneLeads = () => sampleLeads.map((lead) => ({ ...lead, messages: lead.messages.map((message) => ({ ...message })) }))

function seedAppointments() {
  const date = clinicDateKey()
  return [
    ['beatriz', '11:00', 'scheduled'],
    ['pedro', '15:00', 'attended'],
  ].flatMap(([leadId, time, status], index) => {
    const start = zonedLocalToUtc(date, time)
    if (!start) return []
    return [
      {
        id: `seed-${index + 1}`,
        lead_id: leadId,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
        status,
      },
    ]
  })
}

export function CrmProvider({ children }) {
  const [leads, setLeads] = useState(cloneLeads)
  const [selectedId, setSelectedId] = useState('maria')
  const [query, setQuery] = useState('')
  const [temperature, setTemperature] = useState('todos')
  const [drafts, setDrafts] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [appointments, setAppointments] = useState(seedAppointments)
  const [stageEvents, setStageEvents] = useState([])
  const [reviewAsks, setReviewAsks] = useState([])
  const [profile, setProfile] = useState({
    display_name: 'Clínica Aurora',
    day_start: '09:00',
    day_end: '18:00',
    slot_minutes: 30,
  })

  const visibleLeads = useMemo(() => filterLeads(leads, { query, temperature }), [leads, query, temperature])
  const counts = useMemo(() => countByColumn(visibleLeads), [visibleLeads])
  const sampleCounts = useMemo(() => countByColumn(leads), [leads])
  const selected = leads.find((lead) => lead.id === selectedId) ?? null
  const draft = drafts[selectedId] ?? ''

  function selectLead(id) {
    setSelectedId(id)
  }

  function moveLeadTo(leadId, columnId) {
    const lead = leads.find((item) => item.id === leadId)
    const next = moveLead(leads, leadId, columnId)
    if (next !== leads && lead) {
      setStageEvents((current) => [
        ...current,
        { id: `local-${leadId}-${current.length + 1}`, lead_id: leadId, from_stage: lead.column, to_stage: columnId },
      ])
      setAnnouncement(`${lead.name} agora está em ${columnLabel(columnId)}`)
    }
    setLeads(next)
  }

  function toggleTakeover(leadId = selectedId) {
    const lead = leads.find((item) => item.id === leadId)
    if (!lead) return
    setLeads(setAiActive(leads, leadId, !lead.aiActive))
  }

  function setDraft(text) {
    setDrafts((current) => ({ ...current, [selectedId]: text }))
  }

  function sendCurrent() {
    const lead = leads.find((item) => item.id === selectedId)
    if (!lead || lead.aiActive) return
    const text = drafts[selectedId] ?? ''
    const next = sendHumanMessage(leads, selectedId, text, {
      id: `local-${lead.id}-${lead.messages.length + 1}`,
      at: new Date().toISOString(),
    })
    if (next === leads) return
    setLeads(next)
    setDrafts((current) => ({ ...current, [selectedId]: '' }))
  }

  function addAppointment({ leadId, date, time, slotMinutes = 30 }) {
    const start = zonedLocalToUtc(date, time)
    if (!start) return { error: 'invalid' }
    const end = new Date(start.getTime() + slotMinutes * 60 * 1000)
    if (hasScheduledConflict(appointments, start, end)) return { error: 'conflict' }
    const appointment = {
      id: `local-appt-${appointments.length + 1}`,
      lead_id: leadId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'scheduled',
    }
    setAppointments((current) => [...current, appointment])
    return { ok: true, appointment }
  }

  function setAppointmentStatus(id, status) {
    setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  function askReview(appointmentId) {
    const appointment = appointments.find((item) => item.id === appointmentId)
    const lead = leads.find((item) => item.id === appointment?.lead_id)
    const name = lead?.name ?? 'Paciente'
    setReviewAsks((current) => {
      if (current.some((item) => item.appointmentId === appointmentId)) return current
      return [
        ...current,
        {
          id: `ask-${appointmentId}`,
          appointmentId,
          name,
          procedure: lead?.procedure ?? 'Consulta',
          preview: `Olá, ${name}. Como foi sua consulta? Se puder, conte no Google como foi o atendimento. Esta prévia fica só na demonstração e não foi enviada.`,
        },
      ]
    })
    setAnnouncement(`Prévia de avaliação preparada para ${name}. Nenhuma mensagem saiu.`)
  }

  function saveClinicProfile({ displayName, dayStart, dayEnd, slotMinutes }) {
    setProfile({
      display_name: displayName,
      day_start: dayStart,
      day_end: dayEnd,
      slot_minutes: Number(slotMinutes),
    })
    setAnnouncement('Horário gravado só nesta demonstração.')
  }

  function resetDemo() {
    setLeads(cloneLeads())
    setSelectedId('maria')
    setQuery('')
    setTemperature('todos')
    setDrafts({})
    setAppointments(seedAppointments())
    setStageEvents([])
    setReviewAsks([])
    setAnnouncement('Amostra local restaurada. Nada foi gravado em uma clínica.')
  }

  const value = {
    mode: 'demo',
    leads,
    visibleLeads,
    counts,
    sampleCounts,
    selected,
    selectedId,
    query,
    setQuery,
    temperature,
    setTemperature,
    draft,
    setDraft,
    selectLead,
    moveLeadTo,
    toggleTakeover,
    sendCurrent,
    announcement,
    appointments,
    stageEvents,
    addAppointment,
    setAppointmentStatus,
    reviewAsks,
    askReview,
    profile,
    settings: profile,
    clinic: { name: profile.display_name },
    integrations: [],
    saveClinicProfile,
    resetDemo,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
