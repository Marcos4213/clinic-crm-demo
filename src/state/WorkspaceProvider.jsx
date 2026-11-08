import { useCallback, useEffect, useMemo, useState } from 'react'
import { columnLabel, countByColumn, filterLeads, moveLead, sendHumanMessage, setAiActive } from '../domain/crm'
import { hasScheduledConflict, zonedLocalToUtc } from '../../supabase/functions/_shared/schedule.js'
import { mapAppointment, mapLead, readSchemaGuard } from '../data/workspace-api'
import { CrmContext } from './crm-context'

async function loadClinic(client) {
  const guard = await readSchemaGuard(client)
  if (!guard.ok) return { status: 'schema', guard }
  const { data: memberships, error } = await client
    .from('clinic_memberships')
    .select('clinic_id, role, clinics(id, name, is_demo, timezone)')
  if (error) return { status: 'error', message: error.message }
  const rows = memberships ?? []
  const real = rows.find((row) => row.clinics && row.clinics.is_demo === false)
  if (!real) return { status: 'onboarding' }
  return { status: 'ready', clinic: real.clinics, role: real.role }
}

export function WorkspaceProvider({ client, children }) {
  const [phase, setPhase] = useState('loading')
  const [clinic, setClinic] = useState(null)
  const [role, setRole] = useState('')
  const [notice, setNotice] = useState('')
  const [leads, setLeads] = useState([])
  const [appointments, setAppointments] = useState([])
  const [stageEvents, setStageEvents] = useState([])
  const [integrations, setIntegrations] = useState([])
  const [settings, setSettings] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [temperature, setTemperature] = useState('todos')
  const [drafts, setDrafts] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [aiNotice, setAiNotice] = useState('')

  const refresh = useCallback(async (clinicId) => {
    const [leadResult, messageResult, appointmentResult, eventResult, integrationResult, settingsResult] = await Promise.all([
      client.from('leads').select('*').eq('clinic_id', clinicId),
      client.from('messages').select('*').eq('clinic_id', clinicId),
      client.from('appointments').select('*').eq('clinic_id', clinicId),
      client.from('lead_stage_events').select('*').eq('clinic_id', clinicId),
      client.from('integration_status').select('*').eq('clinic_id', clinicId),
      client.from('clinic_settings').select('*').eq('clinic_id', clinicId).maybeSingle(),
    ])
    const failure = [leadResult, messageResult, appointmentResult, eventResult, integrationResult, settingsResult].find((item) => item.error)
    if (failure?.error) {
      setNotice(failure.error.message || 'Não foi possível ler a clínica.')
      return
    }
    const messages = messageResult.data ?? []
    const nextLeads = (leadResult.data ?? []).map((row) =>
      mapLead(
        row,
        messages.filter((message) => message.lead_id === row.id),
      ),
    )
    setLeads(nextLeads)
    setAppointments((appointmentResult.data ?? []).map(mapAppointment))
    setStageEvents(eventResult.data ?? [])
    setIntegrations(integrationResult.data ?? [])
    setSettings(settingsResult.data ?? null)
    setSelectedId((current) => current ?? nextLeads[0]?.id ?? null)
  }, [client])

  useEffect(() => {
    let active = true
    loadClinic(client).then((result) => {
      if (!active) return
      if (result.status === 'ready') {
        setClinic(result.clinic)
        setRole(result.role ?? '')
        setPhase('ready')
        refresh(result.clinic.id)
      } else {
        setPhase(result.status)
        if (result.message) setNotice(result.message)
      }
    })
    return () => {
      active = false
    }
  }, [client, refresh])

  const visibleLeads = useMemo(() => filterLeads(leads, { query, temperature }), [leads, query, temperature])
  const counts = useMemo(() => countByColumn(visibleLeads), [visibleLeads])
  const sampleCounts = useMemo(() => countByColumn(leads), [leads])
  const selected = leads.find((lead) => lead.id === selectedId) ?? null
  const draft = drafts[selectedId] ?? ''

  async function bootstrap(name) {
    const { data, error } = await client.rpc('bootstrap_workspace', { clinic_name: name })
    if (error) {
      setNotice(error.message || 'Não foi possível criar a clínica.')
      return
    }
    setPhase('loading')
    const loaded = await loadClinic(client)
    if (loaded.status === 'ready') {
      setClinic(loaded.clinic)
      setRole(loaded.role ?? '')
      setPhase('ready')
      await refresh(loaded.clinic.id)
    } else if (data) {
      setNotice('A clínica foi criada, mas a leitura ainda falhou.')
      setPhase('error')
    }
  }

  async function createDemoWorkspace() {
    const { error } = await client.rpc('create_demo_workspace')
    if (error) setNotice(error.message || 'Não foi possível criar a demonstração persistida.')
    else setNotice('Espaço de demonstração fictício criado nesta conta. Ele não substitui a clínica real.')
  }

  async function createLead({ name, phone, procedure }) {
    const { error } = await client.from('leads').insert({
      clinic_id: clinic.id,
      name,
      phone,
      procedure_name: procedure,
      temperature: 'morno',
      stage: 'em-atendimento',
      ai_active: true,
    })
    if (error) {
      setAnnouncement('Não foi possível criar o lead.')
      return
    }
    await refresh(clinic.id)
  }

  async function moveLeadTo(leadId, columnId) {
    const lead = leads.find((item) => item.id === leadId)
    const next = moveLead(leads, leadId, columnId)
    if (next === leads) return
    setLeads(next)
    setAnnouncement(`${lead.name} agora está em ${columnLabel(columnId)}`)
    const { error } = await client.from('leads').update({ stage: columnId }).eq('id', leadId).eq('clinic_id', clinic.id)
    if (error) {
      setLeads(leads)
      setAnnouncement('A etapa não foi gravada.')
      return
    }
    await refresh(clinic.id)
  }

  async function toggleTakeover(leadId = selectedId) {
    const lead = leads.find((item) => item.id === leadId)
    if (!lead) return
    setLeads(setAiActive(leads, leadId, !lead.aiActive))
    const { error } = await client.from('leads').update({ ai_active: !lead.aiActive }).eq('id', leadId).eq('clinic_id', clinic.id)
    if (error) {
      setLeads(leads)
      setAnnouncement('O controle do lead não foi gravado.')
    }
  }

  function setDraft(text) {
    setDrafts((current) => ({ ...current, [selectedId]: text }))
  }

  async function sendCurrent() {
    const lead = leads.find((item) => item.id === selectedId)
    if (!lead || lead.aiActive) return
    const text = (drafts[selectedId] ?? '').trim()
    if (!text) return
    const optimistic = sendHumanMessage(leads, selectedId, text, {
      id: `pending-${lead.id}`,
      at: new Date().toISOString(),
    })
    setLeads(optimistic)
    setDrafts((current) => ({ ...current, [selectedId]: '' }))
    const { error } = await client.from('messages').insert({
      clinic_id: clinic.id,
      lead_id: lead.id,
      author_role: 'humano',
      body: text,
      channel: 'internal',
      delivery: 'local',
    })
    if (error) {
      setLeads(leads)
      setAnnouncement('A mensagem não foi gravada.')
      return
    }
    await refresh(clinic.id)
  }

  function addAppointment({ leadId, date, time, slotMinutes = settings?.slot_minutes ?? 30 }) {
    const start = zonedLocalToUtc(date, time)
    if (!start) return { error: 'invalid' }
    const end = new Date(start.getTime() + slotMinutes * 60 * 1000)
    if (hasScheduledConflict(appointments, start, end)) return { error: 'conflict' }
    const optimistic = {
      id: `pending-${appointments.length + 1}`,
      lead_id: leadId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'scheduled',
    }
    setAppointments((current) => [...current, optimistic])
    client
      .from('appointments')
      .insert({
        clinic_id: clinic.id,
        lead_id: leadId,
        starts_at: optimistic.starts_at,
        ends_at: optimistic.ends_at,
        status: 'scheduled',
      })
      .then(({ error }) => {
        if (error) {
          setAppointments((current) => current.filter((item) => item.id !== optimistic.id))
          setAnnouncement(error.code === '23P01' ? 'Esse horário já está ocupado.' : 'O horário não foi gravado.')
          return
        }
        refresh(clinic.id)
      })
    return { ok: true, appointment: optimistic }
  }

  async function setAppointmentStatus(id, status) {
    const previous = appointments
    setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
    const { error } = await client.from('appointments').update({ status }).eq('id', id).eq('clinic_id', clinic.id)
    if (error) {
      setAppointments(previous)
      setAnnouncement('O status do horário não foi gravado.')
    }
  }

  function announce(message) {
    setNotice(message)
  }

  async function saveClinicProfile({ displayName, dayStart, dayEnd, slotMinutes, businessFaq }) {
    const { error } = await client
      .from('clinic_settings')
      .update({
        display_name: displayName,
        day_start: dayStart,
        day_end: dayEnd,
        slot_minutes: Number(slotMinutes),
        business_faq: businessFaq,
      })
      .eq('clinic_id', clinic.id)
    if (error) setNotice('Os ajustes da clínica não foram gravados.')
    else {
      setSettings((current) => ({
        ...current,
        display_name: displayName,
        day_start: dayStart,
        day_end: dayEnd,
        slot_minutes: Number(slotMinutes),
        business_faq: businessFaq,
      }))
      setNotice('Ajustes gravados nesta clínica.')
    }
  }

  async function askAi() {
    setAiNotice('')
    if (!selected || !selected.aiActive) {
      setAiNotice('A IA está pausada neste lead.')
      return
    }
    const message = (drafts[selected.id] ?? '').trim()
    if (!message) {
      setAiNotice('Escreva a mensagem do lead antes de pedir a IA.')
      return
    }
    const { data, error } = await client.functions.invoke('grok-reply', {
      body: { clinicId: clinic.id, leadId: selected.id, message },
    })
    if (error || data?.status === 'unconfigured' || data?.error === 'grok_unconfigured') {
      setAiNotice('Grok não está configurado no servidor. Nenhuma resposta foi simulada.')
      return
    }
    if (data?.status === 'human_takeover') {
      setAiNotice('A equipe assumiu este lead. A IA não gravou resposta.')
      return
    }
    if (data?.status !== 'saved') {
      setAiNotice(data?.error || 'A IA não concluiu o pedido.')
      return
    }
    setDrafts((current) => ({ ...current, [selected.id]: '' }))
    setAiNotice('Resposta interna gravada. Nenhum canal externo recebeu a mensagem.')
    await refresh(clinic.id)
  }

  const value = {
    mode: 'workspace',
    phase,
    clinic,
    role,
    notice,
    integrations,
    settings,
    bootstrap,
    createDemoWorkspace,
    saveFaq: saveClinicProfile,
    saveClinicProfile,
    announce,
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
    selectLead: setSelectedId,
    moveLeadTo,
    toggleTakeover,
    sendCurrent,
    announcement,
    appointments,
    stageEvents,
    addAppointment,
    setAppointmentStatus,
    createLead: clinic ? createLead : undefined,
    askAi: clinic ? askAi : undefined,
    aiNotice,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
