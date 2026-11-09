import { useState } from 'react'
import { Lock } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import {
  demoAutoReplies,
  demoCampaigns,
  demoCommentRules,
  demoFollowups,
  demoRemarketing,
  demoScheduledMessages,
} from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'

function LockedAction({ children }) {
  return (
    <button type="button" disabled className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#24344A] px-3 text-[12.5px] font-semibold text-muted">
      <Lock size={14} aria-hidden="true" />
      {children}
    </button>
  )
}

function DemoNote({ children }) {
  return <p className="text-[13px] leading-5 text-muted">{children}</p>
}

export function ActivationPane({ title, detail }) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <EmptyState badge="Ativado na implantação" title={title} detail={detail} />
    </div>
  )
}

export function MassPane() {
  const demo = useCrm().mode !== 'workspace'
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <p className="text-[14px] leading-6 text-ink">
        O disparo em massa não está conectado. Nenhuma campanha é criada e nenhum contato é alcançado.
      </p>
      {demo && (
        <ul className="space-y-2">
          {demoCampaigns.map((item) => (
            <li key={item.id} className="surface-card px-4 py-3">
              <p className="text-[14px] font-semibold">{item.name}</p>
              <p className="mt-1 text-[12px] text-muted">
                {item.audience} · {item.when} · {item.status} fictícia
              </p>
            </li>
          ))}
        </ul>
      )}
      <LockedAction>Envio desativado — sem integração</LockedAction>
    </div>
  )
}

export function SchedulePane({ channel }) {
  const demo = useCrm().mode !== 'workspace'
  const [preview, setPreview] = useState('')
  const items = demoScheduledMessages.filter((item) => item.channel.toLowerCase() === channel)
  if (!demo) return <ActivationPane title="Agendamento de mensagens" detail="Os horários programados entram quando o canal estiver ligado. Nada foi agendado." />
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <DemoNote>Estes horários são uma vitrine. Nenhuma mensagem entra na fila real.</DemoNote>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="surface-card px-4 py-3">
            <p className="text-[14px] font-semibold">{item.name}</p>
            <p className="mt-1 text-[12px] text-emerald">{item.when}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted">{item.text}</p>
          </li>
        ))}
        {preview && (
          <li className="surface-card px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-emerald uppercase">Prévia local</p>
            <p className="mt-1 text-[13px]">{preview}</p>
          </li>
        )}
      </ul>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          const text = new FormData(event.currentTarget).get('text')
          setPreview(String(text ?? '').trim())
          event.currentTarget.reset()
        }}
      >
        <label className="block text-[12px] font-semibold text-muted" htmlFor={`agenda-msg-${channel}`}>
          Texto da prévia
          <textarea id={`agenda-msg-${channel}`} name="text" rows={3} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
        </label>
        <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C]">
          Guardar prévia na demonstração
        </button>
      </form>
    </div>
  )
}

export function FollowUpPane() {
  const demo = useCrm().mode !== 'workspace'
  if (!demo) return <ActivationPane title="Follow-up" detail="A lista de retornos da atendente é ativada na implantação. Nenhuma tarefa foi criada." />
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6">
      <DemoNote>Retornos ilustrativos do WhatsApp. A fila do dia, no Início, continua vindo dos leads sem consulta marcada.</DemoNote>
      <ul className="space-y-2">
        {demoFollowups.map((item) => (
          <li key={item.id} className="surface-card px-4 py-3">
            <p className="text-[14px] font-semibold">{item.name}</p>
            <p className="mt-1 text-[13px] text-muted">{item.detail}</p>
            <p className="mt-1 text-[12px] text-emerald">{item.when} · amostra</p>
          </li>
        ))}
      </ul>
      <LockedAction>Disparo de follow-up desativado</LockedAction>
    </div>
  )
}

export function RemarketingPane() {
  const demo = useCrm().mode !== 'workspace'
  if (!demo) return <ActivationPane title="Remarketing" detail="As audiências de retorno entram na implantação. Nenhum anúncio ou mensagem foi criado." />
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6">
      <DemoNote>Audiências de exemplo. O Pixel da Meta continua em breve e nada é disparado.</DemoNote>
      <ul className="space-y-2">
        {demoRemarketing.map((item) => (
          <li key={item.id} className="surface-card flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">{item.name}</p>
              <p className="mt-1 text-[12px] text-muted">Janela de {item.window}</p>
            </div>
            <span className="text-[11px] font-semibold tracking-[0.12em] text-emerald uppercase">{item.status}</span>
          </li>
        ))}
      </ul>
      <LockedAction>Remarketing desativado</LockedAction>
    </div>
  )
}

export function AutoReplyPane() {
  const demo = useCrm().mode !== 'workspace'
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6">
      <p className="text-[14px] leading-6 text-ink">A resposta automática continua desligada.</p>
      {demo ? (
        <>
          <p className="text-[13px] leading-5 text-muted">Os textos abaixo são um rascunho da amostra. Nenhum deles responde sozinho.</p>
          <ul className="space-y-2">
            {demoAutoReplies.map((item) => (
              <li key={item.id} className="surface-card px-4 py-3 opacity-80">
                <p className="text-[14px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-muted">{item.text}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Desligada</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState badge="Ativado na implantação" title="Respostas automáticas" detail="Quando a implantação ligar este módulo, os textos da clínica entram aqui. Hoje nada responde sozinho." />
      )}
    </div>
  )
}

export function CommentPane() {
  const demo = useCrm().mode !== 'workspace'
  const [rules, setRules] = useState(demoCommentRules)
  if (!demo) return <ActivationPane title="Respostas a comentários" detail="As regras por palavra-chave ficam disponíveis quando o Instagram estiver ligado. Nenhum comentário é lido agora." />
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6">
      <DemoNote>A chave só muda a amostra nesta tela. Nenhum comentário do Instagram é respondido.</DemoNote>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule.id} className="surface-card px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold">Palavra: {rule.keyword}</p>
              <button
                type="button"
                aria-pressed={rule.active}
                onClick={() => setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, active: !item.active } : item)))}
                className={`h-8 rounded-full px-3 text-[12px] font-semibold ${rule.active ? 'bg-emerald text-[#080F1C]' : 'border border-line text-muted'}`}
              >
                {rule.active ? 'Ilustração ligada' : 'Ilustração pausada'}
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-muted">{rule.reply}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DirectComposePane() {
  const demo = useCrm().mode !== 'workspace'
  const [sent, setSent] = useState([])
  if (!demo) return <ActivationPane title="Envio de DM" detail="O envio pelo Instagram não está conectado. Nenhuma mensagem direta sai desta clínica." />
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <DemoNote>Escreva uma prévia. Ela não entra no Direct de ninguém.</DemoNote>
      <form
        className="surface-card space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const text = String(data.get('text') ?? '').trim()
          if (!text) return
          setSent((current) => [...current, text])
          event.currentTarget.reset()
        }}
      >
        <label className="block text-[12px] font-semibold text-muted" htmlFor="dm-person">
          Pessoa da amostra
          <input id="dm-person" name="person" defaultValue="Ana Beatriz Costa" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-ink" />
        </label>
        <label className="block text-[12px] font-semibold text-muted" htmlFor="dm-text">
          Mensagem
          <textarea id="dm-text" name="text" rows={3} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
        </label>
        <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C]">
          Guardar prévia na demonstração
        </button>
      </form>
      {sent.length > 0 && (
        <ul className="space-y-2">
          {sent.map((text) => (
            <li key={text} className="rounded-xl border border-line px-3 py-2 text-[13px]">
              {text}
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.12em] text-emerald uppercase">Prévia local · não enviada</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
