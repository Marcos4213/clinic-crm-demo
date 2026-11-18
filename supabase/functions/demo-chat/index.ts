import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import {
  GROK_RESPONSES_URL,
  IP_LIMIT,
  IP_WINDOW_SECONDS,
  SESSION_LIMIT,
  SESSION_WINDOW_SECONDS,
  assistantText,
  buildDemoResponsesRequest,
  clientIp,
  demoSystemPrompt,
  scrubModelReply,
  subjectKey,
  validateDemoRequest,
} from '../_shared/demo-chat-policy.js'

const ALLOWED_ORIGINS = new Set([
  'https://marcos4213.github.io',
  'https://c4.devbrasil.online',
  'https://automatize.devbrasil.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function originAllowed(origin: string) {
  if (ALLOWED_ORIGINS.has(origin)) return true
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
}

function withCors(request: Request, response: Response) {
  const origin = request.headers.get('Origin') ?? ''
  const headers = new Headers(response.headers)
  if (originAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Vary', 'Origin')
  }
  return new Response(response.body, { status: response.status, headers })
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function allowHit(admin: ReturnType<typeof adminClient>, scope: string, subject: string, windowSeconds: number, limit: number) {
  if (!admin) return false
  const { data, error } = await admin.rpc('demo_chat_hit', {
    p_scope: scope,
    p_subject: subject,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  })
  if (error) {
    console.error('demo_chat_quota', error.code ?? 'error')
    return false
  }
  return data === true
}

async function callGrok(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch(GROK_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) return { ok: false as const, status: response.status }
  const body = await response.json()
  return { ok: true as const, body }
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (request) => {
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed' }, 405))

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return withCors(request, json({ error: 'invalid_body' }, 400))
    }

    const validation = validateDemoRequest(payload)
    if (typeof validation === 'string') {
      const status = validation === 'turn_limit' ? 429 : 400
      return withCors(request, json({ error: validation }, status))
    }

    const admin = adminClient()
    if (!admin) return withCors(request, json({ error: 'unconfigured' }, 503))

    const ipKey = await subjectKey(`ip:${clientIp(request.headers)}`)
    const sessionKey = await subjectKey(`session:${(payload as { sessionId: string }).sessionId}`)
    const ipAllowed = await allowHit(admin, 'ip', ipKey, IP_WINDOW_SECONDS, IP_LIMIT)
    if (!ipAllowed) return withCors(request, json({ error: 'rate_limited' }, 429))
    const sessionAllowed = await allowHit(admin, 'session', sessionKey, SESSION_WINDOW_SECONDS, SESSION_LIMIT)
    if (!sessionAllowed) return withCors(request, json({ error: 'rate_limited' }, 429))

    const apiKey = Deno.env.get('XAI_API_KEY')
    if (!apiKey) return withCors(request, json({ error: 'unconfigured' }, 503))

    const instructions = demoSystemPrompt(validation)
    const result = await callGrok(apiKey, buildDemoResponsesRequest({
      instructions,
      messages: validation.messages,
    }))
    if (!result.ok) {
      console.error('demo_chat_upstream', result.status)
      return withCors(request, json({ error: 'upstream' }, 502))
    }

    const reply = scrubModelReply(assistantText(result.body))
    if (!reply) return withCors(request, json({ error: 'empty' }, 502))
    return withCors(request, json({ reply, source: 'ai' }, 200))
  }),
}
