import { useState } from 'react'
import ChatPanel from '../components/chat/ChatPanel'
import KanbanBoard from '../components/crm/KanbanBoard'
import PipelineHeader from '../components/crm/PipelineHeader'
import useCompactViewport from '../hooks/useCompactViewport'
import { useCrm } from '../state/useCrm'

export default function Dashboard() {
  const crm = useCrm()
  const compact = useCompactViewport()
  const [pane, setPane] = useState('board')
  const hiddenByFilter = !crm.visibleLeads.some((lead) => lead.id === crm.selectedId)
  const showBoard = !compact || pane === 'board'
  const showChat = !compact || pane === 'chat'

  function selectLead(id) {
    crm.selectLead(id)
    if (compact) setPane('chat')
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {compact && (
        <div className="flex shrink-0 gap-1 border-b border-line bg-white p-2">
          <button
            type="button"
            aria-pressed={pane === 'board'}
            onClick={() => setPane('board')}
            className={`h-8 flex-1 rounded-lg text-[12px] font-semibold ${pane === 'board' ? 'bg-navy-900 text-white' : 'text-muted'}`}
          >
            Mostrar funil
          </button>
          <button
            type="button"
            aria-pressed={pane === 'chat'}
            onClick={() => setPane('chat')}
            className={`h-8 flex-1 rounded-lg text-[12px] font-semibold ${pane === 'chat' ? 'bg-navy-900 text-white' : 'text-muted'}`}
          >
            Mostrar conversa
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {showBoard && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <PipelineHeader />
            <KanbanBoard leads={crm.visibleLeads} selectedId={crm.selectedId} onSelect={selectLead} onMove={crm.moveLeadTo} />
          </div>
        )}
        {showChat && (
          <ChatPanel
            lead={crm.selected}
            hiddenByFilter={hiddenByFilter}
            draft={crm.draft}
            onDraft={crm.setDraft}
            onToggleTakeover={() => crm.toggleTakeover()}
            onSend={crm.sendCurrent}
            compact={compact}
            onBack={() => setPane('board')}
            className={compact ? 'flex w-full flex-1 flex-col' : 'flex w-[320px] shrink-0 flex-col border-l border-line xl:w-[348px] 2xl:w-[400px]'}
          />
        )}
      </div>
      <div className="sr-only" role="status">
        {crm.announcement}
      </div>
    </div>
  )
}
