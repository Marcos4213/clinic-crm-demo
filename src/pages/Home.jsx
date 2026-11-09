import { useState } from 'react'
import { Link } from 'react-router-dom'
import { reportFromWorkspace } from '../../supabase/functions/_shared/schedule.js'
import { demoInstagramThreads, demoReviews, demoWhatsappThreads } from '../data/demo-catalog'
import { columnLabel } from '../domain/crm'
import {
  appointmentsOnDate,
  asReportLeads,
  averageResponseMinutes,
  formatBrl,
  formatResponse,
  followUpTasks,
  pendingThreads,
  pipelineEstimate,
} from '../domain/insights'
import { useCrm } from '../state/useCrm'

function Stat({ label, value, detail }) {
  return (
    <article className="surface-card px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-2 text-[24px] leading-tight font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-muted">{detail}</p>
    </article>
  )
}

function Queue({ title, threads, to, empty }) {
  const waiting = pendingThreads(threads)
  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        <Link to={to} className="text-[12px] font-semibold text-emerald">
          Abrir canal
        </Link>
      </div>
      {waiting.length === 0 ? (
        <p className="mt-3 text-[13px] leading-5 text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {waiting.map((thread) => (
            <li key={thread.id} className="rounded-xl bg-canvas px-3 py-2">
              <p className="text-[13px] font-semibold">{thread.name}</p>
              <p className="text-[12px] text-muted">{thread.procedure} · aguardando resposta</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Home() {
  const crm = useCrm()
  const demo = crm.mode !== 'workspace'
  const [preview, setPreview] = useState('owner')
  const persona = demo ? preview : crm.role === 'owner' ? 'owner' : 'staff'
  const leads = asReportLeads(crm.leads)
  const report = reportFromWorkspace({ leads, appointments: crm.appointments ?? [], stageEvents: crm.stageEvents ?? [] })
  const estimate = pipelineEstimate(crm.leads)
  const responseSource = demo ? [...demoWhatsappThreads, ...demoInstagramThreads] : crm.leads
  const response = formatResponse(averageResponseMinutes(responseSource))
  const today = appointmentsOnDate(crm.appointments ?? [])
  const tasks = followUpTasks(crm.leads, crm.appointments ?? [])
  const whatsappThreads = demo ? demoWhatsappThreads : []
  const instagramThreads = demo ? demoInstagramThreads : []
  const clinicName = crm.clinic?.name || crm.settings?.display_name || 'sua clínica'
  const moneyReady = estimate.priced > 0

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">
              {demo ? 'Demonstração · dados fictícios' : 'Painel de hoje'}
            </p>
            <h1 className="mt-2 text-[32px] leading-none font-semibold tracking-tight">
              {persona === 'owner' ? `Resultado de ${clinicName}` : `Fila de ${clinicName}`}
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-muted">
              {persona === 'owner'
                ? 'O que já avançou, o que está em aberto e o que pede atenção hoje.'
                : 'Conversas que esperam alguém, consultas de hoje e retornos combinados.'}
            </p>
          </div>
          {demo && (
            <div role="radiogroup" aria-label="Visão da demonstração" className="inline-flex rounded-full border border-line bg-surface p-1">
              {[
                ['owner', 'Visão do dono'],
                ['staff', 'Visão da atendente'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={persona === id}
                  onClick={() => setPreview(id)}
                  className={`h-9 rounded-full px-3 text-[12px] font-semibold ${persona === id ? 'bg-emerald text-[#080F1C]' : 'text-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>

        {persona === 'owner' ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Receita estimada do pipeline"
                value={moneyReady ? formatBrl(estimate.open) : 'Ativado na implantação'}
                detail={moneyReady ? 'Soma dos interesses ainda abertos. Não é caixa recebido.' : 'A clínica ainda não tem valores nas oportunidades.'}
              />
              <Stat
                label="Conversões"
                value={`${report.stageCounts.fechados}/${report.leadCount}`}
                detail={
                  moneyReady
                    ? `${formatBrl(estimate.won)} em interesses já marcados como fechados.`
                    : demo
                      ? 'Fechados nesta amostra, calculados do pipeline.'
                      : 'Fechados registrados nesta clínica.'
                }
              />
              <Stat
                label="Tempo de resposta"
                value={response ?? (demo ? 'Sem medida' : 'Sem mensagens para medir')}
                detail="Média entre a mensagem da pessoa e a resposta seguinte."
              />
              <Stat
                label="Alertas"
                value={String(pendingThreads(whatsappThreads).length + pendingThreads(instagramThreads).length + (demo ? 0 : 2))}
                detail={demo ? 'Conversas da amostra que ainda esperam retorno.' : 'Canais que ainda não estão ligados.'}
              />
            </section>
            <section className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <article className="surface-card p-4">
                <h2 className="text-[16px] font-semibold">Funil de hoje</h2>
                <ol className="mt-4 space-y-3">
                  {Object.entries(report.stageCounts).map(([id, count]) => {
                    const width = report.leadCount === 0 ? 0 : Math.max(8, Math.round((count / report.leadCount) * 100))
                    return (
                      <li key={id}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span>{columnLabel(id)}</span>
                          <span className="font-semibold tabular-nums">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                          <div className="h-full rounded-full bg-emerald" style={{ width: `${count === 0 ? 0 : width}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </article>
              <article className="surface-card p-4">
                <h2 className="text-[16px] font-semibold">Atenção</h2>
                <ul className="mt-3 space-y-3">
                  {demo ? (
                    <>
                      <li className="text-[13px] leading-5">
                        <span className="font-semibold">{pendingThreads(demoWhatsappThreads).length} conversas no WhatsApp</span>
                        <span className="mt-0.5 block text-muted">Esperam resposta nesta amostra.</span>
                      </li>
                      <li className="text-[13px] leading-5">
                        <span className="font-semibold">{pendingThreads(demoInstagramThreads).length} direct no Instagram</span>
                        <span className="mt-0.5 block text-muted">Fica no canal do Instagram, separado do WhatsApp.</span>
                      </li>
                      <li className="text-[13px] leading-5">
                        <span className="font-semibold">{demoReviews.length} depoimentos ilustrativos</span>
                        <span className="mt-0.5 block text-muted">A captação real entra na implantação.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="text-[13px] leading-5">
                        <span className="font-semibold">WhatsApp não conectado</span>
                        <span className="mt-0.5 block text-muted">A linha entra pela janela oficial da Meta.</span>
                      </li>
                      <li className="text-[13px] leading-5">
                        <span className="font-semibold">Instagram não conectado</span>
                        <span className="mt-0.5 block text-muted">Direct e comentários ficam para a implantação.</span>
                      </li>
                    </>
                  )}
                </ul>
              </article>
            </section>
          </>
        ) : (
          <section className="grid gap-3 lg:grid-cols-2">
            <Queue
              title="WhatsApp pendente"
              threads={whatsappThreads}
              to={demo ? '/demo/whatsapp' : '/app/whatsapp'}
              empty={demo ? 'Nenhuma conversa de WhatsApp esperando.' : 'Não conectado. A fila aparece quando a linha estiver ligada.'}
            />
            <Queue
              title="Instagram pendente"
              threads={instagramThreads}
              to={demo ? '/demo/instagram' : '/app/instagram'}
              empty={demo ? 'Nenhum direct esperando.' : 'Não conectado. O Direct não foi importado.'}
            />
            <article className="surface-card p-4">
              <h2 className="text-[16px] font-semibold">Agenda de hoje</h2>
              {today.length === 0 ? (
                <p className="mt-3 text-[13px] leading-5 text-muted">Nenhuma consulta neste dia.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {today.map((item) => {
                    const lead = crm.leads.find((entry) => entry.id === item.lead_id)
                    return (
                      <li key={item.id} className="rounded-xl bg-canvas px-3 py-2">
                        <p className="text-[13px] font-semibold">{lead?.name ?? 'Paciente'}</p>
                        <p className="text-[12px] text-muted">{lead?.procedure} · {item.status === 'attended' ? 'Já atendido' : 'Na agenda'}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
            <article className="surface-card p-4">
              <h2 className="text-[16px] font-semibold">Follow-up</h2>
              {tasks.length === 0 ? (
                <p className="mt-3 text-[13px] leading-5 text-muted">Nenhum interesse qualificado sem consulta marcada.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {tasks.map((task) => (
                    <li key={task.id} className="rounded-xl bg-canvas px-3 py-2">
                      <p className="text-[13px] font-semibold">{task.name}</p>
                      <p className="text-[12px] text-muted">{task.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        )}
      </div>
    </div>
  )
}
