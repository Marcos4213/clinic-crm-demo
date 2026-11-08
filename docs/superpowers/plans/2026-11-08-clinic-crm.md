# Clinic CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, tested, pt-BR Clinic CRM demo with a three-pane pipeline, per-lead assistant takeover, and GitHub Pages-compatible build — without connecting WhatsApp, Supabase, or any real patient data.

**Architecture:** Vite React JSX renders a `HashRouter` shell. A single in-memory provider holds leads, selection, filters, and drafts. Pure functions in `src/domain/crm.js` own filter, count, move, takeover, and send rules so the UI cannot invent a second meaning for those actions. Placeholder routes are real screens with disabled external actions.

**Tech Stack:** Vite, React 18 JSX, Tailwind CSS v4, React Router (`HashRouter`), lucide-react, Instrument Sans (fontsource), Vitest, Testing Library, ESLint.

**Execution:** The user already approved the spec and explicitly ordered implementation in this session, with no halt for another design review. Execute inline. Do not open a second repository or a GitHub mirror.

## Global Constraints

- UI copy is pt-BR. Product name is exactly `Clinic CRM`.
- Column titles, in order: `Em Atendimento (IA)`, `Qualificados`, `Agendados`, `Fechados`.
- AI-active header button text is exactly `Assumir Atendimento (Pausar IA)`. Human-control button text is exactly `Reativar IA`.
- Required seeds: Maria Silva / Botox / `+55 00 90000-0101`; João Pedro / Implante Capilar / `+55 00 90000-0105`.
- No network calls, no credentials, no Supabase, no real messaging.
- Hash routes only. Default Vite `base` is `./`, overridable by `VITE_BASE_PATH`.
- Icons from lucide-react only.
- KPIs and Relatórios count the in-memory lead array only.
- Takeover, drafts, and transcripts are per lead.
- Composer stays disabled until that lead is under human control.
- Trim sends; reject blank; Enter sends; Shift+Enter inserts a newline.
- Demo status is visible. Receipt ticks are labelled demonstração.
- Compact layout at `max-width: 1023px` toggles funil and conversa. Wider viewports show rail, board, and chat together, with internal board scroll.
- Do not claim GitHub Pages is live.

---

### Task 1: Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/index.css`, `.gitignore`
- Modify: `README.md` (rewritten in Task 9)

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm run lint`, `npm run build`, `npm run dev`

- [ ] **Step 1:** Scaffold with `npm create vite@latest tmp-scaffold -- --template react`, move it to the repo root, and remove the template demo component.
- [ ] **Step 2:** Add Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`), `react-router-dom`, `lucide-react`, `@fontsource-variable/instrument-sans`, Vitest, jsdom, Testing Library, user-event, and ESLint.
- [ ] **Step 3:** Set `base: process.env.VITE_BASE_PATH || './'`. Point tests at jsdom and `src/test/setup.js`.
- [ ] **Step 4:** Set `index.html` `lang="pt-BR"` and title `Clinic CRM — Demonstração`.
- [ ] **Step 5:** Commit the scaffold only after `npm test` runs (no tests yet is acceptable) and `npm run build` exits 0.

### Task 2: Domain rules

**Files:**
- Create: `src/domain/crm.js`, `src/domain/crm.test.js`
- Test: `src/domain/crm.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:

```js
export const COLUMNS = [
  { id: 'em-atendimento', label: 'Em Atendimento (IA)' },
  { id: 'qualificados', label: 'Qualificados' },
  { id: 'agendados', label: 'Agendados' },
  { id: 'fechados', label: 'Fechados' },
]

