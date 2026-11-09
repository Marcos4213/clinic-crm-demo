import { CalendarDays, Camera, LineChart, MessageCircle } from 'lucide-react'
import { WhatsAppConnect } from '../components/whatsapp/WhatsAppConnect'
import { WhatsAppMark } from '../components/brand/Marks'
import { InstagramMark } from '../components/brand/Marks'
import { useWhatsappSignup } from '../data/meta-signup'
import { useAuth } from '../state/useAuth'
import { useCrm } from '../state/useCrm'

function statusOf(integrations, provider) {
  const state = integrations.find((item) => item.provider === provider)?.state
  if (state === 'pending') return { label: 'Não conectado', detail: 'O cadastro começou, mas ainda não há prova de entrega.' }
  return { label: 'Não conectado', detail: 'Este canal ainda não está ligado nesta clínica.' }
}

function Card({ icon, title, badge, detail, children }) {
  return (
    <article className="surface-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-[16px] font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-canvas px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald uppercase">{badge}</span>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-muted">{detail}</p>
      {children}
    </article>
  )
}

export default function Integrations() {
  const crm = useCrm()
  const auth = useAuth()
  const demo = crm.mode !== 'workspace'
  const signup = useWhatsappSignup(demo ? null : auth.client, demo ? null : crm.clinic?.id)
  const integrations = crm.integrations ?? []
  const whatsapp = statusOf(integrations, 'whatsapp')
  const instagram = statusOf(integrations, 'instagram')
  const google = statusOf(integrations, 'google_calendar')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald uppercase">{demo ? 'Demonstração · nada está ligado de verdade' : 'Estado real da clínica'}</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">Integrações</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
            Cada canal entra por um clique oficial. Esta tela não simula conexão.
          </p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          <Card icon={<WhatsAppMark className="h-8 w-8" />} title="WhatsApp" badge={demo ? 'Não conectado' : whatsapp.label} detail={demo ? 'Na conta da clínica, a linha abre a janela da Meta. Aqui continua desligado.' : whatsapp.detail}>
            {!demo && <WhatsAppConnect config={signup.config} pending={signup.pending} onConnect={signup.onConnect} />}
            {!demo && signup.signupNotice && <p className="mt-3 text-[13px] text-muted">{signup.signupNotice}</p>}
          </Card>
          <Card icon={<InstagramMark className="h-8 w-8" />} title="Instagram" badge={instagram.label} detail={demo ? 'Direct e comentários da amostra não leem uma conta real.' : instagram.detail} />
          <Card icon={<CalendarDays className="text-emerald" size={28} />} title="Google" badge={google.label} detail={demo ? 'Google Calendar não está conectado. A agenda interna segue valendo.' : 'Google Calendar não está conectado. A agenda oficial continua neste painel.'} />
          <Card icon={<MessageCircle className="text-emerald" size={28} />} title="Agendas externas" badge="Não conectado" detail="Doctoralia, iClinic e outras agendas da recepção entram na implantação, sem obrigar a clínica a trocar de sistema agora." />
          <Card icon={<Camera className="text-emerald" size={28} />} title="Pixel / Meta" badge="Em breve" detail="O acompanhamento de anúncios ainda não está neste painel." />
          <Card icon={<LineChart className="text-emerald" size={28} />} title="Como a implantação fecha" badge="7 dias" detail="WhatsApp, Instagram, agenda e avaliações são ligados no período de implantação. Até lá, o painel não inventa envio nem métrica." />
        </div>
      </div>
    </div>
  )
}
