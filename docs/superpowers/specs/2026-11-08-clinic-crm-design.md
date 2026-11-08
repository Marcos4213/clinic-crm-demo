# Clinic CRM — Design Spec

**Date:** 2026-11-08
**Status:** Approved by the user before this document was written. This file records that approval. Do not pause for a second design sign-off.
**Product name:** Clinic CRM (temporary, neutral). No finalized brand and no Instagram identity.
**Audience:** Brazilian aesthetic-clinic commercial teams. All product UI copy is pt-BR.
**Scope:** Frontend only. Static build compatible with GitHub Pages. This Origin draft does not publish a GitHub repository or a Pages site.

## 1. Purpose

A production-quality B2B CRM demo for clinic sales pipelines. Operators review fictional leads, read a WhatsApp-familiar local conversation, pause the simulated assistant per lead, and answer locally. The interface must feel like a refined operational tool: dense, quiet, and specific. It must not look like a generic starter template, and it must not impersonate WhatsApp, a live assistant, or a connected campaign platform.

## 2. Hard boundaries

- No Supabase, database, authentication, or paid service.
- No WhatsApp Business API, unofficial WhatsApp client, webhook, or credential.
- No real patient data. Every person, phone, procedure interest, and message is invented for the demo.
- Phone numbers are visibly invalid placeholders: Brazilian country code `+55`, area code `00` (not a real DDD), and subscriber numbers `90000-01xx`.
- The app never claims a message was sent, a campaign ran, or a model replied. Local appends are labeled as demonstration.
- Delivery and read ticks are visual cues only. Accessible names say they are demonstração.
- Sidebar destinations other than the pipeline open in-app screens. They are not dead controls and they do not call external services.
- Do not invent revenue, NPS, testimonials, or market benchmarks. Any summary number is counted from the in-memory sample.

## 3. Stack

- Vite, React (JSX, not TypeScript), Tailwind CSS.
- `react-router-dom` with `HashRouter` so deep links work on static hosting without rewrite rules.
- `lucide-react` for every icon. No emoji icons, no bitmap icon fonts.
- Vitest, jsdom, React Testing Library, and `@testing-library/user-event`.
- ESLint for the configured source set.
- Self-hosted UI font via `@fontsource-variable/instrument-sans` so the static build does not depend on a font CDN.
- Asset base defaults to `./` (relative), overridable with `VITE_BASE_PATH`, so the same `dist/` can sit at a domain root or a project-site subpath.

## 4. Information architecture

Hash routes:

| Hash | Screen | Behavior |
| --- | --- | --- |
| `#/` | Pipeline | Three-pane CRM |
| `#/disparos` | Disparos em Massa | Local preview, sending disabled |
| `#/ia` | Configurações de IA | Local preview, no model connection |
| `#/relatorios` | Relatórios | Counts computed from the current sample |

`src/App.jsx` owns the router and the application frame: full-viewport row, skip link, sidebar, and the routed main region. Unknown hashes redirect to `#/`.

The sidebar is a narrow navy rail, present on every route:

- CRM → `#/`
- Disparos em Massa → `#/disparos`
- Configurações de IA → `#/ia`
- Relatórios → `#/relatorios`

Each item is an icon button with an accessible name, a tooltip on hover and keyboard focus, and a visible active state tied to the current hash. Active is `aria-current="page"`.

## 5. Visual system

Restrained clinical-tech, not a neon dashboard and not a gray wireframe.

- Sidebar `#070D18`, icon `#E7EEF6`, active well `#15263D`, active marker `#7DCEC8`. Width 72px on desktop. Tooltips sit to the right of the rail.
- Canvas `#EEF2F6`. Cards `#FFFFFF`. Hairline `#E3E8EE`. Ink `#142033`. Secondary text `#3E5166` (must stay at least 4.5:1 on white).
- Accent teal `#0F6E6B` and blue `#1E4E89`. Chat canvas `#E6EEEF`. Client bubbles `#D7F3E3`. Assistant bubbles white. Human bubbles `#E7F0FA`.
- Type: Instrument Sans. 13px body in the board, 12px metadata, 11px uppercase labels with slight tracking. Tabular numbers for counts and phones.
- Shadows are small and cool: `0 1px 1px rgba(16,32,51,.04), 0 10px 28px rgba(16,32,51,.05)`. Borders do the separation work.
- Motion is opacity and color, about 150ms. `@media (prefers-reduced-motion: reduce)` removes transitions. No looping pulses, no large gradients, no glassmorphism.
- Focus is always visible: 2px teal outline with offset. Do not zero out outlines globally.
- Temperature chips use a 6px dot plus a word, dark text on a pale ground: Quente, Morno, Frio.
- The product mark is an inline SVG monogram. There is no WhatsApp glyph and no third-party logo.

Density target: a laptop shows the rail, four readable columns (the board may scroll horizontally inside itself), and the conversation without scrolling the document.

## 6. Pipeline screen

### Header

