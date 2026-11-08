import { useMemo, useState } from 'react'
import { sampleLeads } from '../data/sampleLeads'
import { columnLabel, countByColumn, filterLeads, moveLead, sendHumanMessage, setAiActive } from '../domain/crm'
import { hasScheduledConflict, zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'
import { CrmContext } from './crm-context'

const cloneLeads = () => sampleLeads.map((lead) => ({ ...lead, messages: lead.messages.map((message) => ({ ...message })) }))

export function CrmProvider({ children }) {
  const [leads, setLeads] = useState(cloneLeads)
  const [selectedId, setSelectedId] = useState('maria')
  const [query, setQuery] = useState('')
  const [temperature, setTemperature] = useState('todos')
  const [drafts, setDrafts] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [appointments, setAppointments] = useState([])
  const [stageEvents, setStageEvents] = useState([])

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

  function resetDemo() {
    setLeads(cloneLeads())
    setSelectedId('maria')
    setQuery('')
    setTemperature('todos')
    setDrafts({})
    setAppointments([])
    setStageEvents([])
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
    resetDemo,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
