import { useState } from 'react'
import {
  Home, LayoutDashboard, BarChart2, ScanLine, ShieldCheck,
  Settings, MoreHorizontal, LogOut,
} from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'
import { ROLES } from '../../constants/roles.js'
import { cn } from '../../utils/cn.js'

const NAV = [
  { id: 'home',       icon: Home,            label: 'Home' },
  { id: 'kanban',     icon: LayoutDashboard, label: 'Kanban' },
  { id: 'analytics',  icon: BarChart2,       label: 'Analytics' },
  { id: 'raiox',      icon: ScanLine,        label: 'Raio-X de Preços' },
  { id: 'riskshield', icon: ShieldCheck,     label: 'Risk Shield' },
]

function StoneMark({ onClick }) {
  const [imgError, setImgError] = useState(false)
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 h-14 focus:outline-none w-full"
      aria-label="Stone"
    >
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Stone"
          onError={() => setImgError(true)}
          className="h-6 w-auto object-contain"
        />
      ) : (
        <span className="text-lg font-black tracking-tight text-ink">stone.</span>
      )}
    </button>
  )
}

function NavItem({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 w-full h-9 px-3 rounded-xl text-sm font-medium transition-colors',
        active
          ? 'bg-brand-tint text-brand'
          : 'text-muted hover:bg-gray-50 hover:text-ink'
      )}
    >
      <Icon size={16} className={cn('flex-shrink-0', active ? 'text-brand' : 'text-subtle group-hover:text-ink')} />
      <span className="truncate">{label}</span>
    </button>
  )
}

export function Sidebar() {
  const currentUser = useAppStore(s => s.currentUser)
  const currentPage = useAppStore(s => s.currentPage)
  const navigate    = useAppStore(s => s.navigate)
  const logout      = useAppStore(s => s.logout)
  const role        = ROLES[currentUser?.role]
  const isAdmin     = currentUser?.role === 'admin'
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (id) => {
    if (id === currentPage) return true
    if (id === 'analytics' && currentPage === 'category') return true
    return false
  }

  return (
    <aside className="flex flex-col flex-shrink-0 w-[220px] h-full bg-white border-r border-line">
      {/* Logo */}
      <div className="border-b border-line">
        <StoneMark onClick={() => navigate('home')} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem
            key={item.id}
            active={isActive(item.id)}
            icon={item.icon}
            label={item.label}
            onClick={() => navigate(item.id)}
          />
        ))}

        {isAdmin && (
          <>
            <div className="h-px bg-line my-2 mx-1" />
            <NavItem
              active={currentPage === 'settings'}
              icon={Settings}
              label="Configurações"
              onClick={() => navigate('settings')}
            />
          </>
        )}
      </nav>

      {/* User chip */}
      <div className="relative border-t border-line p-2">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: role?.badgeColor || '#0D3125' }}>
            {currentUser?.avatar}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-ink truncate leading-tight">{currentUser?.name}</p>
            <p className="text-[10px] text-subtle truncate leading-tight mt-0.5 capitalize">{role?.label}</p>
          </div>
          <MoreHorizontal size={14} className="text-subtle flex-shrink-0" />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-white border border-line rounded-xl shadow-card overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); logout() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <LogOut size={13} className="text-subtle" />
              Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
