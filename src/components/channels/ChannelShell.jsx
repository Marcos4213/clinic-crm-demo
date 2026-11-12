import { NavLink } from 'react-router-dom'
import { useCrm } from '../../state/useCrm'

export default function ChannelShell({ logo, kicker, title, tabs, label, children }) {
  const crm = useCrm()
  const demo = crm.mode !== 'workspace'
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {logo}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">{kicker}</p>
            <h1 className="text-[26px] leading-none font-semibold tracking-tight">{title}</h1>
          </div>
          {demo && (
            <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">
              Demonstração
            </span>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-[13px] leading-5 text-muted">
          {demo
            ? 'Esta área é só deste canal, com dados fictícios. Nada é publicado e nada sai daqui.'
            : 'Esta área mostra só o que já está ligado neste canal.'}
        </p>
        <nav aria-label={label} className="scroll-thin mt-4 flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `h-9 shrink-0 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
                  isActive ? 'bg-emerald text-[#080F1C]' : 'bg-surface text-muted hover:text-ink'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
