import { Bot, Lock } from 'lucide-react'
import SectionPage from './SectionPage'

export default function AiSettings() {
  return (
    <SectionPage icon={Bot} kicker="Convertize · sem provedor nesta amostra" title="Configurações de IA">
      <p className="text-[14px] leading-6 text-ink">
        Nenhum provedor de modelo está conectado. Estas opções não são salvas e não alteram uma IA externa.
      </p>
      <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
        <div className="grid gap-1 px-3 py-3 sm:grid-cols-[160px_1fr]">
          <dt className="text-[12px] font-semibold text-muted">Tom na amostra</dt>
          <dd className="text-[13.5px] text-ink">Acolhedor e direto</dd>
        </div>
        <div className="grid gap-1 px-3 py-3 sm:grid-cols-[160px_1fr]">
          <dt className="text-[12px] font-semibold text-muted">Controle real desta demo</dt>
          <dd className="text-[13.5px] text-ink">
            Só o botão de assumir atendimento, no pipeline, e apenas para o lead selecionado.
          </dd>
        </div>
      </dl>
      <button
        type="button"
        disabled
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D5DEE8] px-3 text-[12.5px] font-semibold text-[#6D8094]"
      >
        <Lock size={14} aria-hidden="true" />
        Salvar desativado — sem provedor
      </button>
    </SectionPage>
  )
}
