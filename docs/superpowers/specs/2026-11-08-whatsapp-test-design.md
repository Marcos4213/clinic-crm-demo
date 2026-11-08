# WhatsApp de teste — especificação

**Status:** proposta para revisão. A implementação não começou.
**Data da pesquisa:** 2026-11-08.
**Fora desta fase:** redesenho de menu e onboarding, Instagram, Embedded Signup, número de produção, resposta automática e qualquer envio disparado por agente ou pela IA.

## Decisão

O Convertize recebe e envia WhatsApp só no número de teste já confirmado pelo usuário, por uma clínica por `phone_number_id`. O webhook prova a posse do endpoint com o desafio GET e só grava o POST se a assinatura HMAC do corpo cru for válida. O envio é manual, no clique explícito de um membro da clínica, feito no servidor com o token que o usuário gravar no painel do Supabase. A chegada ao Graph não é entrega. A IA não responde ao webhook.

O painel da Meta em que o usuário enviou `hello_world` e recebeu `Oi` não prova que este app recebeu esses eventos. A prova passa a ser uma linha gravada por este webhook.

## Versão da API

O changelog público da Graph API, lido em 2026-11-08, declara `v27.0` como a versão mais recente. `v25.0` foi introduzida em 2026-02-18 e permanece disponível até 2026-07-29. A versão mostrada na interface do app não escolhe a URL. O servidor usa `WHATSAPP_GRAPH_VERSION` quando esse valor existir e, na ausência, `v27.0`. Não fixar `v25` só porque a tela mostrou essa versão.

Contrato oficial já confirmado na documentação de webhooks da Graph:

- `GET` com `hub.mode=subscribe`, `hub.verify_token` e `hub.challenge`. O endpoint devolve o challenge em texto puro com HTTP 200 só se o token coincidir. Caso contrário, 403.
- `POST` com `X-Hub-Signature-256: sha256=<hmac sha256 do corpo cru com o App Secret>`. Comparação em tempo constante. Corpo regravado em JSON não serve para a assinatura.
- HTTPS válido. Certificado autoassinado não serve. A função Supabase já está em HTTPS.
- Meta reenvia por até 36 horas quando não recebe 200. O armazenamento deduplica.

## O que já existe

- `channel-webhook` está implantada, `verify_jwt = false`, `auth: 'none'`. Sem `WHATSAPP_APP_SECRET` responde 503 `webhook_unconfigured`. Com segredo e assinatura válida responde 202 e não grava nada. Não trata GET.
- `verifyHubSignature` em `supabase/functions/_shared/webhook.js` já calcula o HMAC do corpo cru.
- `integration_status` aceita o provedor `whatsapp` apenas nos estados `unconfigured` e `pending`. Não existe estado `connected`.
- `messages.channel` só aceita `internal`, e `delivery` só aceita `local`. Cliente autenticado não pode inserir mensagem de IA nem canal externo.
- Papéis de membership: `owner` e `staff`. Não existe `admin`.
- Funções públicas privilegiadas desta base são `SECURITY INVOKER` e delegam o corpo a `private`, com `search_path` vazio.

## Segredos

Nenhum segredo entra em SQL, repositório, artefato, frontend ou log. O conector Supabase não grava segredo nem Auth. Quem grava é o usuário, no painel de segredos da função, ou por um mecanismo oficial quando houver CLI válida.

| Nome | Quem cria | Uso |
| --- | --- | --- |
| `WHATSAPP_APP_SECRET` | Usuário cola o App Secret no painel. Ainda não foi fornecido. | HMAC do POST. |
| `WHATSAPP_VERIFY_TOKEN` | Gerado no provisionamento com aleatoriedade do servidor. Não é escolhido nem impresso neste chat. O usuário cola o mesmo valor no campo Verify Token da Meta. | GET challenge. |
| `WHATSAPP_BUSINESS_ACCESS_TOKEN` | Usuário já o colocou num ambiente local. Este agente não lê, não pede e não copia. O usuário grava o valor no painel Supabase. | Envio Graph. |
| `WHATSAPP_GRAPH_VERSION` | Opcional. | Sobrescreve o padrão `v27.0`. |
| `XAI_API_KEY` | Usuário disse que salvou. Não é usado nesta fase. | Fora do webhook. |

Identificadores que o usuário confirmou como não secretos, gravados pelo owner na clínica, não no código:

- App ID `2217879795749408`
- WABA ID `1337719091751370`
- Phone number ID `1468451929686754`

O plugin WhatsApp `75770130` não está instalado e não substitui esta integração. Instalação não faz parte desta fase.

## Roteamento

A clínica sai de `metadata.phone_number_id` do payload assinado. O pedido não traz `clinic_id` confiável. Número ausente da tabela de rotas: HTTP 200 para a Meta parar a retentativa, zero linhas de mensagem, log só com `unmapped_phone_number_id` e sem corpo, nome ou telefone do cliente. Um `phone_number_id` pertence no máximo a uma clínica.

Só o `owner` grava ou troca essa rota, por RPC `SECURITY INVOKER` que chama helper `SECURITY DEFINER` em `private`. `staff` lê o estado. `anon` não escreve. `authenticated` não insere a rota direto na tabela.

