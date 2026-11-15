import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Kanban,
  LayoutDashboard,
  MoreHorizontal,
  Plug,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/useAuth'
import { InstagramMark, PlantaoWordmark, WhatsAppMark } from '../brand/Marks'

function primaryItems(base) {
  return [
    { to: base, end: true, label: 'Início', icon: LayoutDashboard },
    { to: `${base}/whatsapp`, label: 'WhatsApp', logo: WhatsAppMark },
    { to: `${base}/pipeline`, label: 'Pipeline', icon: Kanban },
    { to: `${base}/agenda`, label: 'Visitas', icon: CalendarDays },
  ]
}

function moreItems(base) {
  return [
    { to: `${base}/instagram`, label: 'Instagram', logo: InstagramMark },
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
    return <Logo className="h-6 w-6" />
  }
  const Icon = item.icon
  return <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={active ? 'text-emerald' : 'text-ink'} />
}

function linkClass(isActive) {
  return `flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-colors duration-150 lg:flex-row lg:gap-2.5 lg:px-2.5 lg:py-2 lg:text-left ${
    isActive ? 'bg-navy-800 text-white' : 'text-[#D6E4F5] hover:bg-white/10'
  }`
}

export default function Sidebar({ base = '/demo', demo = true }) {
  const auth = useAuth()
  const location = useLocation()
  const primary = primaryItems(base)
  const more = moreItems(base)
  const moreActive = more.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event) {
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <nav
      aria-label="Seções do Plantão"
      className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-line bg-navy-950/95 backdrop-blur-md lg:static lg:z-auto lg:flex lg:h-full lg:w-52 lg:shrink-0 lg:flex-col lg:border-t-0 lg:border-r lg:bg-navy-950"
    >
      <NavLink to={base} end className="mx-3 mt-4 hidden items-center gap-2 px-1 lg:flex" aria-label="Plantão">
        <PlantaoWordmark className="text-[17px]" />
      </NavLink>
      {demo && (
        <p className="mx-3 mt-2 hidden lg:block">
          <span className="rounded-full bg-teal-100/30 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">Demo</span>
        </p>
      )}
      <ul className="grid h-full grid-cols-5 gap-0.5 px-1 py-1 lg:mt-4 lg:flex lg:h-auto lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:px-2">
        {primary.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${isActive ? 'bg-emerald/15' : ''}`}>
                    <ItemGlyph item={item} active={isActive} />
                  </span>
                  <span className="w-full truncate text-center text-[10px] leading-3 font-semibold tracking-tight lg:text-left lg:text-[13px] lg:leading-4">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="relative min-w-0" ref={rootRef}>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls="mais-destinos"
            onClick={() => setOpen((value) => !value)}
            className={linkClass(moreActive || open) + ' w-full'}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${moreActive || open ? 'bg-emerald/15' : ''}`}>
              <MoreHorizontal size={20} strokeWidth={1.75} aria-hidden="true" className={moreActive || open ? 'text-emerald' : 'text-ink'} />
            </span>
            <span className="w-full truncate text-center text-[10px] leading-3 font-semibold tracking-tight lg:text-left lg:text-[13px] lg:leading-4">Mais</span>
          </button>
          {open && (
            <div
              id="mais-destinos"
              role="menu"
              aria-label="Mais seções"
              className="absolute right-0 bottom-full mb-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface p-1 shadow-[0_16px_40px_rgba(11,31,58,0.45)] lg:right-auto lg:bottom-auto lg:left-full lg:top-0 lg:mb-0 lg:ml-2"
            >
              {more.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold ${isActive ? 'bg-navy-800 text-white' : 'text-ink hover:bg-white/10'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="grid h-8 w-8 place-items-center">
                        <ItemGlyph item={item} active={isActive} />
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </li>
      </ul>
      <div className="hidden px-3 pb-4 lg:block">
        {!demo && (
          <button type="button" onClick={() => auth.signOut()} className="h-8 w-full rounded-xl text-[10px] font-semibold tracking-[0.14em] text-muted uppercase hover:bg-white/10">
            Sair
          </button>
        )}
      </div>
    </nav>
  )
}