- Eyebrow: `Clínica · Pipeline comercial`
- Title: `Atendimento`
- A small badge whose visible text is `Demonstração`.
- One honest line: `Dados fictícios. Nenhuma mensagem sai deste navegador.`
- Search field, accessible name `Buscar leads`, matches name, phone, and procedure. Matching is case-insensitive and accent-insensitive.
- Temperature filter: `Todos`, `Quente`, `Morno`, `Frio`. Combined with search by AND.
- A control to clear the search when it is non-empty.
- KPI strip, computed from the current in-memory leads (after moves and new local messages do not invent leads): total, and the four stage counts. Labels make clear these are counts of the amostra. No currency.

### Board

Four columns, in this order, with these exact titles:

1. `Em Atendimento (IA)`
2. `Qualificados`
3. `Agendados`
4. `Fechados`

Each column is a labelled region, shows the count of leads currently visible in it, and scrolls vertically inside the column. The board container scrolls horizontally when the four columns plus the chat do not fit. The document itself does not scroll on this screen. Empty column copy: `Nenhum lead com esse filtro.`

### Lead card

Shows fictitious name, the placeholder phone with the visible note `número fictício`, the procedure, and the temperature tag. Also shows whether that lead is under IA or controle humano.

Clicking or pressing Enter/Space on the card selects it: the card is highlighted, `aria-pressed` is true, and the conversation header shows that lead. Selection survives filtering only while the lead remains; if the active lead is filtered out, the conversation pane says to adjust the filter or pick a visible lead, and does not swap to someone else silently.

### Moving leads

Every card has an accessible menu named `Mover {nome}` listing the four stages. Choosing the current stage is a no-op. Choosing another stage moves only that lead and updates counts immediately.

HTML5 drag-and-drop is also available: drag a card onto a column. The column shows a drop affordance. A polite live region announces `{nome} agora está em {coluna}`. Keyboard users are not required to drag. Automated tests use the menu, not drag-and-drop.

## 7. Conversation pane

WhatsApp-familiar structure, Clinic CRM identity:

- White header, initials avatar, lead name, procedure, temperature, phone, and a status line.
- Status is `IA conduzindo` or `Controle humano`. Never `online`, never a WhatsApp connection badge.
- When `aiActive` is true, the header button text is exactly `Assumir Atendimento (Pausar IA)` and the button uses the filled teal treatment.
- Activating it sets human control for that lead only. The button becomes `Reativar IA`, changes to an outlined navy treatment, and the status line reads `Controle humano`.
- Activating `Reativar IA` returns that lead to the assistant. Other leads are untouched.
- A permanent caption under the header: `Canal de demonstração do Clinic CRM. Não é o WhatsApp e não há envio externo.`

Messages:

- Roles `IA`, `Cliente`, and `Humano`, each visually distinct and labelled in text, not by color alone.
- Timestamp in pt-BR, `dd/mm · hh:mm`, from the message's fixed or local timestamp.
- Outgoing IA and Humano messages may show a single tick (delivered cue) or a double tick (read cue). The accessible name is `Indicador visual de demonstração: entregue` or `Indicador visual de demonstração: lido`. Cliente messages have no tick.
- Local messages added by the operator use the Humano role and the delivered cue, plus the visible word `local` so the tick cannot be read as a carrier receipt.

Composer:

- Named `Mensagem para {nome}`.
- Disabled, together with the send button, while that lead's IA is active. Disabled reason, visible: `A IA está conduzindo esta conversa. Assuma o atendimento para escrever.`
- Enabled after takeover. Placeholder: `Escreva uma resposta local…`
- Helper: `Enter envia · Shift+Enter quebra a linha · a mensagem fica só neste navegador.`
- Send control name: `Enviar mensagem local`.
- Enter sends. Shift+Enter inserts a newline. The send button sends.
- Text is trimmed. Empty or whitespace-only input does not append a message and does not clear a meaningful in-progress draft of another lead.
- A successful send appends one Humano message, clears that lead's draft, and leaves every other lead unchanged.
- Drafts and transcripts are stored per lead. Switching cards restores both.

## 8. Sample data

Twelve fictional leads. Required identities:

- Maria Silva, procedure `Botox`, temperature Quente, column `Em Atendimento (IA)`, IA active. Phone `+55 00 90000-0101`.
- João Pedro, procedure `Implante Capilar`, temperature Morno, column `Qualificados`, IA active. Phone `+55 00 90000-0105`.

The other ten leads use distinct fictional Brazilian names, mix all four columns and all three temperatures, and include both IA-active and human-control leads so the board is not uniform. Each lead has two to four short commercial messages in clinic Portuguese. No clinical promises, no prices presented as real quotes, no real addresses.

Initial selected lead: Maria Silva.

Column ids are stable: `em-atendimento`, `qualificados`, `agendados`, `fechados`. Display labels are the exact strings in section 6.

## 9. Other screens

