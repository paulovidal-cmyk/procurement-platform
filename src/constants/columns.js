export const COLUMN_DEFS = [
  {
    id: 'aguardando',
    label: 'Aguardando Comprador',
    headerColor: '#F59E0B',   // amber/yellow
    headerText: '#ffffff',
    bodyBg: '#FFFBEB',        // amber-50
    isTerminal: false,
    isLight: false,
  },
  {
    id: 'coordenacao',
    label: 'Aprovação Coordenação',
    headerColor: '#BAE6FD',   // sky-200 — azul bem claro
    headerText: '#0369A1',    // darker text for contrast
    bodyBg: '#F0F9FF',        // sky-50
    isTerminal: false,
    isLight: true,            // light header — use dark text
  },
  {
    id: 'gestor',
    label: 'Aprovação Gestor',
    headerColor: '#3B82F6',   // blue-500 — azul padrão
    headerText: '#ffffff',
    bodyBg: '#EFF6FF',        // blue-50
    isTerminal: false,
    isLight: false,
  },
  {
    id: 'diretor',
    label: 'Aprovação Diretor',
    headerColor: '#1D4ED8',   // blue-700 — azul escuro
    headerText: '#ffffff',
    bodyBg: '#EFF6FF',        // blue-50
    isTerminal: false,
    isLight: false,
  },
  {
    id: 'aprovado',
    label: 'Aprovado',
    headerColor: '#10CB9A',   // Stone green
    headerText: '#ffffff',
    bodyBg: '#F0FDF4',        // green-50
    isTerminal: true,
    isLight: false,
  },
  {
    id: 'cancelado',
    label: 'Cancelado',
    headerColor: '#9CA3AF',   // gray-400
    headerText: '#ffffff',
    bodyBg: '#F9FAFB',        // gray-50
    isTerminal: true,
    isLight: false,
  },
]

export const COLUMN_MAP = Object.fromEntries(COLUMN_DEFS.map(c => [c.id, c]))
