import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import { beginSignup, publicSignupConfig, readTokenExchange, selectDiscoveredNumber, wabaIdsFromDebug } from './onboard.js'

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

function userId(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '')
  const part = token.split('.')[1]
  if (!part) return ''
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.sub === 'string' ? payload.sub : ''
  } catch {
    return ''
  }
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function exchangeCode(code: string) {
  const version = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
  const body = new URLSearchParams({
    client_id: Deno.env.get('WHATSAPP_APP_ID') ?? '',
    client_secret: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
    code,
  })
  const response = await fetch(`https://graph.facebook.com/${version}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error('graph') as Error & { code?: string }
    error.code = payload?.error?.code === 190 ? 'token_expired' : 'upstream'
    throw error
  }
  return readTokenExchange(payload)
}

async function graphGet(path: string, accessToken: string) {
  const version = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
  const response = await fetch(`https://graph.facebook.com/${version}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error('graph') as Error & { code?: string }
    error.code = 'upstream'
    throw error
  }
  return payload
}

async function discoverNumber(accessToken: string, preferredPhone: string, preferredWaba: string) {
  const version = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
  const appId = Deno.env.get('WHATSAPP_APP_ID') ?? ''
  const secret = Deno.env.get('WHATSAPP_APP_SECRET') ?? ''
  const debugUrl = new URL(`https://graph.facebook.com/${version}/debug_token`)
  debugUrl.searchParams.set('input_token', accessToken)
  const debugResponse = await fetch(debugUrl, { headers: { Authorization: `Bearer ${appId}|${secret}` } })
  const debug = await debugResponse.json().catch(() => ({}))
  if (!debugResponse.ok) {
    const error = new Error('graph') as Error & { code?: string }
    error.code = 'upstream'
    throw error
  }
  const wabaIds = wabaIdsFromDebug(debug)
  if (preferredWaba && !wabaIds.includes(preferredWaba)) wabaIds.unshift(preferredWaba)
  const phonesByWaba: Record<string, { id?: string }[]> = {}
  for (const wabaId of wabaIds) {
    try {
      const payload = await graphGet(`${wabaId}/phone_numbers?fields=id`, accessToken)
      phonesByWaba[wabaId] = Array.isArray(payload.data) ? payload.data : []
    } catch {
      phonesByWaba[wabaId] = []
    }
  }
  return selectDiscoveredNumber({ debug, phonesByWaba, preferredPhone, preferredWaba })
}

async function subscribeApp(wabaId: string, accessToken: string) {
  const version = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
  const response = await fetch(`https://graph.facebook.com/${version}/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const error = new Error('graph') as Error & { code?: string }
    error.code = 'upstream'
    throw error
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
    const config = publicSignupConfig({
      appId: Deno.env.get('WHATSAPP_APP_ID') ?? '',
      appSecret: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
      configId: Deno.env.get('EMBEDDED_SIGNUP_CONFIG_ID') ?? '',
      coexistence: Deno.env.get('WHATSAPP_COEXISTENCE') === 'true',
    })
    if (request.method === 'GET') return withCors(request, json(config, 200))
    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed', connected: false }, 405))
    if (!config.configured) return withCors(request, json({ error: 'signup_unconfigured', connected: false }, 503))

    let body: { clinicId?: string; code?: string; phoneNumberId?: string; wabaId?: string; event?: string } = {}
    try {
      body = await request.json()
    } catch {
      return withCors(request, json({ error: 'invalid_body', connected: false }, 400))
    }
    const headerClinic = request.headers.get('x-clinic-id') ?? ''
    const bodyClinic = String(body.clinicId ?? '')
    if (headerClinic && bodyClinic && headerClinic.toLowerCase() !== bodyClinic.toLowerCase()) {
      return withCors(request, json({ error: 'forbidden', connected: false }, 403))
    }
    const clinicId = bodyClinic || headerClinic
    const uid = userId(request)
    const { data: membership, error: membershipError } = await ctx.supabase
      .from('clinic_memberships')
      .select('role')
      .eq('clinic_id', clinicId)
      .eq('user_id', uid)
      .maybeSingle()
    if (membershipError) return withCors(request, json({ error: 'persist_failed', connected: false }, 503))
    const decision = beginSignup({
      role: membership?.role,
      code: body.code,
      phoneNumberId: body.phoneNumberId,
      wabaId: body.wabaId,
      event: body.event,
    })
    if (!decision.ok) return withCors(request, json({ error: decision.error, connected: false }, decision.status))

    let token
    try {
      token = await exchangeCode(String(body.code))
    } catch (error) {
      const code = (error as { code?: string })?.code === 'token_expired' ? 'token_expired' : 'upstream'
      const status = code === 'token_expired' ? 401 : 502
      return withCors(request, json({ error: code, connected: false }, status))
    }
    if (!token) return withCors(request, json({ error: 'upstream', connected: false }, 502))

    let phoneNumberId = String(body.phoneNumberId ?? '')
    let wabaId = String(body.wabaId ?? '')
    if (decision.needsDiscovery) {
      try {
        const found = await discoverNumber(token.accessToken, phoneNumberId, wabaId)
        if (!found.ok) return withCors(request, json({ error: found.error, connected: false }, 409))
        phoneNumberId = found.phoneNumberId
        wabaId = found.wabaId
      } catch {
        return withCors(request, json({ error: 'upstream', connected: false }, 502))
      }
    }

    const admin = serviceClient()
    if (!admin) return withCors(request, json({ error: 'persist_failed', connected: false }, 503))
    const stored = await admin.rpc('store_whatsapp_signup', {
      p_clinic: clinicId,
      p_user: uid,
      p_phone: phoneNumberId,
      p_waba: wabaId,
      p_app: config.appId,
      p_token: token.accessToken,
    })
    if (stored.error) return withCors(request, json({ error: 'persist_failed', connected: false }, 503))

    try {
      await subscribeApp(wabaId, token.accessToken)
    } catch {
      return withCors(request, json({ error: 'webhook_subscribe_failed', connected: false, stored: true }, 502))
    }
    return withCors(request, json({ connected: false, stored: true, state: 'pending' }, 200))
  }),
}