Shared quiet layout: page title, `Demonstração` badge, and a single explanatory panel. Primary actions that would leave the browser are absent. Buttons that represent a future integration are `disabled` and named as disabled.

- **Disparos em Massa.** States that mass sending is not connected. Shows a disabled sample template about a fictional Botox recall. The send control reads `Envio desativado — sem integração` and is disabled. Copy states that no campaign is created and no contact is reached.
- **Configurações de IA.** States that no model provider is connected. Shows local, non-persistent display of a suggested tone (`acolhedor e direto`) and a pause reminder. Nothing is saved to a server. Copy tells the operator that takeover on the pipeline is the only assistant control in this demo, and it is per lead.
- **Relatórios.** Recomputes stage, temperature, and procedure counts from the current leads. Intro line: `Números calculados só com a amostra fictícia carregada neste navegador.` No charts of invented revenue.

Each screen offers a link `Voltar ao pipeline`.

## 10. Responsive behavior

- Viewport width `>= 1024px`: rail + board + conversation. Board scrolls internally on both axes as needed. Chat width 340px, 400px from 1280px up. Columns have a 248px minimum.
- Viewport width `<= 1023px`: rail becomes a horizontal icon bar. The main region shows one pane at a time. Toggle buttons `Mostrar funil` and `Mostrar conversa` reflect `aria-pressed`. Choosing a lead switches to the conversation. The conversation offers `Voltar ao funil`.
- No fixed pixel width on the page root. No horizontal clipping of the sidebar or composer. Panels use `min-width: 0` and internal overflow.

## 11. Accessibility

- `html lang="pt-BR"`.
- Skip link `Ir para o conteúdo`.
- Landmarks: navigation `Seções do Clinic CRM`, main, and named regions for the board and the conversation.
- Icon-only controls have accessible names. Tooltips do not replace those names.
- Visible focus, keyboard operation of selection, stage menu, composer, and toggles.
- Color is not the only status channel.
- Reduced motion is honored.
- Contrast target WCAG AA for text and for the teal controls used as text or icons.

## 12. State model

In memory only, inside a provider owned by `App`.

```text
Lead {
  id: string
  name: string
  phone: string
  procedure: string
  temperature: 'quente' | 'morno' | 'frio'
  column: 'em-atendimento' | 'qualificados' | 'agendados' | 'fechados'
  aiActive: boolean
  messages: Message[]
}

Message {
  id: string
  role: 'ia' | 'cliente' | 'humano'
  text: string
  at: string // ISO-8601
  receipt: 'delivered' | 'read' | null
  localDemo: boolean
}
```

Pure functions live in `src/domain/crm.js` and are the only place that implements filter, count, move, takeover, and send rules. The provider and the components call them. Send uses a caller-supplied id and timestamp so tests stay deterministic.

## 13. Testing

Automated tests must cover:

- Selecting Maria Silva and João Pedro updates the highlighted card, the conversation header, and the messages.
- Takeover and reactivation are per lead.
- The composer and send control are disabled while IA is active and enabled after takeover.
- A non-empty local send appends one Humano message; whitespace does not; Enter sends; the transcript remains after switching leads.
- Moving a lead updates its column and the visible counts.
- Search and temperature filter change who is visible and the counts.
- Compact viewport renders the pane toggle and can show funil and conversa.

Build, test, and lint commands are defined in `package.json` and must be run before any claim that they pass.

## 14. Publishing reality

This workspace remote is an Origin draft, not GitHub. The repository includes `.github/workflows/pages.yml` so a future GitHub repo can deploy `dist/` to GitHub Pages. Writing the workflow does not enable Pages, does not create a public repository, and does not mean a deployment ran.

Remaining steps, which this project must not perform on its own:

1. Create the exclusive public GitHub repository the user wants.
2. Push this project to that repository.
3. In GitHub, allow Actions and enable Pages from GitHub Actions.
4. Confirm `VITE_BASE_PATH` is `/` for a user/organization site, or `/<repo>/` for a project site, if relative `./` is not used.
5. Open the Pages URL GitHub prints after the first successful Action. Until that happens, the only honest preview is a local dev server.

## 15. Required source files

- `src/App.jsx`
- `src/pages/Dashboard.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/crm/KanbanBoard.jsx`
- `src/components/crm/LeadCard.jsx`
- `src/components/chat/ChatPanel.jsx`
- `src/components/chat/MessageBubble.jsx`

Supporting modules (provider, domain, sample data, placeholder page, styles, tests) exist to keep those files focused.

## 16. Self-review

- No TBD items. Temporary product name is an explicit decision, not an open question.
- Button copy, column titles, route hashes, column ids, and the two required leads are fixed strings.
- Takeover is per lead. Global assistant state does not exist.
- KPIs and the reports page read the same lead array the board mutates.
- Drag-and-drop is progressive enhancement on top of the menu.
- GitHub Pages is specified as a future configuration, not as a completed deploy.
- Placeholder screens cannot submit anywhere.
- Scope fits one implementation plan: one static React app.
