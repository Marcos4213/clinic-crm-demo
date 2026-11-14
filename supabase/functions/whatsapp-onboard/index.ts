import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import {
  beginSignup,
  clinicDiagnostics,
  describeAccessToken,
  interpretRegisterResponse,
  publicSignupConfig,
  readPhoneRegistration,
  readTokenExchange,
  selectDiscoveredNumber,
  shouldRegisterPhone,
  signupStatusAfterHooks,
  wabaIdsFromDebug,
} from './onboard.js'
import {
  GRAPH_STEPS,
  graphStepError,
  isExpiredSignupCode,
  logGraphFailure,
  publicUpstreamBody,
  readGraphError,
  readGraphStepError,
  readResponsePayload,
  tokenExchangeUrl,
  redirectUriCandidates,
  isRedirectMismatch,
} from './graph.js'

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

function graphVersion() {
  return Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
}

function signupConfig() {
  return publicSignupConfig({
    appId: Deno.env.get('WHATSAPP_APP_ID') ?? '',
    appSecret: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
    configId: Deno.env.get('EMBEDDED_SIGNUP_CONFIG_ID') ?? '',
    coexistence: Deno.env.get('WHATSAPP_COEXISTENCE') === 'true',
  })
}

function failGraph(step: string, response: Response, payload: unknown): never {
  const graphError = readGraphError(payload, response.status)
  const errorName = isExpiredSignupCode(graphError) ? 'token_expired' : 'upstream'
  logGraphFailure(step, graphError)
  throw graphStepError(step, graphError, errorName)
}

function upstreamResponse(request: Request, error: unknown, fallbackStep: string) {
  const stepped = readGraphStepError(error)
  if (stepped) {
    const name = stepped.errorName === 'token_expired' ? 'token_expired' : 'upstream'
    const status = name === 'token_expired' ? 401 : 502
    return withCors(request, json(publicUpstreamBody(stepped.step, stepped.graphError, name), status))
  }
  logGraphFailure(fallbackStep, readGraphError({}, 0))
  return withCors(request, json({ error: 'upstream', step: fallbackStep, connected: false }, 502))
}

async function exchangeCode(code: string, origin = '') {
  // Official Embedded Signup exchange is GET /oauth/access_token with client_id,
  // client_secret and code. If Meta answers 100/36008 (redirect_uri mismatch),
  // retry with the redirect_uri candidates the JS SDK may have bound the code to.
  let response: Response | null = null
  let payload: any = {}
  for (const redirectUri of redirectUriCandidates(ALLOWED_ORIGINS.has(origin) ? origin : '')) {
    const url = tokenExchangeUrl({
      graphVersion: graphVersion(),
      appId: Deno.env.get('WHATSAPP_APP_ID') ?? '',
      appSecret: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
      code,
      redirectUri,
    })
    response = await fetch(url, { method: 'GET' })
    payload = await readResponsePayload(response)
    if (response.ok || !isRedirectMismatch(payload)) {
      console.log(JSON.stringify({ source: 'whatsapp-onboard', step: 'exchange_code_attempt', redirectUri: redirectUri ?? null, ok: response.ok }))
      break
    }
    console.log(JSON.stringify({ source: 'whatsapp-onboard', step: 'exchange_code_attempt', redirectUri: redirectUri ?? null, ok: false, metaSubcode: 36008 }))
  }
  if (!response!.ok) failGraph(GRAPH_STEPS.exchange_code, response!, payload)
  const token = readTokenExchange(payload)
  if (!token) {
    const graphError = readGraphError(payload, response!.status)
    logGraphFailure(GRAPH_STEPS.exchange_code, graphError)
    throw graphStepError(GRAPH_STEPS.exchange_code, graphError, 'upstream')
  }
  return token
}

async function debugToken(accessToken: string) {
  const appId = Deno.env.get('WHATSAPP_APP_ID') ?? ''
  const secret = Deno.env.get('WHATSAPP_APP_SECRET') ?? ''
  const debugUrl = new URL(`https://graph.facebook.com/${graphVersion()}/debug_token`)
  debugUrl.searchParams.set('input_token', accessToken)
  const debugResponse = await fetch(debugUrl, { headers: { Authorization: `Bearer ${appId}|${secret}` } })
  const debug = await readResponsePayload(debugResponse)
  if (!debugResponse.ok) failGraph(GRAPH_STEPS.debug_token, debugResponse, debug)
  return debug
}

