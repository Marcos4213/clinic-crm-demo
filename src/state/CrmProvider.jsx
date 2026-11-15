import { useMemo, useState } from 'react'
import { cloneBrokers, cloneLeadProfiles, demoNextBrokerId } from '../data/demo-leads'
import { cloneProperties, seedDemoVisits, withPropertyLinks } from '../data/demo-properties'
import { sampleLeads } from '../data/sampleLeads'
import { columnLabel, countByColumn, filterLeads, moveLead, sendHumanMessage, setAiActive } from '../domain/crm'
import { hasScheduledConflict, zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'
import { clinicDateKey } from '../domain/insights'
import { assignHotLead, brokerName, currentTurn, moveBroker as moveBrokerOrder, resolveNextAfterPause } from '../domain/roulette'
import { buildVisit, hasVisitConflict, visitStatusLabel } from '../domain/visits'
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
    display_name: 'Aurora Imóveis',
    day_start: '09:00',
    day_end: '18:00',
    slot_minutes: 30,
  })
  const [brokers, setBrokers] = useState(cloneBrokers)
  const [nextBrokerId, setNextBrokerId] = useState(demoNextBrokerId)
  const [leadProfiles, setLeadProfiles] = useState(() => withPropertyLinks(cloneLeadProfiles()))
  const [properties, setProperties] = useState(cloneProperties)
  const [visits, setVisits] = useState(seedDemoVisits)

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

  function appendEvent(leadId, event) {
    setLeadProfiles((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              events: [
                ...lead.events,
                { id: `local-${leadId}-${lead.events.length + 1}`, at: new Date().toISOString(), ...event },
              ],
            }
          : lead,
      ),
    )
  }

  function setBrokerActive(brokerId, active) {
    setBrokers((current) => {
      const next = current.map((broker) => (broker.id === brokerId ? { ...broker, active } : broker))
      setNextBrokerId((pointer) => resolveNextAfterPause(next, pointer))
      return next
    })
  }

  function moveBroker(brokerId, direction) {
    setBrokers((current) => moveBrokerOrder(current, brokerId, direction))
  }

  function assignLeadTo(leadId, brokerId, { source = 'manual' } = {}) {
    const broker = brokers.find((item) => item.id === brokerId)
    if (!broker) return
    setLeadProfiles((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              brokerId,
              events: [
                ...lead.events,
                {
                  id: `local-${leadId}-${lead.events.length + 1}`,
                  type: 'assigned',
                  actor: source === 'roulette' ? 'Roleta' : 'Você',
                  detail: source === 'roulette' ? `Caiu para ${broker.name}, corretor da vez.` : `Reatribuído para ${broker.name}.`,
                  at: new Date().toISOString(),
                },
              ],
            }
          : lead,
      ),
    )
    if (source === 'roulette') {
      setNextBrokerId(assignHotLead({ id: leadId }, brokers, nextBrokerId).nextBrokerId)
    }
    setAnnouncement(`${broker.name} ficou com o lead.`)
  }

  function assignByRoulette(leadId) {
    const result = assignHotLead(leadProfiles.find((item) => item.id === leadId) || { id: leadId }, brokers, nextBrokerId)
    if (!result.lead.brokerId) {
      setAnnouncement('Nenhum corretor ativo na roleta.')
      return
    }
    assignLeadTo(leadId, result.lead.brokerId, { source: 'roulette' })
  }

  function assumeLead(leadId) {
    const lead = leadProfiles.find((item) => item.id === leadId)
    if (!lead) return
    let brokerId = lead.brokerId
    if (!brokerId) {
      const result = assignHotLead(lead, brokers, nextBrokerId)
      brokerId = result.lead.brokerId
      if (brokerId) {
        assignLeadTo(leadId, brokerId, { source: 'roulette' })
      }
    }
    setLeadProfiles((current) =>
      current.map((item) => (item.id === leadId ? { ...item, helenaActive: false, waiting: false } : item)),
    )
    setLeads((current) => setAiActive(current, leadId, false))
    appendEvent(leadId, { type: 'assumed', actor: 'Você', detail: 'Você assumiu o atendimento.' })
    const name = brokerName(brokers, brokerId)
    setAnnouncement(name ? `Você assumiu. Corretor: ${name}.` : 'Você assumiu o atendimento.')
  }

  function addLeadNote(leadId, body) {
    const text = String(body ?? '').trim()
    if (!text) return
    setLeadProfiles((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              notes: [
                ...lead.notes,
                { id: `note-local-${lead.notes.length + 1}`, author: 'Você', body: text, at: new Date().toISOString() },
              ],
            }
          : lead,
      ),
    )
    setAnnouncement('Nota gravada só nesta demonstração.')
  }

  function saveNextStep(leadId, nextStep) {
    setLeadProfiles((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, nextStep } : lead)),
    )
    setAnnouncement('Próximo passo gravado só nesta demonstração.')
  }

  function saveProperty(input) {
    const payload = { ...input, title: String(input.title ?? '').trim(), region: String(input.region ?? '').trim(), code: String(input.code ?? '').trim() }
    if (!payload.title || !payload.region || !payload.code || !payload.dealType || !payload.propertyType) {
      return { error: 'invalid' }
    }
    setProperties((current) => {
      const existing = current.find((item) => item.id === payload.id)
      if (existing) return current.map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
      return [...current, { photo: '/imoveis/im-generic.svg', details: '', area: payload.area || null, status: payload.status || 'disponivel', ...payload, id: payload.id || `im-local-${current.length + 1}` }]
    })
    setAnnouncement('Imóvel gravado só nesta demonstração.')
    return { ok: true }
  }

  function suggestProperty(leadId, propertyId) {
    const listing = properties.find((item) => item.id === propertyId)
    if (!listing) return
    setLeadProfiles((current) =>
      current.map((lead) =>
        lead.id === leadId && !lead.suggestedPropertyIds.includes(propertyId)
          ? { ...lead, suggestedPropertyIds: [...lead.suggestedPropertyIds, propertyId] }
          : lead,
      ),
    )
    appendEvent(leadId, { type: 'assigned', actor: 'Você', detail: `Sugeriu ${listing.code} · ${listing.title}.` })
    setAnnouncement(`Você sugeriu ${listing.code}. Nenhuma mensagem saiu.`)
  }

  function linkProperty(leadId, propertyId) {
    const listing = properties.find((item) => item.id === propertyId)
    if (!listing) return
    setLeadProfiles((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              propertyId,
              property: listing.title,
              suggestedPropertyIds: lead.suggestedPropertyIds.includes(propertyId)
                ? lead.suggestedPropertyIds
                : [...lead.suggestedPropertyIds, propertyId],
            }
          : lead,
      ),
    )
    appendEvent(leadId, { type: 'assigned', actor: 'Você', detail: `Vinculou ${listing.code} · ${listing.title}.` })
    setAnnouncement(`${listing.code} ficou vinculado ao lead.`)
  }

  function addVisit({ leadId, propertyId, brokerId, date, time, slotMinutes = 30 }) {
    const built = buildVisit({ leadId, propertyId, brokerId, date, time, slotMinutes, id: `v-local-${visits.length + 1}` })
    if (built.error) return built
    if (hasVisitConflict(visits, built.visit)) return { error: 'conflict' }
    setVisits((current) => [...current, built.visit])
    const listing = properties.find((item) => item.id === propertyId)
    const broker = brokerName(brokers, brokerId)
    const when = `${date} às ${time}`
    appendEvent(leadId, {
      type: 'visit',
      actor: broker || 'Você',
      detail: `Visita marcada para ${when}${listing ? ` em ${listing.title}` : ''}. Lembrete pendente de envio.`,
    })
    setAnnouncement('Visita marcada. Lembrete pendente de envio. Nada foi enviado.')
    return { ok: true, visit: built.visit }
  }

  function setVisitStatus(id, status) {
    const current = visits.find((item) => item.id === id)
    setVisits((list) => list.map((item) => (item.id === id ? { ...item, status } : item)))
    if (current?.leadId) {
      appendEvent(current.leadId, { type: 'visit', actor: 'Você', detail: `Status da visita: ${visitStatusLabel(status)}.` })
    }
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
    setBrokers(cloneBrokers())
    setNextBrokerId(demoNextBrokerId)
    setLeadProfiles(withPropertyLinks(cloneLeadProfiles()))
    setProperties(cloneProperties())
    setVisits(seedDemoVisits())
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
    brokers,
    nextBrokerId,
    nextBroker: currentTurn(brokers, nextBrokerId),
    leadProfiles,
    setBrokerActive,
    moveBroker,
    assignLeadTo,
    assignByRoulette,
    assumeLead,
    addLeadNote,
    saveNextStep,
    properties,
    visits,
    saveProperty,
    suggestProperty,
    linkProperty,
    addVisit,
    setVisitStatus,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
