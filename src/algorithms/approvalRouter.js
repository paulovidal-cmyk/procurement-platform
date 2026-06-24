import { APPROVAL_RULES, FX_RATES } from '../constants/approvalRules.js'

export function routeCard(valorFinal, moeda = 'BRL') {
  const rate = FX_RATES[moeda] || 1
  const valueBRL = parseFloat(valorFinal) * rate
  return APPROVAL_RULES.find(rule => valueBRL <= rule.maxBRL) || APPROVAL_RULES[APPROVAL_RULES.length - 1]
}

export function nextColumnOnApprove(currentColumnId) {
  // All approvals go directly to 'aprovado'
  return 'aprovado'
}

/** Colunas que são etapas de aprovação no Kanban. */
export const APPROVAL_COLUMNS = ['coordenacao', 'gestor', 'diretor']

/**
 * Apenas Gestor e Admin podem aprovar — e ambos aprovam TODAS as etapas de
 * aprovação (Coordenação, Gestor e Diretor).
 */
export function canUserApproveColumn(user, columnId) {
  if (user?.role === 'admin') return true
  if (user?.role === 'gestor') return APPROVAL_COLUMNS.includes(columnId)
  return false
}
