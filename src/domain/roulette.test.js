import { describe, expect, it } from 'vitest'
import { activeBrokers, assignHotLead, currentTurn, moveBroker, nextAfter, resolveNextAfterPause } from './roulette'

const brokers = [
  { id: 'carlos', name: 'Carlos Mendes', active: true, sortOrder: 1 },
  { id: 'ana', name: 'Ana Souza', active: true, sortOrder: 2 },
  { id: 'paulo', name: 'Paulo Ribeiro', active: true, sortOrder: 3 },
  { id: 'lucia', name: 'Lúcia Ferreira', active: false, sortOrder: 4 },
]

describe('roulette', () => {
  it('skips paused brokers and wraps around the active list', () => {
    expect(activeBrokers(brokers).map((item) => item.id)).toEqual(['carlos', 'ana', 'paulo'])
    expect(currentTurn(brokers, 'paulo')?.id).toBe('paulo')
    expect(nextAfter(brokers, 'paulo')?.id).toBe('carlos')
    expect(nextAfter(brokers, 'lucia')?.id).toBe('carlos')
  })

  it('assigns a hot lead to the current broker and advances the turn', () => {
    const { lead, nextBrokerId } = assignHotLead({ id: 'maria', name: 'Maria Silva' }, brokers, 'paulo')
    expect(lead.brokerId).toBe('paulo')
    expect(lead.broker).toBe('Paulo Ribeiro')
    expect(nextBrokerId).toBe('carlos')
  })

  it('falls back to the first active broker when the pointer is missing', () => {
    expect(currentTurn(brokers, null)?.id).toBe('carlos')
    expect(currentTurn(brokers.filter((item) => !item.active), 'carlos')).toBeNull()
    expect(resolveNextAfterPause(brokers.map((item) => (item.id === 'paulo' ? { ...item, active: false } : item)), 'paulo')).toBe('carlos')
  })

  it('reorders brokers without dropping the paused one', () => {
    const moved = moveBroker(brokers, 'ana', -1)
    const ordered = moved.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id)
    expect(ordered).toEqual(['ana', 'carlos', 'paulo', 'lucia'])
  })
})
