import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CircleHelp,
  Kanban,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings,
  Star,
  Users,
  X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { LEGAL_EMAIL } from '../../brand/legal'
import { isNavActive, navBlueprint, readSidebarCollapsed, writeSidebarCollapsed } from '../../domain/nav'
import { useAuth } from '../../state/useAuth'
import { useCrm } from '../../state/useCrm'
import { AlertActions } from '../alerts/AlertCenter'
import { InstagramMark, PlantaoDot, PlantaoWordmark, WhatsAppMark } from '../brand/Marks'

const ICONS = {
  inicio: LayoutDashboard,
  conversas: MessageSquare,
  leads: Kanban,
  visitas: CalendarDays,
  imoveis: Building2,
  whatsapp: WhatsAppMark,
  instagram: InstagramMark,
  equipe: Users,
  relatorios: BarChart3,
  alertas: Bell,
  avaliacoes: Star,
  ajustes: Settings,
  integracoes: Plug,
  ajuda: CircleHelp,
}

function Glyph({ id, active, className = '' }) {
  const Icon = ICONS[id]
  if (!Icon) return null
  if (id === 'whatsapp' || id === 'instagram') {
    return <Icon className={`h-4.5 w-4.5 h-[18px] w-[18px] ${className}`} />
  }
  return <Icon size={18} strokeWidth={1.75} aria-hidden="true" className={`${active ? 'text-emerald' : 'text-[#9FB6D3]'} ${className}`} />
}

