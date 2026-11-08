import { useEffect, useState } from 'react'
import { useAuth } from '../state/useAuth'
import { useCrm } from '../state/useCrm'

const STATUS_LABEL = {
  received: 'Recebido',
  accepted: 'Aceito pela API',
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
  failed: 'Falhou',
  unsupported: 'Tipo não suportado',
}

const DAY_MS = 24 * 60 * 60 * 1000

export function WhatsAppPanel({ route, messages = [], role, canSend = false, notice, onBind, onSend }) {
  const [confirm, setConfirm] = useState(false)
  const [text, setText] = useState('')
  const [waId, setWaId] = useState('')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">Automatize.app</p>
        <h1 className="mt-2 text-[24px] font-semibold">WhatsApp</h1>
        <p className="mt-2 text-[13px] leading-5 text-muted">
          {route ? 'IDs salvos. Sem prova de entrega e sem envio automático.' : 'Não conectado'}
        </p>
        {role === 'owner' && (
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              onBind?.({
                phone: String(data.get('phone') ?? ''),
                waba: String(data.get('waba') ?? ''),
                app: String(data.get('app') ?? ''),
              })
            }}
          >
            <h2 className="text-[16px] font-semibold">Vincular número</h2>
            <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-phone">
              Phone number ID
              <input id="wa-phone" name="phone" required pattern="[0-9]{6,32}" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink" />
            </label>
            <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-waba">
              WABA ID
              <input id="wa-waba" name="waba" required pattern="[0-9]{6,32}" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink" />
            </label>
            <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-app">
              App ID
              <input id="wa-app" name="app" required pattern="[0-9]{6,32}" autoComplete="off" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink" />
            </label>
            <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C]">
              Salvar IDs nesta clínica
            </button>
          </form>
        )}
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line" aria-label="Mensagens do WhatsApp">
          {messages.length === 0 && <li className="px-3 py-3 text-[13px] text-muted">Nenhuma mensagem deste número.</li>}
          {messages.map((message) => (
            <li key={message.id} className="px-3 py-3">
              <p className="text-[14px]">{message.body || 'Sem texto'}</p>
              <p className="text-[12px] text-emerald">{STATUS_LABEL[message.status] ?? message.status}</p>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!confirm || !canSend) return
            onSend?.({ confirm: true, text, waId, idempotencyKey: crypto.randomUUID() })
          }}
        >
          <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-to">
            WhatsApp ID do contato
            <input id="wa-to" value={waId} onChange={(event) => setWaId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink" />
          </label>
          <label className="block text-[12px] font-semibold text-muted" htmlFor="wa-text">
            Texto
            <textarea id="wa-text" value={text} onChange={(event) => setText(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink" htmlFor="wa-confirm">
            <input id="wa-confirm" type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} />
            Confirmo o envio manual
          </label>
          <button type="submit" disabled={!canSend || !confirm} className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C] disabled:opacity-50">
            Enviar mensagem de teste
          </button>
        </form>
        {notice && <p className="mt-3 text-[13px] text-muted">{notice}</p>}
      </div>
    </div>
  )
}

export default function WhatsAppTest() {
  const auth = useAuth()
  const crm = useCrm()
  const [route, setRoute] = useState(null)
  const [messages, setMessages] = useState([])
  const [role, setRole] = useState('')
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [loadedAt, setLoadedAt] = useState(null)
  const [notice, setNotice] = useState('')
  const client = auth.client
  const userId = auth.session?.user?.id
  const clinicId = crm.clinic?.id

  useEffect(() => {
    if (!client || !clinicId || !userId) return undefined
    let cancel = false
    async function load() {
      const [routes, rows, membership, status] = await Promise.all([
        client.from('whatsapp_routes').select('id, phone_number_id').eq('clinic_id', clinicId).maybeSingle(),
        client.from('whatsapp_messages').select('id, body, status, direction, received_at, wa_id').eq('clinic_id', clinicId).order('received_at', { ascending: false }).limit(50),
        client.from('clinic_memberships').select('role').eq('clinic_id', clinicId).eq('user_id', userId).maybeSingle(),
        client.functions.invoke('whatsapp-send', { method: 'GET', headers: { 'x-clinic-id': clinicId } }),
      ])
      if (cancel) return
      setRoute(routes.data ?? null)
      setMessages(rows.data ?? [])
      setRole(membership.data?.role ?? '')
      setTokenConfigured(status.data?.tokenConfigured === true)
      setLoadedAt(Date.now())
    }
    load()
    return () => {
      cancel = true
    }
  }, [client, clinicId, userId])

  async function onBind(fields) {
    const { error } = await client.rpc('bind_whatsapp_route', {
      p_phone: fields.phone,
      p_waba: fields.waba,
      p_app: fields.app,
    })
    setNotice(error ? 'O número não foi vinculado.' : 'IDs salvos nesta clínica. O canal não está conectado.')
    if (!error) {
      const { data } = await client.from('whatsapp_routes').select('id, phone_number_id').eq('clinic_id', clinicId).maybeSingle()
      setRoute(data ?? null)
    }
  }

  async function onSend(payload) {
    const { data, error } = await client.functions.invoke('whatsapp-send', { body: { ...payload, clinicId } })
    if (error || data?.error) {
      setNotice(
        data?.error === 'template_required'
          ? 'Fora da janela de 24 horas. Nenhum template foi enviado.'
          : 'A mensagem não foi enviada.',
      )
      return
    }
    setNotice(data?.duplicate ? 'Este envio já estava registrado.' : 'Aceito pela API. Ainda sem prova de entrega.')
  }

  const lastInbound = messages.find((item) => item.direction === 'inbound' && item.status === 'received')
  const withinWindow = Boolean(loadedAt && lastInbound && loadedAt - Date.parse(lastInbound.received_at) <= DAY_MS)
  const canSend = Boolean(route && tokenConfigured && withinWindow)

  return <WhatsAppPanel route={route} messages={messages} role={role} canSend={canSend} notice={notice} onBind={onBind} onSend={onSend} />
}
