import { Outlet, useLocation } from 'react-router-dom'
import { InstagramMark } from '../components/brand/Marks'
import ChannelShell from '../components/channels/ChannelShell'
import ThreadDesk from '../components/channels/ThreadDesk'
import { demoInstagramThreads } from '../data/demo-catalog'
import { useCrm } from '../state/useCrm'
import EmptyState from '../components/ui/EmptyState'

const TABS = [
  { slug: '', end: true, label: 'Direct', title: 'Instagram' },
  { slug: 'comentarios', label: 'Respostas a comentários', title: 'Respostas a comentários' },
  { slug: 'direct', label: 'Envio de DM', title: 'Envio de DM' },
  { slug: 'agendamento', label: 'Agendamento de mensagens', title: 'Agendamento de mensagens' },
]

function activeTab(pathname) {
  return [...TABS].reverse().find((item) => (item.slug ? pathname.includes(`/instagram/${item.slug}`) : /\/instagram\/?$/.test(pathname))) ?? TABS[0]
}

export function InstagramLayout() {
  const { pathname } = useLocation()
  const tab = activeTab(pathname)
  const base = pathname.replace(/\/instagram.*/, '/instagram')
  return (
    <ChannelShell
      logo={<InstagramMark className="h-10 w-10" />}
      kicker="Direct e comentários"
      title={tab.title}
      label="Instagram"
      tabs={TABS.map((item) => ({ to: item.slug ? `${base}/${item.slug}` : base, end: item.end, label: item.label }))}
    >
      <Outlet />
    </ChannelShell>
  )
}

export function InstagramDirect() {
  const demo = useCrm().mode !== 'workspace'
  if (!demo) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState badge="Não conectado" title="Direct ainda não entra no atendimento" detail="As conversas do Instagram aparecem aqui quando a conta da clínica for ligada. Nada foi importado." />
      </div>
    )
  }
  return (
    <ThreadDesk
      threads={demoInstagramThreads}
      composeLabel="Resposta só nesta demonstração"
      emptyTitle="Nenhum direct"
      emptyDetail="A amostra não tem conversas do Instagram."
    />
  )
}
