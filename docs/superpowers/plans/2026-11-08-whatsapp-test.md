# WhatsApp de teste Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Receber o webhook de teste do WhatsApp e permitir um envio manual autenticado, sem resposta automática.

**Architecture:** Política pura em JavaScript testa desafio, HMAC, deduplicação, janela de 24 horas e idempotência. O SQL em `private` grava rota e mensagem depois da assinatura. `channel-webhook` não tem JWT de usuário. `whatsapp-send` exige sessão e `confirm: true`. A tela mínima fica em `#/app/whatsapp`.

**Tech Stack:** Supabase Edge Functions, Postgres 17, React hash router, Graph API padrão `v27.0`.

## Global Constraints

- Não enviar mensagem real, nem `hello_world`, nesta implementação ou nos testes.
- Não chamar `grok-reply` a partir do webhook. Lead criado por inbound nasce com `ai_active = false`.
- Não ler, pedir ou gravar `WHATSAPP_BUSINESS_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET` ou `WHATSAPP_VERIFY_TOKEN` no repositório, SQL, artefato, frontend ou log.
- A clínica do webhook sai de `metadata.phone_number_id`. Rejeitar número desconhecido sem gravar mensagem. Não aceitar `clinic_id` do payload como autoridade.
- Só `owner` altera `whatsapp_routes`. `anon` não escreve. Função pública é `SECURITY INVOKER`; o corpo privilegiado fica em `private` com `search_path` vazio.
- `accepted` não é `delivered`. Status não regride. Retentativa com a mesma chave não chama o Graph outra vez.
- Texto de sessão só com inbound desse `wa_id` nas últimas 24 horas. Sem template nesta fase.
- Corpo bruto máximo 262144 bytes. Tipo diferente de texto vira `unsupported` com corpo nulo.
- Não mudar a barra lateral nem o onboarding. O link da tela sai de Ajustes.
- Versão Graph padrão `v27.0`, sobrescrita só por `WHATSAPP_GRAPH_VERSION`.
- Não cadastrar a URL na Meta antes do GET de desafio passar. Não ativar produção nem Embedded Signup.

---

### Task 1: Política pura do webhook e do envio

**Files:**
- Create: `supabase/functions/_shared/whatsapp-policy.js`
- Test: `supabase/functions/_shared/whatsapp-policy.test.js`

**Interfaces:**
- Consumes: nada
- Produces: `verifyChallenge(query, expectedToken)`, `decideInbound(payload, knownPhoneIds)`, `nextStatus(current, incoming)`, `canSendSessionText({ lastInboundAt, now })`, `outboundDecision({ confirm, idempotencyKey, existing })`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest'
import { canSendSessionText, decideInbound, nextStatus, outboundDecision, verifyChallenge } from './whatsapp-policy.js'

