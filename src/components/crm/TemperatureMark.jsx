const STYLES = {
  quente: { dot: 'bg-[#9A3D3D]', text: 'text-[#7A2E2E]', bg: 'bg-[#F8E8E6]' },
  morno: { dot: 'bg-[#8A5A12]', text: 'text-[#6E4810]', bg: 'bg-[#F8F1E3]' },
  frio: { dot: 'bg-[#1E4E89]', text: 'text-[#1E4E89]', bg: 'bg-[#E7F0F8]' },
}

const LABELS = { quente: 'Quente', morno: 'Morno', frio: 'Frio' }

export default function TemperatureMark({ temperature }) {
  const style = STYLES[temperature] ?? STYLES.frio
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {LABELS[temperature] ?? temperature}
    </span>
  )
}
