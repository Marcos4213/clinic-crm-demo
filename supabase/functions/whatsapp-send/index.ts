import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import { handleSend, handleStatus } from './send-handler.js'

const ALLOWED_ORIGINS = new Set([
  'https://marcos4213.github.io',
  'https://convertize.devbrasil.online',
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
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info')
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
    const { data: route } = await supabase.from('whatsapp_routes').select('phone_number_id').limit(1).maybeSingle()
    const token = Deno.env.get('WHATSAPP_BUSINESS_ACCESS_TOKEN') ?? ''

    if (request.method === 'GET') {
      const { data: inbound } = await supabase
        .from('whatsapp_messages')
        .select('received_at')
        .eq('direction', 'inbound')
        .eq('message_type', 'text')
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return withCors(
        request,
        json(
          handleStatus({
            route: route ? { phoneNumberId: route.phone_number_id } : null,
            token,
            lastInboundAt: inbound?.received_at,
            now: Date.now(),
          }),
          200,
        ),
      )
    }

    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed' }, 405))

    let body: { confirm?: boolean; idempotencyKey?: string; waId?: string; text?: string }
    try {
      body = await request.json()
    } catch {
      return withCors(request, json({ error: 'invalid_body' }, 400))
    }

    const idempotencyKey = String(body.idempotencyKey ?? '')
    const waId = String(body.waId ?? '')
    const text = String(body.text ?? '').slice(0, 4096)
    const { data: existing } = idempotencyKey
      ? await supabase.from('whatsapp_messages').select('provider_message_id, status').eq('idempotency_key', idempotencyKey).maybeSingle()
      : { data: null }
    const { data: inbound } = waId
      ? await supabase
          .from('whatsapp_messages')
          .select('received_at')
          .eq('direction', 'inbound')
          .eq('message_type', 'text')
          .eq('wa_id', waId)
          .order('received_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    const decision = await handleSend({
      confirm: body.confirm === true,
      idempotencyKey,
      existing: existing?.provider_message_id
        ? { providerMessageId: existing.provider_message_id, status: existing.status }
        : null,
      lastInboundAt: inbound?.received_at,
      now: Date.now(),
      member: true,
      route: route ? { phoneNumberId: route.phone_number_id } : null,
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

    if (decision.status === 200 && decision.body.providerMessageId && decision.body.duplicate !== true && route) {
      const admin = serviceClient()
      if (!admin) return withCors(request, json({ error: 'webhook_unconfigured', status: 'unconfigured' }, 503))
      await admin.rpc('record_whatsapp_outbound', {
        p_phone_number_id: route.phone_number_id,
        p_idempotency_key: idempotencyKey,
        p_wa_id: waId,
        p_body: text,
        p_provider_message_id: decision.body.providerMessageId,
        p_status: 'accepted',
        p_error_code: null,
      })
    }

    return withCors(request, json({ ...decision.body, connected: false }, decision.status))
  }),
}
