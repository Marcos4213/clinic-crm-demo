# Convertize Edge Functions

No secrets are in this tree. Do not add `XAI_API_KEY`, `service_role`, or `WHATSAPP_APP_SECRET` to these files.

Model id `grok-4.7` was checked against https://docs.x.ai/docs/models on 2026-11-08. That page lists `grok-4.7` and recommends it for chat. The call is `POST https://api.x.ai/v1/responses`. If `XAI_API_KEY` is absent, `grok-reply` returns HTTP 503 `{ "status": "unconfigured", "provider": "grok", "error": "grok_unconfigured" }` and does not invent a reply.

## Files

| Path | Role |
| --- | --- |
| `supabase/config.toml` | `verify_jwt` per function |
| `supabase/functions/grok-reply/index.ts` | Deploy entrypoint `grok-reply` |
| `supabase/functions/channel-webhook/index.ts` | Deploy entrypoint `channel-webhook` |
| `supabase/functions/_shared/ai-policy.js` | Imported by `grok-reply` |
| `supabase/functions/_shared/schedule.js` | Imported by `grok-reply` |
| `supabase/functions/_shared/webhook.js` | Imported by `channel-webhook` |

`grok-reply/index.ts` also imports `npm:@supabase/server@1`.
`channel-webhook/index.ts` also imports `npm:@supabase/server@1`.

## Config

```toml
[functions.grok-reply]
verify_jwt = true

[functions.channel-webhook]
verify_jwt = false
```

`verify_jwt = true` checks the user access token in `Authorization: Bearer <jwt>`. The publishable key is not a JWT. Send it only as `apikey`. `supabase-js` `functions.invoke` does this when a session exists.

`channel-webhook` uses `auth: 'none'` inside the handler because a provider does not send a Supabase JWT. Without `WHATSAPP_APP_SECRET` it returns 503 `webhook_unconfigured`. With the secret it checks `X-Hub-Signature-256` and still does not send a message or write a tenant row.

## Deploy

From the repository root, after the SQL migration is on project `xjijlccnbrdpwctiacqa`:

```bash
supabase functions deploy grok-reply --project-ref xjijlccnbrdpwctiacqa
supabase functions deploy channel-webhook --project-ref xjijlccnbrdpwctiacqa
```

Set `XAI_API_KEY` only as a function secret. Leave it unset until a real key exists. Do not put it in the Pages build.
