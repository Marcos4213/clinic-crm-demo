import { Lock, Send } from 'lucide-react'
import SectionPage from './SectionPage'

const SAMPLE = 'Olá. Este texto é só um exemplo de lembrete de avaliação de Botox. Ele não será enviado.'

export default function MassDispatch() {
  return (
    <SectionPage icon={Send} kicker="Automatize.app · sem integração" title="Disparos em Massa">
      <p className="text-[14px] leading-6 text-ink">
        O disparo em massa não está conectado. Nenhuma campanha é criada e nenhum contato é alcançado.
      </p>
      <label className="mt-4 block text-[12px] font-semibold text-muted" htmlFor="modelo-disparo">
        Modelo ilustrativo
        <textarea
          id="modelo-disparo"
          readOnly
          disabled
          value={SAMPLE}
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] leading-5 font-normal text-ink"
          rows={3}
        />
      </label>
      <button
        type="button"
        disabled
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D5DEE8] px-3 text-[12.5px] font-semibold text-[#6D8094]"
      >
        <Lock size={14} aria-hidden="true" />
        Envio desativado — sem integração
      </button>
    </SectionPage>
  )
}
