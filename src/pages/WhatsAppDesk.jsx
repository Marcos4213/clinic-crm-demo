import { Outlet, useLocation } from 'react-router-dom'
import { WhatsAppMark } from '../components/brand/Marks'
import ChannelShell from '../components/channels/ChannelShell'
import ThreadDesk from '../components/channels/ThreadDesk'
import { demoWhatsappThreads } from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'
import WhatsAppTest from './WhatsApp'

const TABS = [
  { slug: '', end: true, label: 'Conversas', title: 'WhatsApp' },
  { slug: 'disparos', label: 'Disparos em Massa', title: 'Disparos em Massa' },
  { slug: 'agendamento', label: 'Agendamento de mensagens', title: 'Agendamento de mensagens' },
  { slug: 'follow-up', label: 'Follow-up', title: 'Follow-up' },
  { slug: 'remarketing', label: 'Remarketing', title: 'Remarketing' },
  { slug: 'respostas', label: 'Respostas automáticas', title: 'Respostas automáticas' },
]

function activeTab(pathname) {
  return [...TABS].reverse().find((item) => (item.slug ? pathname.includes(`/whatsapp/${item.slug}`) : /\/whatsapp\/?$/.test(pathname))) ?? TABS[0]
}

export function WhatsAppLayout() {
  const { pathname } = useLocation()
  const tab = activeTab(pathname)
  const base = pathname.replace(/\/whatsapp.*/, '/whatsapp')
  return (
    <ChannelShell
      logo={<WhatsAppMark className="h-10 w-10" />}
      kicker="Canal oficial"
      title={tab.title}
      label="WhatsApp"
      tabs={TABS.map((item) => ({ to: item.slug ? `${base}/${item.slug}` : base, end: item.end, label: item.label }))}
    >
      <Outlet />
    </ChannelShell>
  )
}

export function WhatsAppConversations() {
  const demo = useCrm().mode !== 'workspace'
  if (demo) {
    return (
      <ThreadDesk
        threads={demoWhatsappThreads}
        composeLabel="Resposta só nesta demonstração"
        emptyTitle="Nenhuma conversa de WhatsApp"
        emptyDetail="A amostra não tem mensagens deste canal."
      />
    )
  }
  return <WhatsAppTest />
}