## Persistência

Nova tabela pública `whatsapp_routes`: `clinic_id`, `phone_number_id` único, `waba_id`, `meta_app_id`, `created_by`. RLS de leitura para membros. Sem política de insert/update/delete para `authenticated`.

Nova tabela pública `whatsapp_messages`: clínica, rota, `provider_message_id`, direção `inbound` ou `outbound`, tipo, corpo de texto ou nulo, status, `idempotency_key` do envio, código de erro curto, timestamps. Único por (`phone_number_id`, `provider_message_id`). Único por (`clinic_id`, `idempotency_key`) quando a chave existe. RLS de leitura para membros. Escrita só pelos helpers privados.

Status permitidos: `received`, `accepted`, `sent`, `delivered`, `read`, `failed`, `unsupported`. A ordem sobe de `accepted` para `sent`, `delivered` e `read`. `failed` pode substituir um status anterior. Um status menor não apaga um maior. `accepted` é a resposta do Graph com `messages[0].id`. `delivered` e `read` só nascem do webhook de status.

Texto inbound grava no máximo 4096 caracteres. Outros tipos viram `unsupported`, com corpo nulo. Não se baixa mídia e não se registra o payload completo.

O lead, se for criado para o `wa_id`, nasce com `ai_active = false` e origem apenas interna a esta tabela. Não se mescla lead pelo nome. A coluna de origem do CRM da proposta de menu não entra nesta fase.

`integration_status` permanece `unconfigured` sem rota e `pending` com rota salva. O detalhe curto diz a verdade: segredo ausente, aguardando webhook, token recusado ou último erro de código. Não se grava `connected`.

## Webhook

`channel-webhook` continua com `verify_jwt = false`.

- Sem `WHATSAPP_APP_SECRET` ou sem `WHATSAPP_VERIFY_TOKEN`: GET e POST devolvem 503 `webhook_unconfigured`. Não se cadastra a URL na Meta antes do GET de desafio responder.
- GET válido: 200 e o challenge em `text/plain`.
- POST maior que 262144 bytes: 413, sem parse e sem log do corpo.
- Assinatura ausente ou inválida: 401. Não se grava.
- Assinatura válida e número mapeado: persiste e responde 200. Repetir o mesmo `provider_message_id` responde 200 e não cria outra linha.
- O handler não chama `grok-reply`, não envia mensagem e não registra corpo, `wa_id`, token ou segredo.

A URL só é colada no painel da Meta depois que o GET de desafio passar. Forma prevista: `https://xjijlccnbrdpwctiacqa.supabase.co/functions/v1/channel-webhook`.

## Envio manual

Nova função `whatsapp-send`, `verify_jwt = true`, `auth: 'user'`. O membro da clínica dona da rota chama com `confirm: true`, o `wa_id` de destino e uma `idempotency_key`. Sem `confirm: true`, 400 e zero chamada Graph.

O servidor recusa texto de sessão quando não há inbound de texto desse `wa_id` nas últimas 24 horas. A interface explica que fora da janela a Meta exige template aprovado. Esta fase não envia template, nem `hello_world`.

Token ausente: 503 `whatsapp_token_unconfigured`, sem id inventado. Graph 190 ou erro de OAuth: status `failed` e detalhe `token_expired`, sem o token. Resposta com `messages[0].id`: grava `accepted` e mostra que ainda não é entrega. Retentativa com a mesma `idempotency_key` devolve a linha existente e não chama o Graph de novo.

O botão da tela pede confirmação explícita. A recepção não tem resposta automática.

## Tela mínima

Uma rota autenticada `#/app/whatsapp`, aberta por um link de texto em Ajustes. Não muda a barra lateral nem o onboarding. Mostra estado da rota, se os segredos estão presentes como sim ou não, a lista do que foi gravado, o vazio honesto e o formulário de envio desabilitado quando a janela, a rota ou o token não permitem. Tipos não suportados aparecem como não suportados. Nada nessa tela afirma que o evento visto no painel da Meta já chegou.

## Testes que a implementação terá de passar

Não rodam contra a Meta e não enviam mensagem.

- Desafio aceito e rejeitado.
- HMAC do corpo cru aceito; o mesmo JSON reformatado rejeitado.
- POST sem segredo continua 503.
- Número desconhecido não grava.
- Duplicata e replay não criam segunda linha.
- Status não regride; `accepted` não vira `delivered` sem webhook de status.
- Tipo não texto grava `unsupported` e corpo nulo.
- Corpo acima do limite responde 413.
- Anon não escreve rota nem mensagem.
- Staff não altera a rota; owner de outra clínica não vincula o número.
- Envio sem `confirm` não chama o transporte.
- Segunda chamada com a mesma chave não chama o transporte.
- Sem inbound em 24 horas, o texto é recusado com `template_required`.
- Token ausente não fabrica `wamid`.

## Fora de escopo

Produção, Embedded Signup para várias clínicas, Instagram, mídia, templates, disparo em massa, menu novo, onboarding novo e teste autenticado do Grok.
