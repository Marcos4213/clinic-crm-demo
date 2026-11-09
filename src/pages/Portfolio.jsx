import { Sparkles } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { demoPortfolio } from '../data/demo-catalog'
import { formatBrl } from '../domain/insights'
import { useCrm } from '../state/useCrm'

export default function Portfolio() {
  const demo = useCrm().mode !== 'workspace'
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">{demo ? 'Demonstração · vitrine da clínica' : 'Vitrine da clínica'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-[32px] font-semibold tracking-tight">Portfólio</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald uppercase">
              <Sparkles size={12} aria-hidden="true" />
              A IA aprende com este portfólio
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
            Preços e ofertas que a clínica quer apresentar. A resposta automática continua desligada. O selo marca o material que a IA passa a usar na implantação.
          </p>
        </header>
        {demo ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {demoPortfolio.map((item) => (
              <li key={item.id} className="surface-card p-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{item.kind}</p>
                <h2 className="mt-1 text-[18px] font-semibold">{item.name}</h2>
                <p className="mt-2 text-[22px] font-semibold text-emerald tabular-nums">{formatBrl(item.price)}</p>
                <p className="mt-2 text-[13px] leading-5 text-muted">{item.offer}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Sparkles}
            badge="Ativado na implantação"
            title="A vitrine ainda não foi cadastrada"
            detail="Produtos, serviços e ofertas da clínica entram aqui. Nenhum preço foi inventado para esta conta."
          />
        )}
      </div>
    </div>
  )
}
