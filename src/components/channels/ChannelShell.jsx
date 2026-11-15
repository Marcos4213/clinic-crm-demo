import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function AutomationMenu({ items }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const current = items.some((item) => location.pathname === item.to)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="whatsapp-automacao"
        onClick={() => setOpen((value) => !value)}
        className={`h-9 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
          current || open ? 'bg-emerald text-navy-950' : 'bg-surface text-muted hover:text-ink'
        }`}
      >
        Automação
      </button>
      {open && (
        <div
          id="whatsapp-automacao"
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-surface p-1 shadow-[0_16px_40px_rgba(11,31,58,0.45)]"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-[13px] font-semibold ${isActive ? 'bg-navy-800 text-white' : 'text-ink hover:bg-white/10'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChannelShell({ logo, title, tabs = [], tools = [], label, children, flush = false }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {logo}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] leading-none font-extrabold tracking-tight">{title}</h1>
          </div>
          {tools.length > 0 && <AutomationMenu items={tools} />}
        </div>
        {tabs.length > 0 && (
          <nav aria-label={label} className="scroll-thin mt-3 flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `h-9 shrink-0 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
                    isActive ? 'bg-emerald text-navy-950' : 'bg-surface text-muted hover:text-ink'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <div className={`flex min-h-0 flex-1 flex-col ${flush ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
