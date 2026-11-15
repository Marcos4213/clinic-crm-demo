import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { appBase } from '../../domain/lead-sheet'
import { useCrm } from '../../state/useCrm'

export default function AlertCenter({ compact = false, side = "bottom" }) {
  const crm = useCrm()
  const location = useLocation()
  const base = appBase(location.pathname)
  const alerts = crm.alerts ?? []
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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Alertas"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`relative grid place-items-center rounded-lg ${compact ? 'h-9 w-9' : 'h-9 w-9 hover:bg-white/10'}`}
      >
        <Bell size={18} strokeWidth={1.75} aria-hidden="true" className={alerts.length ? 'text-emerald' : 'text-muted'} />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald px-1 text-[10px] font-bold text-navy-950">
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Central de alertas"
          className={`z-50 rounded-2xl border border-line bg-surface p-2 shadow-[0_16px_40px_rgba(11,31,58,0.45)] ${compact ? "fixed left-3 right-3 top-14 w-auto" : side === "end" ? "absolute left-full top-0 ml-2 w-[min(22rem,calc(100vw-1.5rem))]" : "absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))]"}`}
        >
          {alerts.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-muted">Nenhum lead parado no momento.</p>
          ) : (
            <ul className="space-y-1">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-xl bg-canvas px-3 py-2.5">
                  <Link to={`${base}/leads/${alert.leadId}`} className="text-[13px] font-semibold hover:text-emerald" onClick={() => setOpen(false)}>
                    {alert.name}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-muted">{alert.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => crm.assumeLead?.(alert.leadId)} className="h-8 rounded-lg bg-emerald px-2 text-[11px] font-semibold text-navy-950">
                      Assumir
                    </button>
                    <button type="button" onClick={() => crm.assignByRoulette?.(alert.leadId)} className="h-8 rounded-lg border border-line px-2 text-[11px] font-semibold text-ink">
                      Passar pro próximo da roleta
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function AlertActions({ leadId, className = '' }) {
  const crm = useCrm()
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <button type="button" onClick={() => crm.assumeLead?.(leadId)} className="h-8 rounded-lg bg-emerald px-2 text-[11px] font-semibold text-navy-950">
        Assumir
      </button>
      <button type="button" onClick={() => crm.assignByRoulette?.(leadId)} className="h-8 rounded-lg border border-line px-2 text-[11px] font-semibold text-ink">
        Passar pro próximo da roleta
      </button>
    </div>
  )
}
