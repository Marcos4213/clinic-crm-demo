import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { useCrm } from '../state/useCrm'

const COPY = {
  whatsapp: {
    unconfigured: 'A linha da clínica ainda não foi registrada.',
    pending: 'A linha está registrada. As conversas entram quando alguém escrever. Nada parte sozinho.',
  },
  grok: {
    unconfigured: 'A equipe pede a resposta. Sem chave no servidor, a IA não inventa texto.',
    pending: 'A equipe pede a resposta. Sem chave no servidor, a IA não inventa texto.',
  },
  instagram: {
    unconfigured: 'O Instagram ainda não entra no atendimento. Os contatos continuam neste CRM.',
    pending: 'O Instagram ainda não entra no atendimento. Os contatos continuam neste CRM.',
  },
  google_calendar: {
    unconfigured: 'A agenda oficial é a deste painel. O Google Calendar ainda não sincroniza.',
    pending: 'A agenda oficial é a deste painel. O Google Calendar ainda não sincroniza.',
  },
}

function clock(value, fallback) {
  const text = String(value ?? fallback)
  return text.slice(0, 5)
}

export function SettingsPanel({ clinicName, role, settings, integrations = [], notice, onSaveProfile, onBindWhatsapp }) {
  const [displayName, setDisplayName] = useState(settings?.display_name || clinicName || '')
  const [dayStart, setDayStart] = useState(clock(settings?.day_start, '09:00'))
  const [dayEnd, setDayEnd] = useState(clock(settings?.day_end, '18:00'))
  const [slotMinutes, setSlotMinutes] = useState(String(settings?.slot_minutes ?? 30))
  const [faq, setFaq] = useState(settings?.business_faq ?? '')

  useEffect(() => {
    if (!settings) return
    setDisplayName(settings.display_name || clinicName || '')
    setDayStart(clock(settings.day_start, '09:00'))
    setDayEnd(clock(settings.day_end, '18:00'))
    setSlotMinutes(String(settings.slot_minutes ?? 30))
    setFaq(settings.business_faq ?? '')
  }, [settings, clinicName])
  const whatsapp = integrations.find((item) => item.provider === 'whatsapp')
  const others = integrations.filter((item) => item.provider !== 'whatsapp')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald uppercase">Automatize.app</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Ajustes da clínica</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-muted">
            O que a equipe usa no atendimento. As mudanças valem só para esta clínica.
          </p>
        </header>

        <form
          className="space-y-3 rounded-2xl border border-line bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSaveProfile?.({ displayName, dayStart, dayEnd, slotMinutes, businessFaq: faq })
          }}
        >
          <h2 className="text-[16px] font-semibold">Atendimento</h2>
          <label className="block text-[12px] font-semibold text-muted" htmlFor="clinic-display">
            Nome que a equipe vê
            <input id="clinic-display" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[12px] font-semibold text-muted" htmlFor="day-start">
              Abre
              <input id="day-start" type="time" value={dayStart} onChange={(event) => setDayStart(event.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
            </label>
            <label className="block text-[12px] font-semibold text-muted" htmlFor="day-end">
              Fecha
              <input id="day-end" type="time" value={dayEnd} onChange={(event) => setDayEnd(event.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
            </label>
            <label className="block text-[12px] font-semibold text-muted" htmlFor="slot">
              Duração da consulta
              <select id="slot" value={slotMinutes} onChange={(event) => setSlotMinutes(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink">
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </label>
          </div>
          <label className="block text-[12px] font-semibold text-muted" htmlFor="faq">
            O que a IA pode repetir
            <textarea id="faq" value={faq} onChange={(event) => setFaq(event.target.value)} rows={4} maxLength={4000} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-emerald px-4 text-[13px] font-semibold text-[#080F1C]">
            Gravar atendimento
          </button>
        </form>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold">WhatsApp</h2>
              <p className="mt-1 max-w-xl text-[13px] leading-5 text-muted">{COPY.whatsapp[whatsapp?.state] ?? COPY.whatsapp.unconfigured}</p>
            </div>
            <Link to="/app/whatsapp" className="inline-flex h-10 items-center rounded-lg border border-line px-3 text-[13px] font-semibold text-ink">
              Abrir conversas
            </Link>
          </div>
          {role === 'owner' ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                onBindWhatsapp?.({
                  phone: String(data.get('phone') ?? ''),
                  waba: String(data.get('waba') ?? ''),
                  app: String(data.get('app') ?? ''),
                })
              }}
            >
              <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-phone">
                Identificador da linha
                <input id="wa-phone" name="phone" required pattern="[0-9]{6,32}" inputMode="numeric" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
              </label>
              <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-waba">
                Conta comercial
                <input id="wa-waba" name="waba" required pattern="[0-9]{6,32}" inputMode="numeric" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
              </label>
              <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-app">
                Aplicativo
                <input id="wa-app" name="app" required pattern="[0-9]{6,32}" inputMode="numeric" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
              </label>
              <button type="submit" className="h-10 rounded-lg bg-emerald px-4 text-[13px] font-semibold text-[#080F1C]">
                Registrar linha nesta clínica
              </button>
            </form>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Quem administra a clínica registra a linha.</p>
          )}
        </section>

        <section className="rounded-2xl border border-line p-4">
          <h2 className="text-[16px] font-semibold">Próximos canais</h2>
          <ul className="mt-3 space-y-3">
            {others.map((item) => (
              <li key={item.provider}>
                <p className="text-[14px] font-semibold">{item.provider === 'grok' ? 'Grok' : item.provider === 'instagram' ? 'Instagram' : 'Google Calendar'}</p>
                <p className="text-[13px] leading-5 text-muted">{COPY[item.provider]?.[item.state] ?? COPY[item.provider]?.unconfigured}</p>
              </li>
            ))}
          </ul>
        </section>
        {notice && <p className="text-[13px] text-muted">{notice}</p>}
      </div>
    </div>
  )
}

export default function Settings() {
  const crm = useCrm()
  const auth = useAuth()

  async function onBindWhatsapp(fields) {
    if (!auth.client) {
      crm.announce('A sessão não está disponível para registrar a linha.')
      return
    }
    const { error } = await auth.client.rpc('bind_whatsapp_route', {
      p_phone: fields.phone,
      p_waba: fields.waba,
      p_app: fields.app,
    })
    crm.announce(error ? 'A linha não foi registrada.' : 'Linha registrada nesta clínica. O canal ainda não tem prova de entrega.')
  }

  return (
    <SettingsPanel
      clinicName={crm.clinic?.name}
      role={crm.role}
      settings={crm.settings}
      integrations={crm.integrations}
      notice={crm.notice}
      onSaveProfile={crm.saveClinicProfile}
      onBindWhatsapp={onBindWhatsapp}
    />
  )
}
