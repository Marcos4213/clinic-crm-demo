import { createClient } from 'npm:@supabase/supabase-js@2'
import { withSupabase } from 'npm:@supabase/server@1'
import { handleChannelRequest } from '../_shared/whatsapp-http.js'

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (request) => {
    const admin = adminClient()
    const rawBody = request.method === 'POST' ? await request.text() : ''
    const result = await handleChannelRequest({
      method: request.method,
      url: request.url,
      rawBody,
      signature: request.headers.get('X-Hub-Signature-256'),
      env: {
        WHATSAPP_APP_SECRET: Deno.env.get('WHATSAPP_APP_SECRET') ?? '',
        WHATSAPP_VERIFY_TOKEN: Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '',
      },
      ingest: admin
        ? async (event) => {
            await admin.rpc('ingest_whatsapp_event', {
              p_phone_number_id: event.phoneNumberId,
              p_provider_message_id: event.providerMessageId,
              p_kind: event.kind,
              p_message_type: event.type,
              p_body: event.text,
              p_status: event.status,
              p_wa_id: event.waId,
              p_error_code: event.errorCode ?? null,
            })
          }
        : undefined,
    })
    if (request.method === 'POST' && result.status === 200 && !admin) {
      return Response.json({ status: 'unconfigured', provider: 'whatsapp', error: 'webhook_unconfigured' }, { status: 503 })
    }
    if (result.text != null) {
      return new Response(result.text, {
        status: result.status,
        headers: { 'Content-Type': result.contentType || 'text/plain; charset=utf-8' },
      })
    }
    return Response.json(result.body ?? {}, { status: result.status })
  }),
}
