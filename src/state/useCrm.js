import { useContext } from 'react'
import { CrmContext } from './crm-context'

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) throw new Error('useCrm fora do CrmProvider')
  return context
}
