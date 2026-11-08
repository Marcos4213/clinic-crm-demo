import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import AiSettings from './pages/AiSettings'
import MassDispatch from './pages/MassDispatch'
import Reports from './pages/Reports'
import { CrmProvider } from './state/CrmProvider'

export default function App() {
  return (
    <CrmProvider>
      <HashRouter>
        <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink lg:flex-row">
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-ink"
          >
            Ir para o conteúdo
          </a>
          <Sidebar />
          <main id="conteudo" className="flex min-h-0 min-w-0 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/disparos" element={<MassDispatch />} />
              <Route path="/ia" element={<AiSettings />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </CrmProvider>
  )
}
