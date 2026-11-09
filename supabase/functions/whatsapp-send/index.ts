import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import { rpcPersisted } from '../_shared/whatsapp-http.js'
import { beginManualSend, handleStatus, routeQueryResult } from './send-handler.js'

const ALLOWED_ORIGINS = new Set([
  'https://marcos4213.github.io',
  'https://automatize.devbrasil.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function withCors(request: Request, response: Response) {
  const origin = request.headers.get('Origin') ?? ''
  const headers = new Headers(response.headers)
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-clinic-id')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Vary', 'Origin')
  }
  return new Response(response.body, { status: response.status, headers })
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
    const supabase = ctx.supabase
    const { data: routeRows, error: routeError } = await supabase.from('whatsapp_routes').select('clinic_id, phone_number_id')
    const headerClinic = request.headers.get('x-clinic-id') ?? ''
    let bodyClinic = ''
    let body: { confirm?: boolean; idempotencyKey?: string; waId?: string; text?: string; clinicId?: string } = {}
    if (request.method === 'POST') {
      try {
        body = await request.json()
      } catch {
        return withCors(request, json({ error: 'invalid_body', connected: false }, 400))
      }
      bodyClinic = String(body.clinicId ?? '')
    }
    if (headerClinic && bodyClinic && headerClinic.toLowerCase() !== bodyClinic.toLowerCase()) {
      return withCors(request, json({ error: 'forbidden', connected: false }, 403))
    }
    const clinicId = bodyClinic || headerClinic
    const selection = routeQueryResult(
      {
        error: routeError,
        data: (routeRows ?? []).map((row) => ({ clinicId: row.clinic_id, phoneNumberId: row.phone_number_id })),
      },
      clinicId,
    )
    if (!selection.ok) return withCors(request, json({ error: selection.error, connected: false, canSend: false }, selection.status))
    const route = selection.route
    const envToken = Deno.env.get('WHATSAPP_BUSINESS_ACCESS_TOKEN') ?? ''
    let token = envToken
    const tokenAdmin = serviceClient()
    if (tokenAdmin) {
      const stored = await tokenAdmin.rpc('whatsapp_clinic_token', { p_clinic: route.clinicId })
      if (!stored.error && typeof stored.data === 'string' && stored.data.length >= 20 && stored.data.length <= 4096) {
        token = stored.data
      }
    }

    if (request.method === 'GET') {
      const { data: inbound } = await supabase
        .from('whatsapp_messages')
        .select('received_at')
        .eq('clinic_id', route.clinicId)
        .eq('direction', 'inbound')
        .eq('message_type', 'text')
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return withCors(
        request,
        json(
          {
            ...handleStatus({
              route: { phoneNumberId: route.phoneNumberId },
              token,
              lastInboundAt: inbound?.received_at,
              now: Date.now(),
            }),
            clinicId: route.clinicId,
          },
          200,
        ),
      )
    }

    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed', connected: false }, 405))

    const idempotencyKey = String(body.idempotencyKey ?? '')
    const waId = String(body.waId ?? '')
    const text = String(body.text ?? '').slice(0, 4096)
    const { data: existing } = idempotencyKey
      ? await supabase
          .from('whatsapp_messages')
          .select('provider_message_id, status')
          .eq('clinic_id', route.clinicId)
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()
      : { data: null }
    const { data: inbound } = waId
      ? await supabase
          .from('whatsapp_messages')
          .select('received_at')
          .eq('clinic_id', route.clinicId)
          .eq('direction', 'inbound')
          .eq('message_type', 'text')
          .eq('wa_id', waId)
          .order('received_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    const decision = await beginManualSend({
      routes: [route],
      clinicId: route.clinicId,
      confirm: body.confirm === true,
      idempotencyKey,
      existing: existing?.provider_message_id
        ? { providerMessageId: existing.provider_message_id, status: existing.status }
        : null,
      lastInboundAt: inbound?.received_at,
      now: Date.now(),
      token,
      transport: async ({ phoneNumberId }) => {
        const version = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
        const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: waId,
            type: 'text',
            text: { body: text },
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          const error = new Error('graph') as Error & { code?: string }
          error.code = payload?.error?.code === 190 ? 'token_expired' : 'upstream'
          throw error
        }
        const id = payload?.messages?.[0]?.id
        if (!id) {
          const error = new Error('graph') as Error & { code?: string }
          error.code = 'upstream'
          throw error
        }
        return { id }
      },
    })

    if (decision.status === 200 && decision.body.providerMessageId && decision.body.duplicate !== true) {
      const admin = serviceClient()
      if (!admin) return withCors(request, json({ error: 'persist_failed', status: 'retry', connected: false }, 503))
      const recorded = rpcPersisted(
        await admin.rpc('record_whatsapp_outbound', {
          p_phone_number_id: route.phoneNumberId,
          p_idempotency_key: idempotencyKey,
          p_wa_id: waId,
          p_body: text,
          p_provider_message_id: decision.body.providerMessageId,
          p_status: 'accepted',
          p_error_code: null,
        }),
      )
      if (!recorded.ok) {
        return withCors(
          request,
          json(
            {
              status: 'accepted',
              providerMessageId: decision.body.providerMessageId,
              delivered: false,
              connected: false,
            },
            200,
          ),
        )
      }
    }

    return withCors(request, json({ ...decision.body, connected: false }, decision.status))
  }),
}
