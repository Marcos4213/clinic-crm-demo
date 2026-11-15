import { Outlet, useLocation } from 'react-router-dom'
import { WhatsAppMark } from '../components/brand/Marks'
import ChannelShell from '../components/channels/ChannelShell'
import ThreadDesk from '../components/channels/ThreadDesk'
import { demoWhatsappThreads } from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'
import WhatsAppTest from './WhatsApp'

const TABS = [
  { slug: '', end: true, label: 'Conversas', title: 'Conversas' },
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
  const conversations = !tab.slug
  const tools = TABS.filter((item) => item.slug).map((item) => ({
    to: `${base}/${item.slug}`,
    label: item.label,
  }))
  return (
    <ChannelShell
      logo={<WhatsAppMark className="h-9 w-9" />}
      title={tab.title}
      label="WhatsApp"
      tools={tools}
      tabs={conversations ? [] : [{ to: base, end: true, label: 'Conversas' }]}
      flush={conversations}
    >
      <Outlet />
    </ChannelShell>
  )
}

export function WhatsAppConversations() {
  const demo = useCrm().mode !== 'workspace'
  if (demo) {
    return <ThreadDesk threads={demoWhatsappThreads} composeLabel="Mensagem" emptyTitle="Nenhuma conversa pendente" emptyDetail="Quando um lead chamar no WhatsApp, ele aparece aqui." />
  }
  return <WhatsAppTest />
}
