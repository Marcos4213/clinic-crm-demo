# Automatize.app

Demonstração frontend de CRM para clínicas — React e Tailwind. Apenas dados fictícios.

O Automatize.app agenda. A sua equipe fecha.

App de clínicas no mesmo repositório. `#/` entra com e-mail e senha. `#/demo` é a amostra local e não grava no Supabase. `#/app` é a clínica autenticada depois que o esquema com RLS está aplicado.

Não há página de marketing. O WhatsApp de teste não envia sozinho e não aparece como conectado sem evidência de entrega. Instagram e Google Calendar não estão conectados. A agenda interna usa `America/Sao_Paulo`. Sem a chave `XAI_API_KEY` no servidor, a IA responde `grok_unconfigured` e não simula uma resposta. A simulação existe só na demonstração local, identificada como amostra.

## Local

```bash
npm install
npm test
npm run lint
npm run build
npm run dev
```

A build pública usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Essa chave é publicável, não é JWT e não é `service_role`. O modelo é `./.env.example`.

## Supabase e Pages

O esquema, os testes de RLS e as Edge Functions estão em `supabase/`. Os passos manuais de Site URL e secrets estão em `docs/convertize-setup.md`.

Site URL a configurar: `https://marcos4213.github.io/clinic-crm-demo/`.

O workflow `.github/workflows/pages.yml` publica `main` em `https://marcos4213.github.io/clinic-crm-demo/#/`.
