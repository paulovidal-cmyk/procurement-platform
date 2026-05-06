import { useState } from 'react'
import {
  Plus, Settings, LayoutDashboard, BarChart2, Home, ScanLine, ShieldCheck, LogOut, ChevronDown,
} from 'lucide-react'
import { NotificationBell } from '../notifications/NotificationBell.jsx'
import { ROLES } from '../../constants/roles.js'
import useAppStore from '../../store/useAppStore.js'
import { cn } from '../../utils/cn.js'

const NAV = [
  { id: 'home',       icon: Home,            label: 'Home' },
  { id: 'kanban',     icon: LayoutDashboard, label: 'Kanban' },
  { id: 'analytics',  icon: BarChart2,       label: 'Analytics' },
  { id: 'raiox',      icon: ScanLine,        label: 'Raio-X' },
  { id: 'riskshield', icon: ShieldCheck,     label: 'Risk Shield' },
]

function StoneLogo({ onClick }) {
  const [imgError, setImgError] = useState(false)
  return (
    <button onClick={onClick} className="flex items-center flex-shrink-0 focus:outline-none">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Stone"
          onError={() => setImgError(true)}
          className="h-7 w-auto object-contain"
        />
      ) : (
        <span className="text-lg font-black tracking-tight text-ink">stone.</span>
      )}
    </button>
  )
}

export function TopBar() {
  const currentUser = useAppStore(s => s.currentUser)
  const currentPage = useAppStore(s => s.currentPage)
  const navigate    = useAppStore(s => s.navigate)
  const openForm    = useAppStore(s => s.openForm)
  const logout      = useAppStore(s => s.logout)
  const role        = ROLES[currentUser?.role]
  const isAdmin     = currentUser?.role === 'admin'
  const [userOpen, setUserOpen] = useState(false)

  const isActive = (id) => {
    if (id === currentPage) return true
    if (id === 'analytics' && currentPage === 'category') return true
    return false
  }

  return (
    <header className="flex items-center gap-6 px-5 h-14 flex-shrink-0 bg-white border-b border-line">
      <StoneLogo onClick={() => navigate('home')} />

      <div className="w-px h-5 bg-line flex-shrink-0" />

      {/* Nav */}
      <nav className="flex items-center gap-0.5 flex-1">
        {NAV.map(item => {
          const Icon = item.icon
          const active = isActive(item.id)
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'relative flex items-center gap-1.5 h-14 px-3 text-[13px] font-medium transition-colors',
                active ? 'text-ink' : 'text-muted hover:text-ink'
              )}
            >
              <Icon size={14} className={active ? 'text-brand' : ''} />
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full bg-brand" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationBell />

        {isAdmin && (
          <button
            onClick={() => navigate('settings')}
            title="Configurações"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              currentPage === 'settings'
                ? 'bg-brand-tint text-brand'
                : 'text-muted hover:text-ink hover:bg-gray-50'
            )}
          >
            <Settings size={16} />
          </button>
        )}

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setUserOpen(o => !o)}
            className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: role?.badgeColor || '#0D3125' }}>
              {currentUser?.avatar}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-[11px] font-semibold text-ink">{currentUser?.name?.split(' ')[0]}</p>
              <p className="text-[9px] text-subtle capitalize">{role?.label}</p>
            </div>
            <ChevronDown size={12} className="text-subtle" />
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-11 w-56 bg-white border border-line rounded-2xl shadow-card overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b border-line">
                  <p className="text-xs font-semibold text-ink truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-subtle truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => { setUserOpen(false); logout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-ink hover:bg-gray-50"
                >
                  <LogOut size={13} className="text-subtle" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>

        {role?.canCreate && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold text-white bg-brand hover:bg-brand-hover transition-all active:scale-[0.98]"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden md:inline">Novo Processo</span>
          </button>
        )}
      </div>
    </header>
  )
}
