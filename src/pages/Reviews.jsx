import { Star } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { demoReviews } from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'

export default function Reviews() {
  const crm = useCrm()
  const demo = crm.mode !== 'workspace'
  const asks = crm.reviewAsks ?? []

  if (!demo) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">Depois da consulta</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">Avaliações</h1>
          <div className="mt-5">
            <EmptyState
              icon={Star}
              badge="Ativado na implantação"
              title="A captação ainda não está ligada"
              detail="Quando o médico avisar a atendente, o botão Pedir avaliação prepara a mensagem de WhatsApp. Hoje nada é enviado."
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">Demonstração · Google</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">Avaliações</h1>
          <p className="mt-3 text-[14px] leading-6 text-muted">
            Depoimentos fictícios e a prévia da mensagem que a atendente dispararia depois da consulta. Nada vai para o WhatsApp.
          </p>
        </header>
        <ul className="space-y-2">
          {demoReviews.map((review) => (
            <li key={review.id} className="surface-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-semibold">{review.name}</p>
                <p className="text-[12px] text-emerald">{'★'.repeat(review.stars)} · {review.source}</p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted">{review.text}</p>
              <p className="mt-2 text-[11px] text-muted">{review.at} · amostra</p>
            </li>
          ))}
        </ul>
        <section className="surface-card p-4">
          <h2 className="text-[16px] font-semibold">Pedir avaliação</h2>
          <p className="mt-2 text-[13px] leading-5 text-muted">
            Na agenda, depois que a consulta fica como compareceu, a atendente pede a avaliação. A mensagem abaixo é só a prévia.
          </p>
          {asks.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhuma prévia ainda. Abra a agenda e use Pedir avaliação em quem já foi atendido.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {asks.map((ask) => (
                <li key={ask.id} className="rounded-xl bg-canvas px-3 py-3">
                  <p className="text-[13px] font-semibold">{ask.name} · {ask.procedure}</p>
                  <p className="mt-1 text-[13px] leading-5">{ask.preview}</p>
                  <p className="mt-2 text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">Prévia local · não enviada</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
