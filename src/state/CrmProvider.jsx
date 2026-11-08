import { useMemo, useState } from 'react'
import { sampleLeads } from '../data/sampleLeads'
import { columnLabel, countByColumn, filterLeads, moveLead, sendHumanMessage, setAiActive } from '../domain/crm'
import { CrmContext } from './crm-context'

export function CrmProvider({ children }) {
  const [leads, setLeads] = useState(sampleLeads)
  const [selectedId, setSelectedId] = useState('maria')
  const [query, setQuery] = useState('')
  const [temperature, setTemperature] = useState('todos')
  const [drafts, setDrafts] = useState({})
  const [announcement, setAnnouncement] = useState('')

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

  const value = {
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
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
