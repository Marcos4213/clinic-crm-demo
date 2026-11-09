import { reportFromWorkspace } from '../../supabase/functions/_shared/schedule.js'
import { CHANNEL_LABEL, demoReviews } from '../data/demo-catalog'
import { COLUMNS } from '../domain/crm'
import {
  asReportLeads,
  averageResponseMinutes,
  conversionByChannel,
  csvFromRows,
  formatBrl,
  formatResponse,
  metricsRows,
  pipelineEstimate,
} from '../domain/insights'
import { demoInstagramThreads, demoWhatsappThreads } from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'
import EmptyState from '../components/ui/EmptyState'

function downloadCsv(filename, rows) {
  const blob = new Blob([csvFromRows(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function Metrics() {
  const crm = useCrm()
  const demo = crm.mode !== 'workspace'
  const leads = asReportLeads(crm.leads)
  const report = reportFromWorkspace({ leads, appointments: crm.appointments ?? [], stageEvents: crm.stageEvents ?? [] })
  const estimate = pipelineEstimate(crm.leads)
  const channels = conversionByChannel(crm.leads)
  const response = averageResponseMinutes(demo ? [...demoWhatsappThreads, ...demoInstagramThreads] : crm.leads)
  const maxStage = Math.max(1, ...COLUMNS.map((column) => report.stageCounts[column.id] ?? 0))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">
              {demo ? 'Demonstração · calculado da amostra' : 'Números desta clínica'}
            </p>
            <h1 className="mt-2 text-[32px] leading-none font-semibold tracking-tight">Métricas</h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              {demo
                ? 'Tudo abaixo sai dos leads, da agenda e das conversas fictícias. Sem receita de caixa e sem ROI.'
                : 'Tudo abaixo sai dos registros desta clínica. O que ainda não existe não é preenchido.'}
            </p>
          </div>
          <div className="no-print flex gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(demo ? 'automatize-amostra.csv' : 'automatize-clinica.csv', metricsRows({
                leads: crm.leads,
                appointments: crm.appointments ?? [],
                stageCounts: report.stageCounts,
                responseMinutes: response,
              }))}
              className="h-10 rounded-xl border border-line px-3 text-[13px] font-semibold"
            >
              Exportar CSV
            </button>
            <button type="button" onClick={() => window.print()} className="h-10 rounded-xl bg-emerald px-3 text-[13px] font-semibold text-[#080F1C]">
              Exportar PDF ou imprimir
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-2">
          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Funil</h2>
            <ul className="mt-4 space-y-3">
              {COLUMNS.map((column) => {
                const count = report.stageCounts[column.id] ?? 0
                return (
                  <li key={column.id}>
                    <div className="flex justify-between text-[13px]">
                      <span>{column.label}</span>
                      <span className="font-semibold tabular-nums">
                        {count}
                        {estimate.priced > 0 ? ` · ${formatBrl(estimate.byStage[column.id])}` : ''}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-canvas">
                      <div className="h-2 rounded-full bg-emerald" style={{ width: `${(count / maxStage) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </article>

          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Conversões por canal</h2>
            {channels.length === 0 ? (
              <div className="mt-4">
                <EmptyState badge="Ativado na implantação" title="Canais ainda sem origem" detail="Quando WhatsApp e Instagram estiverem ligados, a conversão de cada um aparece aqui." />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {channels.map((row) => (
                  <li key={row.channel} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-3">
                    <span className="text-[14px] font-semibold">{CHANNEL_LABEL[row.channel] ?? row.channel}</span>
                    <span className="text-[13px] text-muted tabular-nums">{row.won} de {row.total} fechados</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Tempo de resposta</h2>
            <p className="mt-3 text-[28px] font-semibold tabular-nums">{formatResponse(response) ?? 'Sem mensagens para medir'}</p>
            <p className="mt-2 text-[13px] text-muted">Média entre a fala da pessoa e a próxima resposta da equipe ou da amostra.</p>
          </article>

          <article className="surface-card p-4">
            <h2 className="text-[16px] font-semibold">Agendamentos</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['scheduled', 'Agendados'],
                ['attended', 'Compareceram'],
                ['no_show', 'Faltaram'],
                ['canceled', 'Cancelados'],
              ].map(([id, label]) => (
                <div key={id} className="rounded-xl bg-canvas px-3 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{label}</dt>
                  <dd className="mt-1 text-[22px] font-semibold tabular-nums">{report.appointmentCounts[id]}</dd>
                </div>
              ))}
            </dl>
          </article>
        </section>

        <article className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Avaliações</h2>
          {demo ? (
            <p className="mt-3 text-[14px] leading-6 text-muted">
              {demoReviews.length} depoimentos ilustrativos no Google. Eles não são avaliações publicadas e não entram como nota real.
            </p>
          ) : (
            <div className="mt-4">
              <EmptyState badge="Ativado na implantação" title="Avaliações ainda não entram no painel" detail="A nota do Google e os pedidos depois da consulta aparecem aqui quando o módulo for ligado." />
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
