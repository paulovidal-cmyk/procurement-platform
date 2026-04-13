export const APPROVAL_RULES = [
  {
    maxBRL: 4999.99,
    level: 'fast_track',
    columnId: 'aprovado',
    label: 'Fast Track',
    badge: 'bg-emerald-100 text-emerald-700',
    description: 'Aprovação automática (abaixo de R$ 5k)',
  },
  {
    maxBRL: 49999.99,
    level: 'coordenacao',
    columnId: 'coordenacao',
    label: 'Coordenação',
    badge: 'bg-blue-100 text-blue-700',
    description: 'Requer aprovação da Coordenação (até R$ 50k)',
  },
  {
    maxBRL: 249999.99,
    level: 'gestor',
    columnId: 'gestor',
    label: 'Gestor',
    badge: 'bg-violet-100 text-violet-700',
    description: 'Requer aprovação do Gestor (R$ 50k – R$ 250k)',
  },
  {
    maxBRL: Infinity,
    level: 'diretor',
    columnId: 'diretor',
    label: 'Diretor',
    badge: 'bg-red-100 text-red-700',
    description: 'Requer aprovação do Diretor (acima de R$ 250k)',
  },
]

export const FX_RATES = {
  BRL: 1,
  USD: 5.1,
  EUR: 5.55,
}
