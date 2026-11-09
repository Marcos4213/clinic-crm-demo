import {
  BarChart3,
  CalendarDays,
  Kanban,
  LayoutDashboard,
  Plug,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../state/useAuth'
import { InstagramMark, ProductMark, WhatsAppMark } from '../brand/Marks'

function itemsFor(base) {
  return [
    { to: base, end: true, label: 'Início', icon: LayoutDashboard },
    { to: `${base}/whatsapp`, label: 'WhatsApp', logo: WhatsAppMark },
    { to: `${base}/instagram`, label: 'Instagram', logo: InstagramMark },
    { to: `${base}/pipeline`, label: 'Pipeline', icon: Kanban },
    { to: `${base}/agenda`, label: 'Agenda', icon: CalendarDays },
    { to: `${base}/avaliacoes`, label: 'Avaliações', icon: Star },
    { to: `${base}/portfolio`, label: 'Portfólio', icon: Sparkles },
    { to: `${base}/metricas`, label: 'Métricas', icon: BarChart3 },
    { to: `${base}/integracoes`, label: 'Integrações', icon: Plug },
    { to: `${base}/ajustes`, label: 'Ajustes', icon: Settings },
  ]
}

function ItemGlyph({ item, active }) {
  if (item.logo) {
    const Logo = item.logo
    return <Logo className="h-7 w-7" />
  }
  const Icon = item.icon
  return <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={active ? 'text-emerald' : 'text-ink'} />
}

export default function Sidebar({ base = '/demo', demo = true }) {
  const auth = useAuth()
  const items = itemsFor(base)
  return (
    <nav
      aria-label="Seções do Automatize.app"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-navy-950/95 backdrop-blur-md lg:static lg:z-auto lg:flex lg:h-dvh lg:w-[112px] lg:shrink-0 lg:flex-col lg:border-t-0 lg:border-r lg:bg-navy-950"
    >
      <NavLink
        to={base}
        end
        className="mx-3 mt-4 hidden h-11 place-items-center rounded-2xl bg-navy-800 lg:grid"
        aria-label="Automatize.app"
      >
        <ProductMark />
      </NavLink>
      <ul className="grid grid-cols-5 gap-0.5 px-1 py-1.5 lg:mt-3 lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:px-2">
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-colors duration-150 lg:py-2 ${
                  isActive ? 'bg-navy-800 text-white' : 'text-[#D5E0EC] hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-8 place-items-center rounded-xl ${isActive ? 'bg-emerald/15' : ''}`}>
                    <ItemGlyph item={item} active={isActive} />
                  </span>
                  <span className="w-full text-center text-[10px] leading-3 font-semibold tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="hidden px-2 pb-4 lg:block">
        {demo ? (
          <p className="text-center text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">Demo</p>
        ) : (
          <button type="button" onClick={() => auth.signOut()} className="h-8 w-full rounded-xl text-[10px] font-semibold tracking-[0.14em] text-muted uppercase hover:bg-white/10">
            Sair
          </button>
        )}
      </div>
    </nav>
  )
}
