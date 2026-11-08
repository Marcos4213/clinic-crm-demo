# Automatize.app MVP

Automatize.app is the working clinic app in this repository. There is no marketing site. The hostname stays `convertize.devbrasil.online`. `#/` is email/password entry. `#/demo` is a labeled local sample that never writes to Supabase. `#/app` is the authenticated clinic after `schema_guard` reports RLS.

The public Supabase project is `xjijlccnbrdpwctiacqa` (`https://xjijlccnbrdpwctiacqa.supabase.co`). The frontend build embeds only the publishable key. `service_role` is not in the repo. Grok uses `POST https://api.x.ai/v1/responses` with model `grok-4.7` inside the `grok-reply` Edge Function. Without `XAI_API_KEY` the function returns `grok_unconfigured` and does not invent a reply.

Tenant access is `clinic_memberships`, not user metadata. `bootstrap_workspace` creates a clinic for `auth.uid()` only. Appointment overlap for `scheduled` rows is a `gist` exclusion constraint plus an advisory lock on the offer path. Messages stay `internal` / `local`. WhatsApp and Instagram stay unconfigured until a provider secret and account mapping exist.

Manual Auth URL steps are in `docs/convertize-setup.md`. This change does not alter Site URL, SMTP, or users.