export function normalize(value) // trim, lower case, strip accents
export function filterLeads(leads, { query, temperature })
export function countByColumn(leads) // { 'em-atendimento': number, ... }
export function moveLead(leads, leadId, columnId)
export function setAiActive(leads, leadId, aiActive)
export function sendHumanMessage(leads, leadId, text, { id, at })
```

`filterLeads` matches name, phone, and procedure. `temperature` of `todos` or `''` does not filter. `moveLead` returns the same array reference contents with one lead's `column` changed; unknown ids throw. `sendHumanMessage` trims and returns the original array when the trim is empty; otherwise appends `{ id, role: 'humano', text: trimmed, at, receipt: 'delivered', localDemo: true }`.

- [ ] **Step 1: Write the failing test**

Cover accent-insensitive `botox` / `João`, temperature AND query, column counts, move, blank send, and trimmed send.

- [ ] **Step 2: Run** `npx vitest run src/domain/crm.test.js` and confirm failure because the module does not exist.
- [ ] **Step 3: Implement** the functions above with no UI.
- [ ] **Step 4: Re-run** the same command and confirm pass.
- [ ] **Step 5: Commit** `feat: add CRM lead rules`

### Task 3: Sample leads and provider

**Files:**
- Create: `src/data/sampleLeads.js`, `src/state/CrmProvider.jsx`
- Test: provider behavior is covered through `src/App.test.jsx` in later tasks

**Interfaces:**
- Consumes: `moveLead`, `setAiActive`, `sendHumanMessage`, `filterLeads`, `countByColumn`
- Produces: `useCrm()` value:

```text
{
  leads, visibleLeads, counts, selected, selectedId,
  query, setQuery, temperature, setTemperature,
  draft, setDraft,
  selectLead, moveLeadTo, toggleTakeover, sendCurrent
}
```

`toggleTakeover` flips only `selectedId` unless an id is passed. `sendCurrent` reads that lead's draft. `draft` is the selected lead's draft string. Initial selection is `maria`.

Sample file exports `sampleLeads`, twelve leads, Maria and João Pedro exactly as specified. Other leads spread across every column and temperature. At least three leads start with `aiActive: false`. Message timestamps are fixed ISO strings on 2026-11-08. Phones are `+55 00 90000-01xx`.

- [ ] **Step 1:** Add the data module and provider.
- [ ] **Step 2:** Commit `feat: seed fictional clinic leads`.

### Task 4: Shell, sidebar, placeholder routes

**Files:**
- Create: `src/App.jsx`, `src/components/layout/Sidebar.jsx`, `src/pages/SectionPage.jsx`, `src/pages/Dashboard.jsx` (stub until Task 5)
- Modify: `src/main.jsx`
- Test: `src/App.test.jsx` route assertions added in Task 8

**Interfaces:**
- Consumes: `useCrm` not required for navigation
- Produces: routes `#/`, `#/disparos`, `#/ia`, `#/relatorios`

Sidebar items use lucide icons `Kanban`, `Send`, `Bot`, `BarChart3`. Tooltip and `aria-current` follow the spec. Placeholder pages use the exact disabled control `Envio desativado — sem integração` on Disparos, and the reports page renders counts via `useCrm().leads` through `countByColumn`. Each placeholder includes `Voltar ao pipeline`.

- [ ] **Step 1:** Implement the frame, skip link, and four routes.
- [ ] **Step 2:** Commit `feat: add hash routes and sidebar`.

### Task 5: Board, cards, filter, move

**Files:**
- Create: `src/components/crm/KanbanBoard.jsx`, `src/components/crm/LeadCard.jsx`, `src/components/crm/PipelineHeader.jsx`
- Modify: `src/pages/Dashboard.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: `useCrm()`
- Produces: regions named with the four exact column labels; button `Mover Maria Silva`; search `Buscar leads`

`LeadCard` exposes a menu of the four labels and is draggable. Each column accepts a drop, calls `moveLeadTo`, and the board's live region announces `{nome} agora está em {coluna}`. Tests drive the menu, not drag-and-drop. `PipelineHeader` shows the `Demonstração` badge, the fictional-data sentence, search, temperature radios or tabs, and four sample counts. Dashboard lays the header, board, and chat in a column/row that is `h-dvh` / `min-h-0` with `overflow-hidden` on the page and `overflow-auto` on the board.

- [ ] **Step 1: Write failing UI tests** for selection of Maria vs João, move Maria to Qualificados, count text change, and a Botox search that hides João.
- [ ] **Step 2: Run** `npx vitest run src/App.test.jsx` and confirm the new tests fail.
- [ ] **Step 3: Implement** header, board, and cards against those tests.
- [ ] **Step 4: Re-run** and confirm pass.
- [ ] **Step 5: Commit** `feat: add pipeline board`.

### Task 6: Conversation, takeover, composer

**Files:**
- Create: `src/components/chat/ChatPanel.jsx`, `src/components/chat/MessageBubble.jsx`
- Modify: `src/pages/Dashboard.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: `selected`, `draft`, `setDraft`, `toggleTakeover`, `sendCurrent`
- Produces: button names from the spec; textbox `Mensagem para Maria Silva`; button `Enviar mensagem local`

