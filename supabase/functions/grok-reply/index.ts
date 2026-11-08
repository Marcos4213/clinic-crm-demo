import { withSupabase } from 'npm:@supabase/server@1'
import {
  allowCreateAppointment,
  assistantText,
  buildResponsesRequest,
  functionCalls,
  GROK_RESPONSES_URL,
  humanTakeoverBody,
  MAX_TOOL_ROUNDS,
  systemInstructions,
  unconfiguredGrokBody,
  upstreamErrorBody,
  validateReplyRequest,
} from '../_shared/ai-policy.js'
import { openSlots } from '../_shared/schedule.js'

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
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Vary', 'Origin')
  }
  return new Response(response.body, { status: response.status, headers })
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
  if (!response.ok) {
    return { ok: false as const, status: response.status }
  }
  const body = await response.json()
  return { ok: true as const, body }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
    if (request.method !== 'POST') return withCors(request, json({ error: 'method_not_allowed' }, 405))

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return withCors(request, json({ error: 'invalid_body' }, 400))
    }
    const validation = validateReplyRequest(payload)
    if (validation) return withCors(request, json({ error: validation }, 400))
    const body = payload as { clinicId: string; leadId: string; message: string }

    const apiKey = Deno.env.get('XAI_API_KEY')
    if (!apiKey) {
      return withCors(request, json(unconfiguredGrokBody(), 503))
    }

    const supabase = ctx.supabase
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, clinic_id, name, ai_active, procedure_name')
      .eq('id', body.leadId)
      .eq('clinic_id', body.clinicId)
      .maybeSingle()
    if (leadError) return withCors(request, json({ error: 'lead_read_failed' }, 400))
    if (!lead) return withCors(request, json({ error: 'lead_not_found' }, 404))
    if (!lead.ai_active) return withCors(request, json(humanTakeoverBody(), 409))

    const { error: quotaError } = await supabase.rpc('consume_ai_quota', { target_clinic: body.clinicId })
    if (quotaError) return withCors(request, json({ error: 'ai_quota', status: 'limited' }, 429))

    const { data: stillActive } = await supabase.rpc('assert_ai_active', {
      target_clinic: body.clinicId,
      target_lead: body.leadId,
    })
    if (stillActive !== true) return withCors(request, json(humanTakeoverBody(), 409))

    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('display_name, business_faq, slot_minutes, day_start, day_end')
      .eq('clinic_id', body.clinicId)
      .maybeSingle()

    const instructions = systemInstructions({
      clinicName: settings?.display_name ?? '',
      faq: settings?.business_faq ?? '',
    })
    const customerMessage = body.message.trim()
    let requestBody = buildResponsesRequest({
      instructions,
      customerMessage,
    })
    let finalText = ''

    for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round += 1) {
      const result = await callGrok(apiKey, requestBody)
      if (!result.ok) {
        console.error('grok_upstream', result.status)
        return withCors(request, json(upstreamErrorBody(result.status), 502))
      }
      const calls = functionCalls(result.body).slice(0, 1)
      finalText = assistantText(result.body)
      if (calls.length === 0 || round === MAX_TOOL_ROUNDS) break

      const call = calls[0]
      let toolOutput: unknown
      if (call.name === 'list_open_slots') {
        const date = String(call.arguments.date ?? '')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          toolOutput = { error: 'invalid_date' }
        } else {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, starts_at, ends_at, status')
            .eq('clinic_id', body.clinicId)
            .eq('status', 'scheduled')
          const slots = openSlots({
            date,
            dayStart: String(settings?.day_start ?? '09:00').slice(0, 5),
            dayEnd: String(settings?.day_end ?? '18:00').slice(0, 5),
            slotMinutes: settings?.slot_minutes ?? 30,
            appointments: appointments ?? [],
          }).slice(0, 8)
          const { data: stored, error: offerError } = await supabase.rpc('replace_slot_offers', {
            target_clinic: body.clinicId,
            target_lead: body.leadId,
            slots,
          })
          toolOutput = offerError ? { error: 'offer_failed' } : { slots: stored ?? [] }
        }
      } else if (call.name === 'create_appointment') {
        const offerId = String(call.arguments.offer_id ?? '')
        const confirmed = call.arguments.customer_confirmed === true
        if (!allowCreateAppointment({ offerId, customerConfirmed: confirmed, customerMessage })) {
          toolOutput = { error: 'confirmation_required' }
        } else {
          const { data: appointmentId, error: createError } = await supabase.rpc('create_appointment_from_offer', {
            target_offer: offerId,
          })
          toolOutput = createError ? { error: 'not_created' } : { appointment_id: appointmentId }
        }
      } else {
        toolOutput = { error: 'unknown_tool' }
      }

      requestBody = buildResponsesRequest({
        instructions,
        customerMessage,
        previousResponseId: result.body.id,
      })
      requestBody.input = [
        {
          type: 'function_call_output',
          call_id: call.callId,
          output: JSON.stringify(toolOutput),
        },
      ]
    }

    if (!finalText) return withCors(request, json({ error: 'empty_model_output', status: 'error' }, 502))

    const { data: savedId, error: saveError } = await supabase.rpc('append_ai_message', {
      target_clinic: body.clinicId,
      target_lead: body.leadId,
      message_body: finalText,
    })
    if (saveError) return withCors(request, json({ error: 'message_not_saved' }, 400))
    if (!savedId) return withCors(request, json(humanTakeoverBody(), 409))

    return withCors(request, json({ status: 'saved', messageId: savedId, delivery: 'local', channel: 'internal' }, 200))
  }),
}