// Embedded Signup business integration system user tokens are long-lived.
// Only short-lived USER tokens are exchanged (fb_exchange_token). Expiry is stored when debug_token reports one.
async function exchangeLongLived(shortToken: string) {
  const body = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: Deno.env.get('WHATSAPP_APP_ID') ?? '',
    client_secret: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
    fb_exchange_token: shortToken,
  })
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = await readResponsePayload(response)
  if (!response.ok) {
    logGraphFailure('exchange_long_lived', readGraphError(payload, response.status))
    return null
  }
  return readTokenExchange(payload)
}

async function graphGet(path: string, accessToken: string, step = GRAPH_STEPS.discover) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = await readResponsePayload(response)
  if (!response.ok) failGraph(step, response, payload)
  return payload
}

async function discoverNumber(accessToken: string, preferredPhone: string, preferredWaba: string) {
  const debug = await debugToken(accessToken)
  const wabaIds = wabaIdsFromDebug(debug)
  if (preferredWaba && !wabaIds.includes(preferredWaba)) wabaIds.unshift(preferredWaba)
  const phonesByWaba: Record<string, { id?: string }[]> = {}
  for (const wabaId of wabaIds) {
    try {
      const payload = await graphGet(`${wabaId}/phone_numbers?fields=id`, accessToken, GRAPH_STEPS.discover)
      phonesByWaba[wabaId] = Array.isArray(payload.data) ? payload.data : []
    } catch (error) {
      const stepped = readGraphStepError(error)
      if (stepped) logGraphFailure(GRAPH_STEPS.discover, stepped.graphError)
      phonesByWaba[wabaId] = []
    }
  }
  return selectDiscoveredNumber({ debug, phonesByWaba, preferredPhone, preferredWaba })
}

async function subscribeApp(wabaId: string, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = await readResponsePayload(response)
  if (!response.ok) failGraph(GRAPH_STEPS.subscribe, response, payload)
}

async function registerPhone(phoneNumberId: string, accessToken: string, pin: string) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${phoneNumberId}/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
  })
  const payload = await readResponsePayload(response)
  if (!response.ok) logGraphFailure(GRAPH_STEPS.register, readGraphError(payload, response.status))
  return { ok: response.ok, errorCode: payload?.error?.code }
}

