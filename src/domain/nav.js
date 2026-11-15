export const SIDEBAR_COLLAPSED_KEY = 'plantao.sidebarCollapsed'

export function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    /* storage can be unavailable in private contexts */
  }
}

export function isNavActive(pathname, item, base) {
  if (!item?.to) return false
  if (item.end) return pathname === item.to || pathname === `${item.to}/`
  if (item.match === 'leads') {
    return (
      pathname === `${base}/pipeline` ||
      pathname.startsWith(`${base}/pipeline/`) ||
      pathname.startsWith(`${base}/leads/`)
    )
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function navBlueprint(base) {
  return {
    sections: [
      {
        id: 'operacao',
        label: 'Operação',
        items: [
          { id: 'inicio', to: base, end: true, label: 'Início' },
          { id: 'conversas', to: `${base}/whatsapp`, label: 'Conversas' },
          { id: 'leads', to: `${base}/pipeline`, label: 'Leads', match: 'leads' },
          { id: 'visitas', to: `${base}/agenda`, label: 'Visitas' },
          { id: 'imoveis', to: `${base}/imoveis`, label: 'Imóveis' },
        ],
      },
      {
        id: 'canais',
        label: 'Canais',
        items: [
          { id: 'whatsapp', to: `${base}/whatsapp`, label: 'WhatsApp' },
          { id: 'instagram', to: `${base}/instagram`, label: 'Instagram' },
        ],
      },
      {
        id: 'gestao',
        label: 'Gestão',
        items: [
          { id: 'equipe', to: `${base}/equipe`, label: 'Equipe' },
          { id: 'relatorios', to: `${base}/relatorios`, label: 'Relatórios' },
          { id: 'alertas', label: 'Alertas', action: 'alerts' },
          { id: 'avaliacoes', to: `${base}/avaliacoes`, label: 'Avaliações' },
        ],
      },
    ],
    footer: [
      { id: 'ajustes', to: `${base}/ajustes`, label: 'Ajustes' },
      { id: 'integracoes', to: `${base}/integracoes`, label: 'Integrações' },
      { id: 'ajuda', label: 'Ajuda', action: 'help' },
    ],
    mobilePrimary: [
      { id: 'inicio', to: base, end: true, label: 'Início' },
      { id: 'conversas', to: `${base}/whatsapp`, label: 'Conversas' },
      { id: 'leads', to: `${base}/pipeline`, label: 'Leads', match: 'leads' },
      { id: 'visitas', to: `${base}/agenda`, label: 'Visitas' },
    ],
  }
}
