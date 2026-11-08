# Automatize.app Edge Functions

No secrets are in this tree. Do not add `XAI_API_KEY`, `service_role`, or `WHATSAPP_APP_SECRET` to these files.

Model id `grok-4.7` was checked against https://docs.x.ai/docs/models on 2026-11-08. That page lists `grok-4.7` and recommends it for chat. The call is `POST https://api.x.ai/v1/responses`. If `XAI_API_KEY` is absent, `grok-reply` returns HTTP 503 `{ "status": "unconfigured", "provider": "grok", "error": "grok_unconfigured" }` and does not invent a reply.

## Files

| Path | Role |
| --- | --- |
| `supabase/config.toml` | `verify_jwt` per function |
| `supabase/functions/grok-reply/index.ts` | Deploy entrypoint `grok-reply` |
| `supabase/functions/channel-webhook/index.ts` | Deploy entrypoint `channel-webhook` |
| `supabase/functions/whatsapp-send/index.ts` | Deploy entrypoint `whatsapp-send` |
| `supabase/functions/_shared/ai-policy.js` | Imported by `grok-reply` |
| `supabase/functions/_shared/schedule.js` | Imported by `grok-reply` |
| `supabase/functions/_shared/webhook.js` | Imported by `channel-webhook` |
| `supabase/functions/_shared/whatsapp-policy.js` | Imported by the WhatsApp handlers |
| `supabase/functions/_shared/whatsapp-http.js` | Imported by `channel-webhook` |

`grok-reply/index.ts` also imports `npm:@supabase/server@1`.
`channel-webhook/index.ts` also imports `npm:@supabase/server@1`.

## Config

```toml
[functions.grok-reply]
verify_jwt = true

[functions.channel-webhook]
verify_jwt = false

[functions.whatsapp-send]
verify_jwt = true
```

`verify_jwt = true` checks the user access token in `Authorization: Bearer <jwt>`. The publishable key is not a JWT. Send it only as `apikey`. `supabase-js` `functions.invoke` does this when a session exists.

`channel-webhook` uses `auth: 'none'` because Meta does not send a Supabase JWT. Without `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` it returns 503 `webhook_unconfigured`. A valid `X-Hub-Signature-256` stores the event only when `phone_number_id` is already bound. `whatsapp-send` uses the signed-in member and never reports `connected: true`.

## Deploy

From the repository root, after the SQL migration is on project `xjijlccnbrdpwctiacqa`:

```bash
supabase functions deploy grok-reply --project-ref xjijlccnbrdpwctiacqa
supabase functions deploy channel-webhook --project-ref xjijlccnbrdpwctiacqa
supabase functions deploy whatsapp-send --project-ref xjijlccnbrdpwctiacqa
```

The WhatsApp callback, after the GET challenge answers, is `https://xjijlccnbrdpwctiacqa.supabase.co/functions/v1/channel-webhook`. `whatsapp-send` is the authenticated manual sender and is not the Meta callback. Server secrets stay in the Supabase function secret store: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_BUSINESS_ACCESS_TOKEN`, and optional `WHATSAPP_GRAPH_VERSION` (default `v27.0`). The owner binds the phone number, WABA, and app id in `#/app/whatsapp`; the form does not take a clinic id.

Set `XAI_API_KEY` only as a function secret. Leave it unset until a real key exists. Do not put it in the Pages build.
