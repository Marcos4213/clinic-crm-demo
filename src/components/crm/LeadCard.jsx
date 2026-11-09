import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRightLeft } from 'lucide-react'
import { COLUMNS } from '../../domain/crm'
import { formatBrl } from '../../domain/insights'
import TemperatureMark from './TemperatureMark'

export default function LeadCard({ lead, selected, onSelect, onMove }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = `move-${lead.id}`

  useEffect(() => {
    if (!open) return undefined
    const menu = menuRef.current
    menu?.querySelector('button:not(:disabled)')?.focus()

    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
      if (!menuRef.current) return
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
      const index = items.indexOf(document.activeElement)
      if (index === -1) return
      event.preventDefault()
      const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
      items[next]?.focus()
    }

    function onPointer(event) {
      const target = event.target
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  function toggleMenu() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const menuHeight = 168
      const left = Math.min(rect.left, window.innerWidth - 228)
      const below = rect.bottom + 6
      const top = below + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 6) : below
      setCoords({ top, left: Math.max(8, left) })
    }
    setOpen((value) => !value)
  }

  return (
    <article
      ref={rootRef}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={`rounded-xl border bg-surface ${
        selected ? 'border-emerald/50 bg-teal-100/50 ring-1 ring-emerald/25' : 'border-line'
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Selecionar ${lead.name}`}
        onClick={onSelect}
        className="block w-full rounded-xl px-3 py-2.5 text-left"
      >
        <span className="flex items-center justify-between gap-2">
          <TemperatureMark temperature={lead.temperature} />
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{lead.aiActive ? 'IA' : 'Humano'}</span>
        </span>
        <span className="mt-2 block text-[13.5px] leading-5 font-semibold text-ink">{lead.name}</span>
        <span className="mt-0.5 block text-[12.5px] text-muted">{lead.procedure}</span>
        {typeof lead.value === 'number' && <span className="mt-1 block text-[12px] font-semibold text-emerald tabular-nums">{formatBrl(lead.value)}</span>}
        <span className="mt-2 block text-[12px] tracking-tight text-[#D5E0EC] tabular-nums">{lead.phone}</span>
        {lead.sample && <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">número fictício</span>}
      </button>
      <div className="flex justify-end px-2 pb-2">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Mover ${lead.name}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={toggleMenu}
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-blue-700 hover:bg-canvas"
        >
          <ArrowRightLeft size={13} strokeWidth={1.75} aria-hidden="true" />
          Mover
        </button>
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Mover ${lead.name}`}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-50 w-[212px] rounded-xl border border-line bg-surface p-1 shadow-[0_12px_40px_rgba(8,15,28,0.45)]"
          >
            {COLUMNS.map((column) => (
              <button
                key={column.id}
                type="button"
                role="menuitem"
                disabled={column.id === lead.column}
                onClick={() => {
                  onMove(column.id)
                  setOpen(false)
                }}
                className="block w-full rounded-lg px-2.5 py-2 text-left text-[12.5px] text-ink enabled:hover:bg-canvas disabled:text-[#8AA0B5]"
              >
                {column.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </article>
  )
}
