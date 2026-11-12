import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ProductMark } from './components/brand/Marks'
import Sidebar from './components/layout/Sidebar'
import Agenda from './pages/Agenda'
import { InstagramDirect, InstagramLayout } from './pages/InstagramDesk'
import Home from './pages/Home'
import Integrations from './pages/Integrations'
import Metrics from './pages/Metrics'
import Pipeline from './pages/Pipeline'
import Portfolio from './pages/Portfolio'
import Reviews from './pages/Reviews'
import { AutoReplyPane, CommentPane, DirectComposePane, FollowUpPane, MassPane, RemarketingPane, SchedulePane } from './pages/channel-panes'
import { LoginScreen, SignupScreen } from './pages/AuthScreens'
import { DemoSettings, default as Settings } from './pages/Settings'
import { WhatsAppConversations, WhatsAppLayout } from './pages/WhatsAppDesk'
import { AuthProvider } from './state/AuthProvider'
import { useAuth } from './state/useAuth'
import { CrmProvider } from './state/CrmProvider'
import { useCrm } from './state/useCrm'
import { WorkspaceProvider } from './state/WorkspaceProvider'

function Frame({ base, demo = false }) {
  const auth = useAuth()
  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
      >
        Ir para o conteúdo
      </a>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 lg:hidden">
        <span className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-navy-800">
            <ProductMark className="h-4 w-4" />
          </span>
          Automatize.app
        </span>
        {demo ? (
          <span className="text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">Demonstração</span>
        ) : (
          <button type="button" onClick={() => auth.signOut()} className="text-[12px] font-semibold text-muted">
            Sair
          </button>
        )}
      </header>
      <Sidebar base={base} demo={demo} />
      <main id="conteudo" className="flex min-h-0 min-w-0 flex-1 pb-[132px] lg:pb-0">
        <Outlet />
      </main>
    </div>
  )
}

function DemoLayout() {
  return (
    <CrmProvider>
      <Frame base="/demo" demo />
    </CrmProvider>
  )
}

function WorkspaceGate() {
  const auth = useAuth()
  if (!auth.ready) return <p className="p-6 text-muted">Carregando sessão…</p>
  if (!auth.session || !auth.client) return <Navigate to="/" replace />
  return (
    <WorkspaceProvider client={auth.client}>
      <WorkspaceBody />
    </WorkspaceProvider>
  )
}

function WorkspaceBody() {
  const crm = useCrm()
  if (crm.phase === 'loading') return <p className="p-6 text-muted">Carregando clínica…</p>
  if (crm.phase === 'schema') {
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="text-[24px] font-semibold">Esquema protegido ausente</h1>
        <p className="mt-2 text-[14px] leading-6 text-muted">
          A sessão existe, mas as tabelas com RLS ainda não estão aplicadas. Nenhum dado de clínica foi gravado.
        </p>
        <a href="#/demo" className="mt-4 inline-flex text-[13px] font-semibold text-emerald">
          Abrir demonstração local
        </a>
      </main>
    )
  }
  if (crm.phase === 'onboarding') return <Onboarding />
  if (crm.phase !== 'ready') {
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="text-[24px] font-semibold">Clínica indisponível</h1>
        <p className="mt-2 text-[14px] text-muted">{crm.notice || 'Não foi possível abrir o espaço.'}</p>
      </main>
    )
  }
  return <Frame base="/app" />
}

function Onboarding() {
  const crm = useCrm()
  function onSubmit(event) {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('clinic')
    crm.bootstrap(String(name ?? ''))
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald uppercase">Automatize.app</p>
      <h1 className="mt-2 text-[28px] font-semibold">Sua clínica</h1>
      <p className="mt-2 text-[13px] leading-5 text-muted">Cria um espaço privado para esta conta. Não entra em outra clínica.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-[12px] font-semibold text-muted" htmlFor="clinic-name">
          Nome da clínica
          <input id="clinic-name" name="clinic" required minLength={2} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink" />
        </label>
        <button type="submit" className="h-10 w-full rounded-lg bg-emerald text-[13px] font-semibold text-[#080F1C]">
          Criar espaço
        </button>
      </form>
      {crm.notice && <p className="mt-3 text-[13px] text-muted">{crm.notice}</p>}
    </main>
  )
}

function workspaceRoutes(prefix) {
  return (
    <>
      <Route index element={<Home />} />
      <Route path="whatsapp" element={<WhatsAppLayout />}>
        <Route index element={<WhatsAppConversations />} />
        <Route path="disparos" element={<MassPane />} />
        <Route path="agendamento" element={<SchedulePane channel="whatsapp" />} />
        <Route path="follow-up" element={<FollowUpPane />} />
        <Route path="remarketing" element={<RemarketingPane />} />
        <Route path="respostas" element={<AutoReplyPane />} />
      </Route>
      <Route path="instagram" element={<InstagramLayout />}>
        <Route index element={<InstagramDirect />} />
        <Route path="comentarios" element={<CommentPane />} />
        <Route path="direct" element={<DirectComposePane />} />
        <Route path="agendamento" element={<SchedulePane channel="instagram" />} />
      </Route>
      <Route path="pipeline" element={<Pipeline />} />
      <Route path="agenda" element={<Agenda />} />
      <Route path="avaliacoes" element={<Reviews />} />
      <Route path="portfolio" element={<Portfolio />} />
      <Route path="metricas" element={<Metrics />} />
      <Route path="integracoes" element={<Integrations />} />
      <Route path="ajustes" element={prefix === 'demo' ? <DemoSettings /> : <Settings />} />
      <Route path="relatorios" element={<Navigate to={`/${prefix}/metricas`} replace />} />
      <Route path="disparos" element={<Navigate to={`/${prefix}/whatsapp/disparos`} replace />} />
      <Route path="ia" element={<Navigate to={`/${prefix}/ajustes`} replace />} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/demo" element={<DemoLayout />}>
            {workspaceRoutes('demo')}
          </Route>
          <Route path="/cadastro" element={<SignupScreen />} />
          <Route path="/app" element={<WorkspaceGate />}>
            {workspaceRoutes('app')}
          </Route>
          <Route path="/" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
