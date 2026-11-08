import { Link } from 'react-router-dom'

export default function SectionPage({ icon: Icon, kicker, title, children }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-teal-700 uppercase">{kicker}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">{title}</h1>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-teal-700 uppercase">
            Demonstração
          </span>
        </div>
        <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_1px_rgba(16,32,51,0.04),0_10px_28px_rgba(16,32,51,0.05)]">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-canvas text-blue-700">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          {children}
        </div>
        <Link to="/" className="mt-4 inline-flex text-[13px] font-semibold text-blue-700">
          Voltar ao pipeline
        </Link>
      </div>
    </div>
  )
}
