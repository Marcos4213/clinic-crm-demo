import { BarChart3, Bot, Kanban, Send } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', end: true, label: 'CRM', icon: Kanban },
  { to: '/disparos', label: 'Disparos em Massa', icon: Send },
  { to: '/ia', label: 'Configurações de IA', icon: Bot },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="10" y="3" width="4" height="18" rx="1" fill="#E7EEF6" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="#7DCEC8" />
    </svg>
  )
}

export default function Sidebar() {
  return (
    <nav
      aria-label="Seções do Clinic CRM"
      className="flex h-14 shrink-0 items-center gap-1 border-b border-white/10 bg-navy-950 px-3 lg:h-auto lg:w-[72px] lg:flex-col lg:border-b-0 lg:border-r lg:px-2 lg:py-3"
    >
      <NavLink
        to="/"
        end
        aria-label="Clinic CRM"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-800"
      >
        <Mark />
      </NavLink>
      <ul className="flex flex-1 items-center justify-end gap-1 lg:mt-4 lg:w-full lg:flex-col lg:justify-start">
        {ITEMS.map((item) => {
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
      <p className="mt-auto hidden text-[10px] font-semibold tracking-[0.16em] text-[#9FB0C3] uppercase lg:block">Demo</p>
    </nav>
  )
}
