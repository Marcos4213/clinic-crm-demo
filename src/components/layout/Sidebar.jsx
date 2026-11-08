import { BarChart3, Bot, CalendarDays, Kanban, Send, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../state/useAuth'

function itemsFor(base, demo) {
  const items = [
    { to: base, end: true, label: 'CRM', icon: Kanban },
    { to: `${base}/agenda`, label: 'Agenda', icon: CalendarDays },
  ]
  if (demo) {
    items.push(
      { to: `${base}/disparos`, label: 'Disparos em Massa', icon: Send },
      { to: `${base}/ia`, label: 'Configurações de IA', icon: Bot },
    )
  }
  items.push({ to: `${base}/relatorios`, label: 'Relatórios', icon: BarChart3 })
  if (!demo) items.push({ to: `${base}/ajustes`, label: 'Ajustes', icon: Settings })
  return items
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="10" y="3" width="4" height="18" rx="1" fill="#E7EEF6" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="#7DCEC8" />
    </svg>
  )
}

export default function Sidebar({ base = '/demo', demo = true }) {
  const auth = useAuth()
  const items = itemsFor(base, demo)
  return (
    <nav
      aria-label="Seções do Convertize"
      className="flex h-14 shrink-0 items-center gap-1 border-b border-white/10 bg-navy-950 px-3 lg:h-auto lg:w-[72px] lg:flex-col lg:border-b-0 lg:border-r lg:px-2 lg:py-3"
    >
      <NavLink
        to={base}
        end
        aria-label="Convertize"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-800"
      >
        <Mark />
      </NavLink>
      <ul className="flex flex-1 items-center justify-end gap-1 lg:mt-4 lg:w-full lg:flex-col lg:justify-start">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to} className="lg:w-full">
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  `group relative grid h-10 w-10 place-items-center rounded-xl text-[#D5E0EC] transition-colors duration-150 lg:w-full ${
                    isActive
                      ? 'bg-navy-800 text-white shadow-[inset_0_-2px_0_#7DCEC8] lg:shadow-[inset_2px_0_0_#7DCEC8]'
                      : 'hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-md bg-navy-900 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 lg:top-1/2 lg:left-full lg:mt-0 lg:ml-2 lg:-translate-y-1/2 lg:translate-x-0"
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
      {demo ? (
        <p className="mt-auto hidden text-[10px] font-semibold tracking-[0.16em] text-muted uppercase lg:block">Demo</p>
      ) : (
        <button type="button" onClick={() => auth.signOut()} className="mt-auto hidden text-[10px] font-semibold tracking-[0.16em] text-muted uppercase lg:block">
          Sair
        </button>
      )}
    </nav>
  )
}