describe('whatsapp policy', () => {
  it('returns the challenge only when the verify token matches', () => {
    expect(verifyChallenge({ mode: 'subscribe', token: 'expected', challenge: '1158201444' }, 'expected')).toEqual({ status: 200, body: '1158201444', contentType: 'text/plain' })
    expect(verifyChallenge({ mode: 'subscribe', token: 'nope', challenge: '1158201444' }, 'expected').status).toBe(403)
  })

  it('routes by phone_number_id and dedups the provider message id', () => {
    const payload = { phoneNumberId: '1468451929686754', providerMessageId: 'wamid.1', type: 'text', text: 'Oi' }
    expect(decideInbound(payload, new Set(['1468451929686754']))).toMatchObject({ action: 'store', clinicKey: '1468451929686754' })
    expect(decideInbound({ ...payload, phoneNumberId: 'desconhecido' }, new Set(['1468451929686754']))).toEqual({ action: 'ignore' })
    expect(decideInbound({ ...payload, type: 'image' }, new Set(['1468451929686754']))).toMatchObject({ action: 'store', status: 'unsupported', text: null })
  })

  it('does not treat accepted as delivered and does not regress status', () => {
    expect(nextStatus('accepted', 'delivered')).toBe('delivered')
    expect(nextStatus('read', 'delivered')).toBe('read')
    expect(nextStatus('accepted', 'failed')).toBe('failed')
  })

  it('blocks session text outside 24 hours and a second send with the same key', () => {
    const now = Date.parse('2026-11-08T18:00:00Z')
    expect(canSendSessionText({ lastInboundAt: '2026-11-08T17:00:00Z', now })).toEqual({ ok: true })
    expect(canSendSessionText({ lastInboundAt: '2026-11-07T17:00:00Z', now })).toEqual({ ok: false, error: 'template_required' })
    expect(outboundDecision({ confirm: false, idempotencyKey: 'k1', existing: null })).toEqual({ action: 'reject', error: 'confirm_required' })
    expect(outboundDecision({ confirm: true, idempotencyKey: 'k1', existing: { providerMessageId: 'wamid.9', status: 'accepted' } })).toEqual({ action: 'return_existing' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run supabase/functions/_shared/whatsapp-policy.test.js`
Expected: FAIL because `whatsapp-policy.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implementar as cinco funções no arquivo novo. `verifyChallenge` só aceita `mode === 'subscribe'` e token idêntico. `decideInbound` devolve `ignore` para id desconhecido. `nextStatus` usa a ordem `accepted < sent < delivered < read` e deixa `failed` vencer. `canSendSessionText` mede 24 horas. `outboundDecision` não chama rede.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run supabase/functions/_shared/whatsapp-policy.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/whatsapp-policy.js supabase/functions/_shared/whatsapp-policy.test.js
git commit -m "Specify WhatsApp challenge, dedup, and manual-send decisions."
```

### Task 2: Rotas e mensagens com isolamento

**Files:**
- Create: `supabase/migrations/20261108190000_whatsapp_test.sql`
- Modify: `supabase/tests/rls_security.sql`

**Interfaces:**
- Consumes: `private.is_member`, `private.member_role`, `auth.uid()`
- Produces: `public.whatsapp_routes`, `public.whatsapp_messages`, `public.bind_whatsapp_route(phone_number_id text, waba_id text, meta_app_id text)`, `public.ingest_whatsapp_event` não existe para `anon` nem `authenticated`

- [ ] **Step 1: Write the failing SQL assertions**

Acrescentar ao script que já faz `rollback` usuários `example.test`. Depois do bootstrap do owner A, a chamada `public.bind_whatsapp_route('1468451929686754', '1337719091751370', '2217879795749408')` grava uma rota. O staff recebe `42501` na mesma chamada. O owner B não consegue vincular o mesmo `phone_number_id`. `anon` recebe `42501` em insert direto. Nenhuma função pública nova tem `prosecdef = true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_security.sql`
Expected: FAIL because `bind_whatsapp_route` does not exist.

- [ ] **Step 3: Write minimal implementation**

A migration cria as duas tabelas. `whatsapp_messages.provider_message_id` é único por `phone_number_id`. `idempotency_key` é única por clínica quando não é nula. O status obedece a lista da spec. RLS de select para membros. Sem política de escrita aberta. `private.bind_whatsapp_route` é `SECURITY DEFINER`, exige `member_role = owner` e `search_path` vazio. A função pública homônima é `SECURITY INVOKER` e só faz `select private.bind_whatsapp_route(...)`. Execute de `anon` é revogado. `private.ingest_whatsapp_event` é `SECURITY DEFINER`, concedida só a `service_role`, e resolve a clínica pela rota. Se o status novo for menor, a função devolve a linha atual.

- [ ] **Step 4: Run test to verify it passes**

Run the same `psql` command.
Expected: PASS and `ROLLBACK`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261108190000_whatsapp_test.sql supabase/tests/rls_security.sql
git commit -m "Add tenant-scoped WhatsApp routes and message dedup."
```

### Task 3: GET challenge e POST que grava

**Files:**
- Modify: `supabase/functions/channel-webhook/index.ts`
- Test: `supabase/functions/channel-webhook/webhook.test.js`

**Interfaces:**
- Consumes: `verifyHubSignature`, `verifyChallenge`, `decideInbound`
- Produces: GET 200/403/503 e POST 200/401/413/503. O teste injeta `ingest` e não abre rede.

- [ ] **Step 1: Write the failing test**

O teste monta o pedido GET com token certo e errado. Para o POST, assina o corpo cru com um segredo de teste `test-app-secret`, muda um espaço no JSON e espera 401. Corpo de 262145 bytes espera 413. Número desconhecido faz `ingest` não ser chamado e responde 200. O mesmo `wamid` chama `ingest` uma vez e a segunda resposta continua 200. Nenhum teste contém o token real.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run supabase/functions/channel-webhook/webhook.test.js`
Expected: FAIL because GET still falls through to 405.

- [ ] **Step 3: Write minimal implementation**

Ler o corpo uma vez como texto. Limitar o tamanho antes do parse. Verificar a assinatura com o segredo do ambiente. Extrair `metadata.phone_number_id` e chamar o ingest injetável. Não registrar corpo, telefone ou segredo. Não importar `grok-reply`.

- [ ] **Step 4: Run test to verify it passes**

Run the same vitest command.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/channel-webhook/index.ts supabase/functions/channel-webhook/webhook.test.js
git commit -m "Verify WhatsApp webhook challenges and signed test events."
```

### Task 4: Envio manual sem rede real

**Files:**
- Create: `supabase/functions/whatsapp-send/index.ts`
- Modify: `supabase/config.toml`
- Test: `supabase/functions/whatsapp-send/send.test.js`

**Interfaces:**
- Consumes: `canSendSessionText`, `outboundDecision`
- Produces: função `handleSend({ body, member, route, token, transport, now })`

- [ ] **Step 1: Write the failing test**

```js
it('does not call transport without confirm or outside the 24 hour window', async () => {
  const calls = []
  const transport = async () => { calls.push(1); return { id: 'wamid.new' } }
  const now = Date.parse('2026-11-08T18:00:00Z')
  const common = { member: true, route: { phoneNumberId: '1468451929686754' }, token: 'present', transport, now, idempotencyKey: 'k1' }
  expect((await handleSend({ ...common, confirm: false, lastInboundAt: '2026-11-08T17:00:00Z' })).status).toBe(400)
  expect((await handleSend({ ...common, confirm: true, lastInboundAt: '2026-11-07T17:00:00Z' })).body.error).toBe('template_required')
  expect(calls).toEqual([])
})
```

Acrescentar ausência de token com status 503 `whatsapp_token_unconfigured` e segunda chamada com linha existente sem novo `calls.push`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run supabase/functions/whatsapp-send/send.test.js`
Expected: FAIL because `handleSend` does not exist.

- [ ] **Step 3: Write minimal implementation**

`handleSend` aplica a política e só então chama `transport`. O `fetch` do Graph fica atrás dessa injeção. A URL é `https://graph.facebook.com/${version}/${phoneNumberId}/messages` com `type: text`. A resposta com id grava `accepted`. Erro OAuth grava `failed` e `token_expired` sem devolver o token. `config.toml` marca `verify_jwt = true` para `whatsapp-send`.

- [ ] **Step 4: Run test to verify it passes**

Run the same vitest command.
Expected: PASS and `calls` remains empty in the refusal cases.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/whatsapp-send supabase/config.toml
git commit -m "Add explicit WhatsApp test sends without automatic replies."
```

### Task 5: Tela mínima e estado honesto

**Files:**
- Create: `src/pages/WhatsAppTest.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Settings.jsx`
- Test: `src/pages/WhatsAppTest.test.jsx`

**Interfaces:**
- Consumes: rota e mensagens já gravadas, mais a função de envio
- Produces: link "WhatsApp de teste" em Ajustes e a rota `#/app/whatsapp`

- [ ] **Step 1: Write the failing test**

Renderizar a página com rota vazia e esperar o texto "Não conectado". Renderizar com uma mensagem `accepted` e esperar "Aceito pela API" e a ausência de "Entregue". O botão "Enviar mensagem de teste" fica desabilitado sem inbound recente. O clique só acontece no teste com `confirm` já verdadeiro no double do cliente; o teste não chama a Meta.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/WhatsAppTest.test.jsx`
Expected: FAIL because the page does not exist.

- [ ] **Step 3: Write minimal implementation**

A página lista o estado e o vazio. O link em Ajustes aponta para `/whatsapp` dentro do app autenticado. Não alterar `Sidebar.jsx` nem o formulário de onboarding. Não mostrar o token nem os segredos, só "presente" ou "ausente" vindo de um booleano do servidor.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, including the existing 32 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/WhatsAppTest.jsx src/pages/WhatsAppTest.test.jsx src/App.jsx src/pages/Settings.jsx
git commit -m "Show the WhatsApp test state without claiming delivery."
```

## Self-review

- A spec pede GET, HMAC, rota por número, dedup, envio manual, janela de 24 horas e tela mínima. As tarefas 1 a 5 cobrem isso.
- Não há envio automático, template, produção nem mudança de menu.
- Os testes não usam o token real e terminam sem chamada de rede nas recusas.
- A migration nova não repete o erro de criar helper `language sql` antes da tabela que ele lê.