function Tooltip({ label, show }) {
  if (!show) return null
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute top-1/2 left-full z-[70] ml-2.5 -translate-y-1/2 rounded-md bg-[#12345E] px-2 py-1 text-[12px] leading-none font-semibold whitespace-nowrap text-[#D6E4F5] opacity-0 shadow-[0_10px_24px_rgba(11,31,58,0.55)] ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

function itemClass(active, collapsed) {
  return `group relative flex min-w-0 w-full items-center rounded-lg text-[13px] font-medium transition-colors duration-150 ${
    collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'
  } ${active ? 'bg-emerald/10 text-white' : 'text-[#D6E4F5] hover:bg-white/5'}`
}

function CountBadge({ count, compact }) {
  if (!count) return null
  return (
    <span
      className={`grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-emerald/15 px-1 text-[10px] font-bold text-emerald ${
        compact ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'
      }`}
    >
      {count}
    </span>
  )
}

function NavItem({ item, base, pathname, collapsed, badge, onClick }) {
  const active = isNavActive(pathname, item, base)
  const content = (
    <>
      <span className={`relative grid h-7 w-7 shrink-0 place-items-center ${active && !collapsed ? '' : ''}`}>
        <Glyph id={item.id} active={active} />
        {collapsed ? <CountBadge count={badge} compact /> : null}
      </span>
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!collapsed && <CountBadge count={badge} />}
      {active && !collapsed && <span aria-hidden="true" className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald" />}
      <Tooltip label={badge ? `${item.label} (${badge})` : item.label} show={collapsed} />
    </>
  )

  if (!item.to) return null
  return (
    <NavLink to={item.to} end={item.end} onClick={onClick} aria-current={active ? 'page' : undefined} className={itemClass(active, collapsed)}>
      {content}
    </NavLink>
  )
}

function Flyout({ open, onClose, label, collapsed, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    function onPointer(event) {
      if (ref.current?.contains(event.target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={`absolute z-[80] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface p-2 text-ink shadow-[0_16px_40px_rgba(11,31,58,0.45)] ${
        collapsed ? 'top-0 left-full ml-2' : 'top-full left-0 mt-1.5 lg:top-0 lg:left-full lg:mt-0 lg:ml-2'
      }`}
    >
      {children}
    </div>
  )
}

function AlertNavItem({ collapsed, onNavigate }) {
  const crm = useCrm()
  const alerts = crm.alerts ?? []
  const [open, setOpen] = useState(false)
  const count = alerts.length

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={count ? `Alertas, ${count}` : 'Alertas'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`${itemClass(open, collapsed)} w-full`}
      >
        <span className="relative grid h-7 w-7 shrink-0 place-items-center">
          <Glyph id="alertas" active={open || count > 0} />
          {collapsed ? <CountBadge count={count} compact /> : null}
        </span>
        {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Alertas</span>}
        {!collapsed && <CountBadge count={count} />}
        <Tooltip label={count ? `Alertas (${count})` : 'Alertas'} show={collapsed} />
      </button>
      <Flyout open={open} onClose={() => setOpen(false)} label="Central de alertas" collapsed={collapsed}>
        {count === 0 ? (
          <p className="px-3 py-4 text-[13px] text-muted">Nenhum lead parado no momento.</p>
        ) : (
          <ul className="space-y-1">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-xl bg-canvas px-3 py-2.5">
                <p className="text-[13px] font-semibold">{alert.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">{alert.reason}</p>
                <AlertActions
                  leadId={alert.leadId}
                  className="mt-2"
                />
              </li>
            ))}
          </ul>
        )}
      </Flyout>
    </div>
  )
}

function HelpNavItem({ collapsed }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ajuda"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`${itemClass(open, collapsed)} w-full`}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center">
          <Glyph id="ajuda" active={open} />
        </span>
        {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Ajuda</span>}
        <Tooltip label="Ajuda" show={collapsed} />
      </button>
      <Flyout open={open} onClose={() => setOpen(false)} label="Ajuda" collapsed={collapsed}>
        <div className="px-3 py-3">
          <p className="text-[13px] font-semibold text-ink">Suporte</p>
          <a href={`mailto:${LEGAL_EMAIL}`} className="mt-1 block text-[13px] text-emerald hover:underline">
            {LEGAL_EMAIL}
          </a>
        </div>
      </Flyout>
    </div>
  )
}

function SectionList({ sections, base, pathname, collapsed, onNavigate }) {
  return sections.map((section) => (
    <div key={section.id} className={collapsed ? 'mt-2' : 'mt-3'}>
      {collapsed ? (
        <p className="mx-auto mb-1 h-px w-6 bg-white/10" aria-hidden="true" />
      ) : (
        <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.16em] text-[#9FB6D3]/80 uppercase">{section.label}</p>
      )}
      <ul className="space-y-0.5">
        {section.items.map((item) => (
          <li key={item.id}>
            {item.action === 'alerts' ? (
              <AlertNavItem collapsed={collapsed} onNavigate={onNavigate} />
            ) : (
              <NavItem item={item} base={base} pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
            )}
          </li>
        ))}
      </ul>
    </div>
  ))
}

function WorkspaceCard({ demo, collapsed, clinicName, email, onSignOut }) {
  const initial = (clinicName || 'I').trim().charAt(0).toUpperCase()
  if (collapsed) {
    return (
      <div className="group relative flex justify-center px-1 pb-1">
        <span aria-label={clinicName || 'Imobiliária'} className="grid h-8 w-8 place-items-center rounded-lg bg-[#12345E] text-[12px] font-bold text-[#D6E4F5]">
          {initial}
        </span>
        <Tooltip label={clinicName || 'Imobiliária'} show />
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-white/5 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#12345E] text-[12px] font-bold text-[#D6E4F5]">{initial}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-[#D6E4F5]">{clinicName || 'Imobiliária'}</p>
          <p className="truncate text-[11px] text-[#9FB6D3]">{demo ? 'Demonstração' : email || 'Conta'}</p>
        </div>
      </div>
      {!demo && (
        <button type="button" onClick={onSignOut} className="mt-2 h-7 w-full rounded-lg text-[11px] font-semibold tracking-[0.08em] text-[#9FB6D3] uppercase hover:bg-white/10">
          Sair
        </button>
      )}
    </div>
  )
}

export default function Sidebar({ base = '/demo', demo = true, drawerOpen = false, onOpenDrawer, onCloseDrawer }) {
  const auth = useAuth()
  const crm = useCrm()
  const location = useLocation()
  const nav = navBlueprint(base)
  const [collapsed, setCollapsed] = useState(() => readSidebarCollapsed())
  const clinicName = crm.clinic?.name || crm.profile?.display_name || ''
  const email = auth.session?.user?.email || ''

  useEffect(() => {
    onCloseDrawer?.()
  }, [location.pathname])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onCloseDrawer?.()
      if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return
      event.preventDefault()
      setCollapsed((current) => {
        const next = !current
        writeSidebarCollapsed(next)
        return next
      })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCloseDrawer])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      writeSidebarCollapsed(next)
      return next
    })
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const moreActive = nav.sections.some((section) =>
    section.items.some((item) => item.to && isNavActive(location.pathname, item, base) && !nav.mobilePrimary.some((primary) => primary.id === item.id)),
  )

  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Fechar área do menu"
          onClick={onCloseDrawer}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        aria-label="Seções do Plantão"
        className={`no-print fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-navy-950 transition-transform duration-200 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 max-w-[86vw] lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:transition-[width] ${
          collapsed ? 'lg:w-[68px]' : 'lg:w-60'
        }`}
      >
        <div className={`flex h-14 shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-3'} lg:h-[3.75rem]`}>
          <NavLink to={base} end className="group relative inline-flex items-center gap-2 overflow-visible" aria-label="Plantão">
            {collapsed ? (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#12345E]">
                  <PlantaoDot className="h-2.5 w-2.5" />
                </span>
                <Tooltip label="Plantão" show />
              </>
            ) : (
              <PlantaoWordmark className="text-[16px] text-[#D6E4F5]" />
            )}
          </NavLink>
          <button type="button" aria-label="Fechar menu" onClick={onCloseDrawer} className="grid h-8 w-8 place-items-center rounded-lg text-[#9FB6D3] hover:bg-white/10 lg:hidden">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {demo && !collapsed && (
          <div className="hidden px-3 pb-1 lg:block">
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">Demo</span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
          <SectionList sections={nav.sections} base={base} pathname={location.pathname} collapsed={collapsed} onNavigate={onCloseDrawer} />
        </div>

        <div className="shrink-0 border-t border-white/10 px-2 pt-2 pb-3">
          <ul className="space-y-0.5">
            {nav.footer.map((item) => (
              <li key={item.id}>
                {item.action === 'help' ? (
                  <HelpNavItem collapsed={collapsed} />
                ) : (
                  <NavItem item={item} base={base} pathname={location.pathname} collapsed={collapsed} onClick={onCloseDrawer} />
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <WorkspaceCard demo={demo} collapsed={collapsed} clinicName={clinicName} email={email} onSignOut={() => auth.signOut()} />
          </div>
          <button
            type="button"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
            className={`group relative mt-2 hidden w-full items-center rounded-lg text-[#9FB6D3] transition-colors hover:bg-white/5 hover:text-[#D6E4F5] lg:flex ${
              collapsed ? 'justify-center py-2' : 'gap-2.5 px-2.5 py-1.5'
            }`}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} aria-hidden="true" /> : <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden="true" />}
            {!collapsed && <span className="text-[12.5px] font-medium">Recolher</span>}
            <Tooltip label={collapsed ? 'Expandir' : 'Recolher'} show={collapsed} />
          </button>
        </div>
      </aside>

      <nav aria-label="Seções principais" className="no-print fixed inset-x-0 bottom-0 z-40 h-16 border-t border-line bg-navy-950/95 backdrop-blur-md lg:hidden">
        <ul className="grid h-full grid-cols-5 gap-0.5 px-1 py-1">
          {nav.mobilePrimary.map((item) => {
            const active = isNavActive(location.pathname, item, base)
            return (
              <li key={item.id} className="min-w-0">
                <NavLink to={item.to} end={item.end} className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 ${active ? 'text-white' : 'text-[#D6E4F5]'}`}>
                  <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-emerald/15' : ''}`}>
                    <Glyph id={item.id} active={active} />
                  </span>
                  <span className="w-full truncate text-center text-[10px] leading-3 font-semibold tracking-tight">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
          <li className="min-w-0">
            <button
              type="button"
              aria-label="Mais"
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              onClick={onOpenDrawer}
              className={`flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 ${moreActive || drawerOpen ? 'text-white' : 'text-[#D6E4F5]'}`}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${moreActive || drawerOpen ? 'bg-emerald/15' : ''}`}>
                <MoreHorizontal size={20} strokeWidth={1.75} aria-hidden="true" className={moreActive || drawerOpen ? 'text-emerald' : 'text-[#9FB6D3]'} />
              </span>
              <span className="w-full truncate text-center text-[10px] leading-3 font-semibold tracking-tight">Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}

export function MobileMenuButton({ open, onOpen }) {
  return (
    <button
      type="button"
      aria-label="Abrir menu"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onOpen}
      className="grid h-9 w-9 place-items-center rounded-lg text-[#D6E4F5] hover:bg-white/10 lg:hidden"
    >
      <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
