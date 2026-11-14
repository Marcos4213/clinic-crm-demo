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

`channel-webhook` uses `auth: 'none'` because Meta does not send a Supabase JWT. Without `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` it returns 503 `webhook_unconfigured`. A valid `X-Hub-Signature-256` stores the event only when `phone_number_id` is already bound. If that write fails, the response is 503 `persist_failed` and the body is not logged. `whatsapp-send` requires the clinic id of a route the signed-in member can already see (`clinicId` or `x-clinic-id`). More than one visible route without that id returns 409. Any other clinic id returns 403. It never reports `connected: true`.

## Deploy

From the repository root, after the SQL migration is on project `xjijlccnbrdpwctiacqa`:

```bash
supabase functions deploy grok-reply --project-ref xjijlccnbrdpwctiacqa
supabase functions deploy channel-webhook --project-ref xjijlccnbrdpwctiacqa
supabase functions deploy whatsapp-send --project-ref xjijlccnbrdpwctiacqa
```

The WhatsApp callback, after the GET challenge answers, is `https://xjijlccnbrdpwctiacqa.supabase.co/functions/v1/channel-webhook`. `whatsapp-send` is the authenticated manual sender and is not the Meta callback. Server secrets stay in the Supabase function secret store: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_BUSINESS_ACCESS_TOKEN`, and optional `WHATSAPP_GRAPH_VERSION` (default `v27.0`). The owner binds the phone number, WABA, and app id in `#/app/whatsapp`; the form does not take a clinic id.

Set `XAI_API_KEY` only as a function secret. Leave it unset until a real key exists. Do not put it in the Pages build.

## WhatsApp connected state (2026-11-14)

`integration_status.state` may be `unconfigured`, `pending`, `connected`, or `error`. The panel labels these as Pendente, Conectado, or Erro. `channel-webhook` marks a clinic `connected` and sets `last_inbound_at` only after a signed inbound event is persisted for a mapped `phone_number_id`. Status callbacks without a prior message are ignored. The ingest path still returns HTTP 200 quickly after the RPC; unsigned posts remain 401; a wrong verify token remains 403.

Automatic Grok replies stay off: `clinic_settings.ai_replies_enabled` defaults to false, and `grok-reply` refuses to call the model unless that flag is true *and* `XAI_API_KEY` is present. Manual WhatsApp send is unchanged, with a basic cap of 10 outbound messages per clinic per minute.

## Embedded Signup token and register

Embedded Signup returns a short-lived code (about 30 seconds). The server exchanges it for a **business integration system user access token**. That token is long-lived; `debug_token` usually reports `type=SYSTEM_USER` and `expires_at=0`. The function stores `token_type` and `token_expires_at` when expiry is present. Only a short-lived USER token is upgraded with `fb_exchange_token`. Tech Providers use this business token for `subscribed_apps`, phone registration, and sending. A Solution Partner system user token is only needed later if you share a credit line — this app does not share credit lines.

`POST /{phone_number_id}/register` with `{ "messaging_product": "whatsapp", "pin": "xxxxxx" }` is required for new Cloud API numbers (within 14 days of signup). Coexistence and already-registered Cloud API numbers skip register. The optional 6-digit PIN in the clinic panel is never logged or stored. Re-running Conectar WhatsApp is idempotent: the route and token are upserted, `subscribed_apps` is attempted again, and a clinic already `connected` is not downgraded unless webhook subscription fails (`state=error`).

An authenticated GET on `whatsapp-onboard` with `x-clinic-id` or `clinicId` returns `{ diagnostics: { routePresent, lastInboundAt, subscribedAppsOk, tokenPresent, graphVersion, state } }` without token values.

## Meta configuration this implementation relies on

You must already be a **Tech Provider** (or Tech Partner) for live, multi-clinic Embedded Signup. App Review needs **Advanced Access** to:

- `whatsapp_business_management`
- `whatsapp_business_messaging`

Create a Facebook Login for Business configuration (WhatsApp Embedded Signup variation; v4 prefers the official template, including the “60 Expiration Token” template if you use it). Copy its **configuration ID** into the Edge Function secret `EMBEDDED_SIGNUP_CONFIG_ID`. For Cloud API only, request the WhatsApp account / Messaging account assets and the two permissions above — do not add Catalogs, Pages, or Ads unless you will use them.

In the Login configuration and App settings:

- Allowed domains and Valid OAuth redirect URIs must include `https://automatize.devbrasil.online` (and `https://marcos4213.github.io` if that origin is still used).
- The webhook callback is **not** the app hostname. Set it to `https://xjijlccnbrdpwctiacqa.supabase.co/functions/v1/channel-webhook`.
- Verify token must match the Edge Function secret `WHATSAPP_VERIFY_TOKEN`.
- Subscribe the `messages` field.
- After verification, each WABA must have `POST /{waba_id}/subscribed_apps` (the onboard function does this with the business token).
- Switch the app to **Live** only after Advanced Access is approved. In Development, only app testers can complete the flow.
- Onboarded businesses add their own payment method on the WhatsApp Business Platform account. This integration does not attach a partner credit line.
- Facebook domain verification for `devbrasil.online` is already present.

Edge Function secrets used (values stay in the secret store, never in this tree): `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `EMBEDDED_SIGNUP_CONFIG_ID`, optional `WHATSAPP_BUSINESS_ACCESS_TOKEN` (fallback for clinics without a stored business token), optional `WHATSAPP_GRAPH_VERSION` (default `v27.0`), optional `WHATSAPP_COEXISTENCE=true` to skip Cloud API register.
