export function activeBrokers(brokers = []) {
  return brokers
    .filter((broker) => broker.active)
    .slice()
    .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'pt-BR'))
}

export function currentTurn(brokers, nextBrokerId) {
  const active = activeBrokers(brokers)
  if (active.length === 0) return null
  return active.find((broker) => broker.id === nextBrokerId) ?? active[0]
}

export function nextAfter(brokers, currentId) {
  const active = activeBrokers(brokers)
  if (active.length === 0) return null
  const index = active.findIndex((broker) => broker.id === currentId)
  if (index === -1) return active[0]
  return active[(index + 1) % active.length]
}

export function brokerById(brokers, id) {
  return brokers.find((broker) => broker.id === id) ?? null
}

export function brokerName(brokers, id) {
  return brokerById(brokers, id)?.name ?? ''
}

export function assignHotLead(lead, brokers, nextBrokerId) {
  if (!lead) return { lead, nextBrokerId }
  const current = currentTurn(brokers, nextBrokerId)
  if (!current) return { lead, nextBrokerId }
  return {
    lead: { ...lead, brokerId: current.id, broker: current.name },
    nextBrokerId: nextAfter(brokers, current.id)?.id ?? current.id,
  }
}

export function resolveNextAfterPause(brokers, nextBrokerId) {
  const current = currentTurn(brokers, nextBrokerId)
  return current?.id ?? null
}

export function moveBroker(brokers, brokerId, direction) {
  const ordered = brokers.slice().sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'pt-BR'))
  const index = ordered.findIndex((broker) => broker.id === brokerId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= ordered.length) return brokers
  const swap = ordered[target]
  return brokers.map((broker) => {
    if (broker.id === brokerId) return { ...broker, sortOrder: swap.sortOrder }
    if (broker.id === swap.id) return { ...broker, sortOrder: ordered[index].sortOrder }
    return broker
  })
}
