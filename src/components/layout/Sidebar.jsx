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
      aria-label="Seções do Automatize.app"
      className="flex h-14 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 bg-navy-950 px-3 lg:h-auto lg:w-56 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-3 lg:py-4"
    >
      <NavLink
        to={base}
        end
        aria-label="Automatize.app"
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
                  `group relative flex h-10 items-center gap-2 rounded-xl px-2 text-[#D5E0EC] transition-colors duration-150 ${
                    isActive
                      ? 'bg-navy-800 text-white shadow-[inset_0_-2px_0_#7DCEC8] lg:shadow-[inset_2px_0_0_#7DCEC8]'
                      : 'hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="text-[12px] font-medium whitespace-nowrap">{item.label}</span>
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