function storeArgs({
  clinicId,
  uid,
  phoneNumberId,
  wabaId,
  config,
  accessToken,
  described,
  subscribedOk,
  phoneRegistered,
  status,
}: {
  clinicId: string
  uid: string
  phoneNumberId: string
  wabaId: string
  config: { appId?: string }
  accessToken: string
  described: { expiresAt: string | null; type: string }
  subscribedOk: boolean
  phoneRegistered: boolean
  status: { state: string; detail: string }
}) {
  return {
    p_clinic: clinicId,
    p_user: uid,
    p_phone: phoneNumberId,
    p_waba: wabaId,
    p_app: config.appId,
    p_token: accessToken,
    p_token_expires_at: described.expiresAt,
    p_token_type: described.type,
    p_subscribed_apps_ok: subscribedOk,
    p_phone_registered: phoneRegistered,
    p_detail: status.detail,
    p_state: status.state,
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
    const config = signupConfig()
    if (request.method === 'GET') {
      const clinicId = (request.headers.get('x-clinic-id') ?? new URL(request.url).searchParams.get('clinicId') ?? '').trim()
      if (!clinicId) return withCors(request, json(config, 200))
      const uid = userId(request)
      const { data: membership, error: membershipError } = await ctx.supabase
        .from('clinic_memberships')
        .select('role')
        .eq('clinic_id', clinicId)
        .eq('user_id', uid)
        .maybeSingle()
      if (membershipError) return withCors(request, json({ ...config, error: 'persist_failed' }, 503))
      if (!membership) return withCors(request, json({ ...config, error: 'forbidden' }, 403))
      const admin = serviceClient()
      if (!admin) return withCors(request, json({ ...config, error: 'persist_failed' }, 503))
      const { data, error } = await admin.rpc('whatsapp_clinic_diagnostics', { p_clinic: clinicId })
      if (error) return withCors(request, json({ ...config, error: 'persist_failed' }, 503))
      const row = data ?? {}
      return withCors(
        request,
        json(
          {
            ...config,
            diagnostics: clinicDiagnostics({
              route: row.route_present ? { phoneNumberId: '1' } : null,
              lastInboundAt: row.last_inbound_at ?? null,
              subscribedAppsOk: row.subscribed_apps_ok === true,
              hasToken: row.token_present === true,
              graphVersion: graphVersion(),
              state: row.state,
            }),
          },
          200,
        ),
      )
    }
    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed', connected: false }, 405))
    if (!config.configured) return withCors(request, json({ error: 'signup_unconfigured', connected: false }, 503))

    let body: { clinicId?: string; code?: string; phoneNumberId?: string; wabaId?: string; event?: string; pin?: string } = {}
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
      token = await exchangeCode(String(body.code), request.headers.get('Origin') ?? '')
    } catch (error) {
      return upstreamResponse(request, error, GRAPH_STEPS.exchange_code)
    }
    if (!token) return withCors(request, json({ error: 'upstream', step: GRAPH_STEPS.exchange_code, connected: false }, 502))

    let accessToken = token.accessToken
    let described = describeAccessToken({})
    try {
      described = describeAccessToken(await debugToken(accessToken))
      if (described.shouldExchange) {
        const exchanged = await exchangeLongLived(accessToken)
        if (exchanged?.accessToken) {
          accessToken = exchanged.accessToken
          described = describeAccessToken(await debugToken(accessToken))
        }
      }
    } catch {
      described = describeAccessToken({})
    }

    let phoneNumberId = String(body.phoneNumberId ?? '')
    let wabaId = String(body.wabaId ?? '')
    if (decision.needsDiscovery) {
      try {
        const found = await discoverNumber(accessToken, phoneNumberId, wabaId)
        if (!found.ok) return withCors(request, json({ error: found.error, connected: false }, 409))
        phoneNumberId = found.phoneNumberId
        wabaId = found.wabaId
      } catch (error) {
        return upstreamResponse(request, error, GRAPH_STEPS.discover)
      }
    }

    const admin = serviceClient()
    if (!admin) return withCors(request, json({ error: 'persist_failed', connected: false }, 503))
    const initial = { state: 'pending', detail: 'Cadastro Meta recebido. Concluindo a inscrição do webhook.' }
    const stored = await admin.rpc(
      'store_whatsapp_signup',
      storeArgs({
        clinicId,
        uid,
        phoneNumberId,
        wabaId,
        config,
        accessToken,
        described,
        subscribedOk: false,
        phoneRegistered: false,
        status: initial,
      }),
    )
    if (stored.error) return withCors(request, json({ error: 'persist_failed', connected: false }, 503))

    let subscribedOk = false
    try {
      await subscribeApp(wabaId, accessToken)
      subscribedOk = true
    } catch (error) {
      const stepped = readGraphStepError(error)
      if (stepped) logGraphFailure(GRAPH_STEPS.subscribe, stepped.graphError)
      subscribedOk = false
    }

    const coexistence = config.coexistence === true || body.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
    let alreadyRegistered = false
    try {
      const phoneInfo = await graphGet(`${phoneNumberId}?fields=id,code_verification_status,platform_type`, accessToken)
      alreadyRegistered = readPhoneRegistration(phoneInfo)
    } catch {
      alreadyRegistered = false
    }
    const pin = typeof body.pin === 'string' ? body.pin : ''
    const plan = shouldRegisterPhone({ coexistence, alreadyRegistered, pin })
    let registerResult: 'ok' | 'needs_pin' | 'failed' = 'ok'
    if (plan.action === 'needs_pin') registerResult = 'needs_pin'
    else if (plan.action === 'register') {
      try {
        const outcome = interpretRegisterResponse(await registerPhone(phoneNumberId, accessToken, pin))
        registerResult = outcome.ok ? 'ok' : 'failed'
      } catch {
        registerResult = 'failed'
      }
    }

    const { data: current } = await admin
      .from('integration_status')
      .select('state')
      .eq('clinic_id', clinicId)
      .eq('provider', 'whatsapp')
      .maybeSingle()
    const status = signupStatusAfterHooks({
      stored: true,
      subscribedOk,
      registerResult,
      currentState: current?.state,
    })
    const phoneRegistered = registerResult === 'ok' && plan.action !== 'needs_pin'
    await admin.rpc(
      'store_whatsapp_signup',
      storeArgs({
        clinicId,
        uid,
        phoneNumberId,
        wabaId,
        config,
        accessToken,
        described,
        subscribedOk,
        phoneRegistered,
        status,
      }),
    )

    if (!subscribedOk) {
      return withCors(
        request,
        json({ error: 'webhook_subscribe_failed', step: GRAPH_STEPS.subscribe, connected: false, stored: true, state: status.state }, 502),
      )
    }
    return withCors(
      request,
      json(
        {
          connected: status.state === 'connected',
          stored: true,
          state: status.state,
          tokenLongLived: described.longLived === true,
          subscribedAppsOk: subscribedOk,
          phoneRegistered,
        },
        200,
      ),
    )
  }),
}
