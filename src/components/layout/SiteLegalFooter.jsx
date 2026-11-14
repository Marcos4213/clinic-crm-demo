import { useLocation } from 'react-router-dom'
import { LEGAL_CNPJ, LEGAL_EMAIL, LEGAL_RAZAO_SOCIAL } from '../../brand/legal'

function legalHref(file) {
  const base = import.meta.env.BASE_URL || './'
  return `${base}${file}`
}

export default function SiteLegalFooter() {
  const location = useLocation()
  const inAppShell = location.pathname.startsWith('/demo') || location.pathname.startsWith('/app')

  return (
    <footer
      className={`site-legal shrink-0 border-t border-line bg-canvas px-4 py-3 text-center text-[11px] leading-5 text-muted ${
        inAppShell ? 'max-lg:pb-[140px]' : ''
      }`}
    >
      <p>
        Automatize.app é um produto da DevBrasil · {LEGAL_RAZAO_SOCIAL} · CNPJ {LEGAL_CNPJ} · Barueri/SP ·{' '}
        <a className="text-muted underline decoration-line underline-offset-2 hover:text-ink" href={`mailto:${LEGAL_EMAIL}`}>
          {LEGAL_EMAIL}
        </a>
      </p>
      <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a className="text-muted hover:text-ink" href={legalHref('privacidade.html')}>
          Privacidade
        </a>
        <a className="text-muted hover:text-ink" href={legalHref('termos.html')}>
          Termos
        </a>
        <a className="text-muted hover:text-ink" href={legalHref('exclusao-de-dados.html')}>
          Exclusão de dados
        </a>
      </p>
    </footer>
  )
}
