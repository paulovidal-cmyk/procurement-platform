export const CATEGORIES = [
  { value: 'TI',          label: 'TI',           color: '#3B82F6' },
  { value: 'Facilities',  label: 'Facilities',   color: '#F59E0B' },
  { value: 'Logística',   label: 'Logística',    color: '#8B5CF6' },
  { value: 'Marketing',   label: 'Marketing',    color: '#EC4899' },
  { value: 'Serviços',    label: 'Serviços',     color: '#14B8A6' },
  { value: 'Materiais',   label: 'Materiais',    color: '#EF4444' },
  { value: 'RH',          label: 'RH',           color: '#06B6D4' },
  { value: 'Jurídico',    label: 'Jurídico',     color: '#84CC16' },
  { value: 'Financeiro',  label: 'Financeiro',   color: '#F97316' },
  { value: 'Outros',      label: 'Outros',       color: '#6B7280' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))
