import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { useCrm } from '../state/useCrm'

const PROVIDER_LABEL = {
  grok: 'Grok',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  google_calendar: 'Google Calendar',
}

export default function Settings() {
  const crm = useCrm()
  const auth = useAuth()
  const [faq, setFaq] = useState(crm.settings?.business_faq ?? '')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-info uppercase">{crm.clinic?.name}</p>
        <h1 className="mt-2 text-[24px] font-semibold">Ajustes</h1>
        <p className="mt-2 text-[13px] leading-5 text-muted">Integrações mostram o estado real. Nenhuma aparece como conectada sem configuração no servidor.</p>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {crm.integrations.map((item) => (
            <li key={item.provider} className="px-3 py-3">
              <p className="text-[14px] font-semibold">{PROVIDER_LABEL[item.provider] ?? item.provider}</p>
              <p className="text-[12px] text-emerald">{item.state}</p>
              <p className="text-[12px] text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
        <Link to="/app/whatsapp" className="mt-4 inline-flex text-[13px] font-semibold text-emerald">
          WhatsApp de teste
        </Link>
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            crm.saveFaq(faq)
          }}
        >
          <label className="block text-[12px] font-semibold text-muted" htmlFor="faq">
            FAQ usado pela IA
            <textarea id="faq" value={faq} onChange={(event) => setFaq(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-[#080F1C]">
            Gravar FAQ
          </button>
        </form>
        <button type="button" onClick={crm.createDemoWorkspace} className="mt-4 h-9 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-ink">
          Criar espaço de demonstração fictício nesta conta
        </button>
        {crm.notice && <p className="mt-3 text-[13px] text-muted">{crm.notice}</p>}
        <button type="button" onClick={() => auth.signOut()} className="mt-6 text-[13px] font-semibold text-info">
          Sair
        </button>
      </div>
    </div>
  )
}
