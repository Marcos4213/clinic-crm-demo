# Convertize — configuração que o conector não altera

O app público é `https://marcos4213.github.io/clinic-crm-demo/#/`.
O projeto Supabase é `xjijlccnbrdpwctiacqa` em `https://xjijlccnbrdpwctiacqa.supabase.co`.

A chave `sb_publishable_…` no `.env` é a chave publicável do frontend. Ela não é JWT e não é `service_role`. O navegador envia essa chave no header `apikey`. O access token do usuário, que é um JWT, vai em `Authorization: Bearer`.

## Aplicar no projeto (coordenador)

1. Executar `supabase/migrations/20261108170000_convertize_core.sql` inteiro.
2. Executar `supabase/tests/rls_security.sql` no editor SQL. O script faz `rollback`. Falha se o isolamento quebrar.
3. Publicar as Edge Functions `grok-reply` e `channel-webhook` com `supabase/config.toml`.
4. Gravar o segredo `XAI_API_KEY` só nas secrets da função. Sem essa chave, `grok-reply` responde `503` com `grok_unconfigured` e não inventa resposta.
5. Não gravar `WHATSAPP_APP_SECRET` até existir um app oficial. Sem o segredo, `channel-webhook` responde `503` com `webhook_unconfigured`.

`grok-reply` fica com `verify_jwt = true`. O gateway exige o JWT do usuário no header `Authorization`. A chave publicável segue no header `apikey`. Mandar a chave publicável como Bearer não autentica o usuário.

`channel-webhook` fica com `verify_jwt = false` e `auth: 'none'`, porque o provedor não manda JWT do Supabase. A autenticação é HMAC-SHA256 do corpo cru em `X-Hub-Signature-256`.

## Auth URL (manual no dashboard)

O conector desta etapa não altera Site URL, SMTP nem usuários.

Em Authentication → URL Configuration:

- Site URL: `https://marcos4213.github.io/clinic-crm-demo/`
- Redirect URLs:
  - `https://marcos4213.github.io/clinic-crm-demo/`
  - `https://marcos4213.github.io/clinic-crm-demo`
  - `http://localhost:5173/`
  - `http://127.0.0.1:5173/`

O app usa PKCE (`flowType: 'pkce'`). O retorno chega como `?code=` na URL acima, antes do hash. O cliente troca o code e só então abre `#/app`. Se o projeto ainda devolver o fluxo implícito (`#access_token=`), o mesmo preparo lê a sessão e substitui o hash por `#/app` antes do roteador.

Não desligar o cadastro. Se "Confirm email" estiver ligado, o cadastro fica sem sessão até a pessoa abrir o próprio e-mail. O app não dispara outro e-mail.

## O que ainda não está conectado

- Grok, até `XAI_API_KEY` existir no servidor.
- WhatsApp e Instagram, até haver provedor, segredo e mapeamento de conta.
- Google Calendar. A agenda é interna, fuso `America/Sao_Paulo`.
