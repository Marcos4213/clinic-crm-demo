import { withSupabase } from 'npm:@supabase/server@1'
import { verifyHubSignature } from '../_shared/webhook.js'

// verify_jwt is false. Meta does not send a Supabase user JWT.
// sb_publishable / sb_secret keys are not the webhook credential and are not JWTs.
// The raw body must match X-Hub-Signature-256 (HMAC-SHA256, prefix sha256=).
// A valid signature still does not send a message or write a tenant row until a
// provider account is mapped. That mapping is intentionally absent.

export default {
  fetch: withSupabase({ auth: 'none' }, async (request) => {
    if (request.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405 })
    }
    const secret = Deno.env.get('WHATSAPP_APP_SECRET')
    if (!secret) {
      return Response.json(
        { status: 'unconfigured', provider: 'whatsapp', error: 'webhook_unconfigured' },
        { status: 503 },
      )
    }
    const rawBody = await request.text()
    const verdict = await verifyHubSignature(rawBody, request.headers.get('X-Hub-Signature-256'), secret)
    if (!verdict.ok) {
      console.error('webhook_signature', verdict.reason)
      return Response.json({ error: 'bad_signature' }, { status: 401 })
    }
    return Response.json(
      {
        status: 'pending',
        provider: 'whatsapp',
        detail: 'Assinatura válida. Não há conta do provedor mapeada e nenhuma mensagem foi enviada.',
      },
      { status: 202 },
    )
  }),
}
