import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { appBase } from '../domain/lead-sheet'
import { activeBrokers } from '../domain/roulette'
import { useCrm } from '../state/useCrm'

export default function Equipe() {
  const crm = useCrm()
  const location = useLocation()
  const base = appBase(location.pathname)
  const demo = crm.mode === 'demo'
  const brokers = [...(crm.brokers || [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt-BR'))
  const next = crm.nextBroker
  const active = activeBrokers(brokers)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-24">
        <header>
          <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">Equipe</h1>
          <p className="mt-1 text-[13px] text-muted">Corretores no plantão e ordem da roleta.</p>
        </header>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Próximo da vez</h2>
          {next ? (
            <p className="mt-2 text-[20px] font-extrabold tracking-tight text-emerald">{next.name}</p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">Nenhum corretor ativo na roleta.</p>
          )}
          {active.length > 0 && (
            <p className="mt-1 text-[12px] text-muted">
              {active.length} {active.length === 1 ? 'corretor ativo' : 'corretores ativos'}. Lead quente cai no corretor da vez.
            </p>
          )}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Corretores</h2>
          {brokers.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">A equipe entra quando o cadastro de corretores estiver no ar.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {brokers.map((broker, index) => {
                const isNext = next?.id === broker.id
                return (
                  <li
                    key={broker.id}
                    className={`rounded-2xl px-3 py-3 ${isNext ? 'bg-emerald/10 ring-1 ring-emerald/40' : 'bg-canvas'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">
                          <span className="mr-2 text-muted tabular-nums">{index + 1}</span>
                          {broker.name}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-emerald">
                          {broker.active ? (isNext ? 'Ativo · próximo da vez' : 'Ativo') : 'Pausado'}
                        </p>
                      </div>
                      {demo && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Subir ${broker.name}`}
                            disabled={index === 0}
                            onClick={() => crm.moveBroker(broker.id, -1)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Descer ${broker.name}`}
                            disabled={index === brokers.length - 1}
                            onClick={() => crm.moveBroker(broker.id, 1)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronDown size={16} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                    {demo && (
                      <button
                        type="button"
                        onClick={() => crm.setBrokerActive(broker.id, !broker.active)}
                        className={`mt-3 h-9 w-full rounded-lg px-3 text-[12.5px] font-semibold sm:w-auto ${
                          broker.active
                            ? 'border border-line bg-surface text-ink'
                            : 'bg-emerald text-navy-950'
                        }`}
                      >
                        {broker.active ? 'Pausar' : 'Reativar'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <p className="text-[12px] text-muted">
          <Link to={`${base}/ajustes`} className="font-semibold text-emerald">
            Ajustes
          </Link>
        </p>
      </div>
    </div>
  )
}
