import { Home, LayoutDashboard, BarChart2, ScanLine, ShieldCheck } from 'lucide-react'

/**
 * Módulos navegáveis (as "abas" do topo). Fonte única usada pelo TopBar,
 * pelo gating em App.jsx e pelo editor de permissões em Settings.
 */
export const MODULES = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'kanban',     label: 'Kanban',      icon: LayoutDashboard },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart2 },
  { id: 'raiox',      label: 'Raio-X',      icon: ScanLine },
  { id: 'riskshield', label: 'Risk Shield', icon: ShieldCheck },
]

/** Níveis de acesso de um papel a um módulo. */
export const ACCESS = {
  HIDDEN: 'hidden', // aba não aparece no menu
  LOCKED: 'locked', // aba aparece, mas bloqueada para interação (barreira cinza)
  FULL:   'full',   // aba normal, com interação
}

/** Páginas internas que pertencem a um módulo (ex.: sub-view do Analytics). */
const PAGE_TO_MODULE = { category: 'analytics' }

/** Resolve o módulo de uma página de navegação. */
export function pageToModule(page) {
  return PAGE_TO_MODULE[page] || page
}

/**
 * Nível de acesso efetivo de um papel a uma página/módulo.
 * Admin sempre tem acesso total. Default é 'full' (comportamento atual).
 */
export function accessLevel(perms, roleId, page) {
  if (roleId === 'admin') return ACCESS.FULL
  const moduleId = pageToModule(page)
  return perms?.[roleId]?.[moduleId] ?? ACCESS.FULL
}
