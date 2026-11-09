export default function EmptyState({ icon: Icon, title, detail, badge }) {
  return (
    <div className="surface-card px-5 py-10 text-center">
      {Icon && (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-emerald">
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      {badge && (
        <p className="mt-4 text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">{badge}</p>
      )}
      <h2 className="mt-2 text-[18px] font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-muted">{detail}</p>
    </div>
  )
}
