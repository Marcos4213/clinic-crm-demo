import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { InstagramMark, WhatsAppMark } from '../components/brand/Marks'
import { LEGAL_CITY, LEGAL_CNPJ, LEGAL_EMAIL, LEGAL_RAZAO_SOCIAL } from '../brand/legal'
import { askClinic, sessionId } from '../c4/ask'
import { C4_AGENT_LINE, C4_AGENT_NAME, C4_HEADLINE, C4_MAX_CHARS, C4_MAX_TURNS, C4_SUBHEAD, C4_SLOGAN } from '../c4/config'
import { findClinic } from '../c4/clinics'
import { bookingHref, clinicPageUrl, forwardHref, methodSteps, openingMessage } from '../c4/script'

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

function avatarSrc() {
  return `${import.meta.env.BASE_URL}c4-helena.jpg`
}

function AgentPortrait({ className }) {
  return <img src={avatarSrc()} alt={C4_AGENT_LINE} className={`rounded-full object-cover ${className}`} />
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
  const known = findClinic(slug)
  const clinic = known ?? { slug: '', name: '', city: '', procedure: '' }

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const logRef = useRef(null)
  const sessionRef = useRef('')
  const [openedAt] = useState(() => clock())
  const thread = [{ role: 'assistant', content: openingMessage(clinic), at: openedAt }, ...messages]

  useEffect(() => {
    const title = clinic.name ? `C4 Clinic · ${clinic.name}` : `C4 Clinic · ${C4_AGENT_NAME}`
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
  const pageUrl = clinicPageUrl(known?.slug || '')
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
        <div className="flex items-start gap-3">
          <AgentPortrait className="h-16 w-16 shrink-0 ring-2 ring-white" />
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-[#075e54]">{C4_AGENT_LINE}</p>
            <h1 className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight">{C4_HEADLINE}</h1>
          </div>
        </div>
        <p className="-mt-3 text-[15px] leading-6 text-[#3d4a45]">{C4_SUBHEAD}</p>
        {known ? (
          <p className="text-[13px] leading-5 text-[#54656f]">
            Simulando {known.name}
            {known.city ? ` · ${known.city}` : ''}
            {known.procedure ? ` · ${known.procedure}` : ''}
          </p>
        ) : null}
        <p className="text-[14px] leading-5 text-[#3d4a45]">
          Escreva como se fosse um paciente. A {C4_AGENT_NAME} responde na hora.
        </p>

        <section aria-label="Conversa de demonstração" className="overflow-hidden rounded-[22px] border border-black/10 shadow-[0_16px_40px_rgba(7,94,84,0.14)]">
          <div className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
            <AgentPortrait className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{C4_AGENT_NAME}</p>
              <p className="text-[12px] text-white/75">da C4 Clinic · demonstração</p>
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
              Marcar 30 minutos com o Marcos
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
