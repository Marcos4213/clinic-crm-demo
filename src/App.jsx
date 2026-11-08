import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Agenda from './pages/Agenda'
import AiSettings from './pages/AiSettings'
import { LoginScreen, SignupScreen } from './pages/AuthScreens'
import Dashboard from './pages/Dashboard'
import MassDispatch from './pages/MassDispatch'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import WhatsAppTest from './pages/WhatsApp'
import { AuthProvider } from './state/AuthProvider'
import { useAuth } from './state/useAuth'
import { CrmProvider } from './state/CrmProvider'
import { useCrm } from './state/useCrm'
import { WorkspaceProvider } from './state/WorkspaceProvider'

function Frame({ base, demo = false }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
      >
        Ir para o conteúdo
      </a>
      <Sidebar base={base} demo={demo} />
      <main id="conteudo" className="flex min-h-0 min-w-0 flex-1">
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
      <h1 className="text-[28px] font-semibold">Sua clínica</h1>
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

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/demo" element={<DemoLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="disparos" element={<MassDispatch />} />
            <Route path="ia" element={<AiSettings />} />
            <Route path="relatorios" element={<Reports />} />
          </Route>
          <Route path="/cadastro" element={<SignupScreen />} />
          <Route path="/app" element={<WorkspaceGate />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="ajustes" element={<Settings />} />
            <Route path="whatsapp" element={<WhatsAppTest />} />
          </Route>
          <Route path="/" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