`MessageBubble` prints the role label `IA`, `Cliente`, or `Humano`, the timestamp with `Intl.DateTimeFormat('pt-BR', ...)`, and the demo receipt name when `receipt` is set.

- [ ] **Step 1: Write failing tests** for per-lead takeover, disabled then enabled composer, whitespace rejection, Enter send, and transcript survival across João and back.
- [ ] **Step 2: Run the tests and confirm failure.**
- [ ] **Step 3: Implement** the panel and bubbles.
- [ ] **Step 4: Re-run and confirm pass.**
- [ ] **Step 5: Commit** `feat: add local conversation controls`.

### Task 7: Responsive pane toggle

**Files:**
- Create: `src/hooks/useCompactViewport.js`
- Modify: `src/App.jsx`, `src/pages/Dashboard.jsx`, `src/components/chat/ChatPanel.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: `window.matchMedia('(max-width: 1023px)')`
- Produces: buttons `Mostrar funil` and `Mostrar conversa` only when compact

Selecting a lead while compact switches the visible pane to the conversation. `Voltar ao funil` switches back.

- [ ] **Step 1: Write a failing test** that mocks `matchMedia` to match, checks that the conversation is hidden until `Mostrar conversa`, and that selecting Maria reveals her header.
- [ ] **Step 2: Implement** conditional rendering, not CSS-only hiding, so the inactive pane is unmounted.
- [ ] **Step 3: Confirm the desktop test still finds board and chat together when `matchMedia` does not match.**
- [ ] **Step 4: Commit** `feat: toggle board and chat on compact screens`.

### Task 8: Visual finish and placeholder honesty

**Files:**
- Modify: `src/index.css`, components from Tasks 4–7
- Test: existing tests still pass

- [ ] **Step 1:** Apply the spec tokens, sidebar tooltips, card selection rail, chat bubbles, and focus rings.
- [ ] **Step 2:** Read every placeholder and the chat caption. Remove any copy that implies a live integration.
- [ ] **Step 3: Run** `npx vitest run` and confirm the full file stays green.
- [ ] **Step 4: Commit** `feat: refine clinic CRM interface`.

### Task 9: README, workflow, verification

**Files:**
- Modify: `README.md`
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1:** Document Node 22, `npm install`, `npm run dev`, `npm test`, `npm run lint`, `npm run build`, and `npm run preview`.
- [ ] **Step 2:** Document hash routing, relative base, `VITE_BASE_PATH`, and the five remaining GitHub steps from spec section 14. State that this Origin draft has not published GitHub or Pages.
- [ ] **Step 3:** Add a Pages workflow that runs `npm ci`, `npm test`, and `npm run build`, then uploads `dist/` with `actions/deploy-pages`. It must not be described as already executed.
- [ ] **Step 4:** Run `npm test`, `npm run lint`, and `npm run build`. Record real exit codes. Fix failures before claiming success.
- [ ] **Step 5:** Start the dev server on `127.0.0.1:43123` and smoke-test desktop, laptop, and mobile widths.
- [ ] **Step 6: Commit and push** the finished branch to the existing Origin remote only.

## Self-review

- Spec section 4 routes map to Task 4. Column titles and seeds map to Tasks 2–5. Takeover and composer map to Task 6. Responsive map to Task 7. Visual and accessibility map to Task 8. Pages honesty maps to Task 9.
- No task uses a different function name than Task 2's interface.
- Drag-and-drop is specified in the spec as enhancement inside Task 5's card and column handlers; tests do not depend on it.
- Reports and KPIs both call `countByColumn` on provider state.
- No step says TBD. UI steps name the exact accessible strings tests will query.
