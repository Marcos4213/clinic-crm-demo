import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { InstagramMark, WhatsAppMark } from '../components/brand/Marks'
import { LEGAL_CITY, LEGAL_CNPJ, LEGAL_EMAIL, LEGAL_RAZAO_SOCIAL } from '../brand/legal'
import { askClinic, sessionId } from '../c4/ask'
import { C4_MAX_CHARS, C4_MAX_TURNS, C4_SLOGAN } from '../c4/config'
import { findClinic } from '../c4/clinics'
import { bookingHref, clinicPageUrl, forwardHref, methodSteps, openingMessage } from '../c4/script'
import { cleanLabel } from '../c4/slug'

function legalHref(file) {
  const base = import.meta.env.BASE_URL || './'
  return `${base}${file}`
}

function clock(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function initialOf(name) {
  const letter = [...(name || 'C')].find((char) => /\p{L}/u.test(char))
  return (letter || 'C').toUpperCase()
}

function Bubble({ from, text, at, audio = false }) {
  if (from === 'note') {
    return (
      <p className="mx-auto max-w-[90%] rounded-lg bg-[#efeae2] px-3 py-1 text-center text-[12px] text-[#54656f]">{text}</p>
    )
  }
  const patient = from === 'patient' || from === 'user'
  return (
    <div className={patient ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm ${
          patient ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white'
        }`}
      >
        <p className="text-[14.5px] leading-5 whitespace-pre-wrap text-[#111b21]">{text}</p>
        {audio && (
          <p className="mt-1 flex items-center gap-2 text-[11px] text-[#667781]">
            <span className="h-1.5 w-14 rounded-full bg-[#cfd6db]" />
            áudio
          </p>
        )}
        {at && <p className="mt-0.5 text-right text-[10px] text-[#667781]">{at}</p>}
      </div>
    </div>
  )
}

function MiniChat({ bubbles }) {
  return (
    <div className="mt-3 space-y-1.5 rounded-xl bg-[#efeae2] bg-[radial-gradient(#e2d9ce_0.7px,transparent_0.7px)] bg-[length:11px_11px] p-2.5">
      {bubbles.map((bubble) => (
        <Bubble key={`${bubble.from}-${bubble.text}`} from={bubble.from} text={bubble.text} audio={bubble.audio} />
      ))}
    </div>
  )
}

export default function ClinicDemo({ fetchImpl }) {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const known = findClinic(slug)
  const nameFromLink = cleanLabel(params.get('nome') || '', 80)
  const [typedName, setTypedName] = useState(nameFromLink)
  const clinic = useMemo(() => {
    if (known) return known
    return { slug: '', name: cleanLabel(typedName, 80), city: '', procedure: '' }
  }, [known, typedName])

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const logRef = useRef(null)
  const sessionRef = useRef('')
  const [openedAt] = useState(() => clock())
  const thread = [{ role: 'assistant', content: openingMessage(clinic), at: openedAt }, ...messages]

  useEffect(() => {
    const title = clinic.name ? `C4 Clinic · ${clinic.name}` : 'C4 Clinic · demonstração'
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [clinic.name])

  useEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, pending, clinic.name])

  const turns = thread.filter((item) => item.role === 'user').length
  const closed = turns >= C4_MAX_TURNS
  const pageUrl = clinicPageUrl(known?.slug || '', clinic.name)
  const shareHref = forwardHref(clinic.name, pageUrl)
  const bookHref = bookingHref(clinic.name)
  const steps = methodSteps(clinic)

  async function onSend(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || pending || closed) return
    const history = thread
    if (!sessionRef.current) sessionRef.current = sessionId()
    setDraft('')
    setMessages((current) => [...current, { role: 'user', content: text, at: clock() }])
    setPending(true)
    const result = await askClinic({
      clinic,
      history,
      text,
      session: sessionRef.current,
      fetchImpl,
    })
    setMessages((current) => [...current, { role: 'assistant', content: result.text, at: clock() }])
    setPending(false)
  }

  function onNameChange(event) {
    const next = event.target.value
    setTypedName(next)
    const clean = cleanLabel(next, 80)
    setParams(clean ? { nome: clean } : {}, { replace: true })
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f3ec] text-[#1c1917]" style={{ colorScheme: 'light' }}>
      <header className="bg-[#075e54] text-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <p className="text-[20px] font-extrabold tracking-tight">
            C<span className="text-[#9cf0d5]">4</span>
            <span className="ml-2 text-[13px] font-semibold tracking-normal text-white/80">Clinic</span>
          </p>
          <p className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide">Demonstração</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-5 pb-12">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight">
            {clinic.name || 'Sua clínica no WhatsApp'}
          </h1>
          <p className="mt-1 text-[14px] text-[#3d4a45]">
            {clinic.city && clinic.procedure
              ? `${clinic.city} · ${clinic.procedure}`
              : 'Teste o atendimento com o nome da clínica.'}
          </p>
          <p className="mt-3 text-[14px] leading-5 text-[#3d4a45]">
            Escreva como se fosse um paciente. A resposta sai na hora, com o jeito da clínica.
          </p>
        </div>

        {!known && (
          <form className="rounded-2xl border border-[#e4ddd2] bg-white p-3" onSubmit={(event) => event.preventDefault()}>
            <p className="text-[13px] leading-5 text-[#3d4a45]">
              {slug
                ? 'Não achei essa clínica na fila. Escreva o nome dela para testar mesmo assim.'
                : 'Demonstração geral. Escreva o nome da clínica para personalizar.'}
            </p>
            <label className="mt-2 block text-[12px] font-semibold text-[#54656f]" htmlFor="c4-clinic-name">
              Nome da clínica
              <input
                id="c4-clinic-name"
                value={typedName}
                onChange={onNameChange}
                maxLength={80}
                autoComplete="organization"
                className="mt-1 h-11 w-full rounded-xl border border-[#d9d0c5] bg-[#fbfaf7] px-3 text-[16px] text-[#1c1917]"
              />
            </label>
          </form>
        )}

        <section aria-label="Conversa de demonstração" className="overflow-hidden rounded-[22px] border border-black/10 shadow-[0_16px_40px_rgba(7,94,84,0.14)]">
          <div className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-[15px] font-bold">
              {initialOf(clinic.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{clinic.name || 'C4 Clinic'}</p>
              <p className="text-[12px] text-white/75">online · demonstração</p>
            </div>
            <WhatsAppMark className="h-6 w-6" />
          </div>
          <div
            ref={logRef}
            role="log"
            aria-label="Mensagens da demonstração"
            className="flex h-[min(62dvh,560px)] flex-col gap-2 overflow-y-auto bg-[#efeae2] bg-[radial-gradient(#e4dbd1_0.7px,transparent_0.7px)] bg-[length:12px_12px] px-3 py-3"
          >
            {thread.map((message, index) => (
              <Bubble
                key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                from={message.role}
                text={message.content}
                at={message.at}
              />
            ))}
            {pending && (
              <div className="flex justify-start">
                <p className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-[13px] text-[#667781]">digitando…</p>
              </div>
            )}
          </div>
          {closed ? (
            <p className="bg-[#f0f2f5] px-3 py-3 text-[13px] leading-5 text-[#54656f]">
              Nesta demonstração a conversa pausa aqui. Na clínica, a equipe segue o atendimento.
            </p>
          ) : (
            <form onSubmit={onSend} className="flex items-end gap-2 bg-[#f0f2f5] px-2 py-2">
              <label className="sr-only" htmlFor="c4-draft">
                Mensagem do paciente
              </label>
              <input
                id="c4-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, C4_MAX_CHARS))}
                maxLength={C4_MAX_CHARS}
                placeholder="Escreva como um paciente"
                enterKeyHint="send"
                className="h-11 min-w-0 flex-1 rounded-full border border-transparent bg-white px-4 text-[16px] text-[#111b21] outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={pending || !draft.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#075e54] text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}
        </section>

        <section aria-labelledby="metodo-c4">
          <h2 id="metodo-c4" className="text-[22px] font-extrabold tracking-tight">
            O método C4
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-[#3d4a45]">Do primeiro oi até depois da consulta.</p>
          <ol className="mt-4 space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="rounded-2xl border border-[#e4ddd2] bg-white p-3">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#075e54] uppercase">{step.label}</p>
                  {step.id === 'captar' && (
                    <span className="ml-auto flex items-center gap-1">
                      <WhatsAppMark className="h-4 w-4" />
                      <InstagramMark className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-[16px] font-bold">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#3d4a45]">{step.copy}</p>
                <MiniChat bubbles={step.bubbles} />
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl bg-[#075e54] px-4 py-5 text-white">
          <p className="text-[22px] leading-tight font-extrabold">{C4_SLOGAN}</p>
          <p className="mt-3 text-[14px] leading-5 text-white/85">
            O C4 apoia a recepção. Quem atende continua sendo a equipe da clínica.
          </p>
        </section>

        <section aria-label="Próximo passo" className="flex flex-col gap-3">
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#128c7e] px-4 text-center text-[15px] font-bold text-white"
          >
            Encaminhar para a doutora
          </a>
          {bookHref ? (
            <a
              href={bookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-[#075e54] bg-white px-4 text-center text-[15px] font-bold text-[#075e54]"
            >
              Marcar 15 minutos com o Marcos
            </a>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#075e54] px-4 py-3 text-[13px] leading-5 text-[#3d4a45]">
              TODO: defina o número do C4 em src/c4/config.js para abrir o WhatsApp do Marcos.
            </p>
          )}
        </section>

        <footer className="text-center text-[11px] leading-5 text-[#667781]">
          <p>
            C4 Clinic é um produto da DevBrasil · {LEGAL_RAZAO_SOCIAL} · CNPJ {LEGAL_CNPJ} · {LEGAL_CITY} ·{' '}
            <a className="underline" href={`mailto:${LEGAL_EMAIL}`}>
              {LEGAL_EMAIL}
            </a>
          </p>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3">
            <a href={legalHref('privacidade.html')}>Privacidade</a>
            <a href={legalHref('termos.html')}>Termos</a>
            <a href={legalHref('exclusao-de-dados.html')}>Exclusão de dados</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
