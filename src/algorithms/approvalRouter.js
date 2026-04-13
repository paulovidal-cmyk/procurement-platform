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

export function canUserApproveColumn(user, columnId) {
  if (user.role === 'admin') return true
  const roleMap = {
    coordenador: ['coordenacao'],
    gestor: ['gestor'],
    diretor: ['diretor'],
  }
  return (roleMap[user.role] || []).includes(columnId)
}
