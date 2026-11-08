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
  - `https://convertize.devbrasil.online/`
  - `https://convertize.devbrasil.online`
  - `http://localhost:5173/`
  - `http://127.0.0.1:5173/`

O cadastro usa o endereço atual do navegador como `emailRedirectTo`. No Pages ele continua `https://marcos4213.github.io/clinic-crm-demo/`. Em `https://convertize.devbrasil.online/` o retorno é essa origem, sem hash. As duas precisam estar na allow-list antes de um login real nesse host. Este repositório não altera essa configuração.

O app usa PKCE (`flowType: 'pkce'`). O retorno chega como `?code=` na URL acima, antes do hash. O cliente troca o code e só então abre `#/app`. Se o projeto ainda devolver o fluxo implícito (`#access_token=`), o mesmo preparo lê a sessão e substitui o hash por `#/app` antes do roteador.

Não desligar o cadastro. Se "Confirm email" estiver ligado, o cadastro fica sem sessão até a pessoa abrir o próprio e-mail. O app não dispara outro e-mail.

## Testes, sem misturar ambientes

- `npm test` cobre o app e as regras puras de agenda, Grok e assinatura. Não abre o projeto `xjijlccnbrdpwctiacqa`.
- O arquivo `supabase/migrations/20261108170000_convertize_core.sql` também foi exercitado numa instância local descartável de PostgreSQL 17.11. O `rollback` local não é o projeto remoto.
- O conector aplicou depois a migration `20261108173252` `convertize_core` em `xjijlccnbrdpwctiacqa`, com `schema_guard` `{ok:true, version:2}`. Este repositório não repetiu essa aplicação.

## Cloudflare Worker

O build relativo também pode ser servido em `https://convertize.devbrasil.online/` por módulos do Worker, sem Workers Assets e sem publicar daqui. Depois de `npm run build`, `node scripts/build-cloudflare-upload.mjs` grava o `upload.json`. O envio é `PUT /accounts/{account_id}/workers/scripts/convertize` em `multipart/form-data`: a parte `metadata` é o objeto `metadata`, e cada item de `modules` é uma parte com o nome `modules[].name`. Texto entra como `text/plain`; binário entra como `application/octet-stream` depois de decodificar o base64. O MIME visto pelo navegador está no mapa do `worker.mjs`, não no MIME de upload.

A documentação de limites dos Workers, atualizada em 29 out 2026, marca 64 MiB sem compressão, 128 MB de memória, 1 s de startup e 10 ms de CPU por request no plano gratuito. O mesmo plano tem 100.000 requests por dia na conta. Cada arquivo pedido passa pelo Worker e consome essa cota. O domínio, se for anexado depois, usa `PUT /accounts/{account_id}/workers/domains` com `hostname` `convertize.devbrasil.online` e `service` `convertize`.

## O que ainda não está conectado

- Grok, até `XAI_API_KEY` existir no servidor.
- WhatsApp e Instagram, até haver provedor, segredo e mapeamento de conta.
- Google Calendar. A agenda é interna, fuso `America/Sao_Paulo`.
