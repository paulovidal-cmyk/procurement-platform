import { useState } from 'react'
import { Plus, Settings, Gavel, LayoutDashboard, BarChart2, Home, ScanLine } from 'lucide-react'
import { NotificationBell } from '../notifications/NotificationBell.jsx'
import { ROLES } from '../../constants/roles.js'
import useAppStore from '../../store/useAppStore.js'
import { cn } from '../../utils/cn.js'

const BG = '#0D3125'

const NAV = [
  { id: 'home',      icon: Home,           label: 'Home' },
  { id: 'kanban',    icon: LayoutDashboard, label: 'Kanban' },
  { id: 'analytics', icon: BarChart2,       label: 'Analytics' },
  { id: 'raiox',     icon: ScanLine,        label: 'Raio-X de Preços' },
  { id: 'leilao',    icon: Gavel,           label: 'Leilão Eletrônico' },
]

function StoneLogo({ onClick }) {
  const [imgError, setImgError] = useState(false)
  return (
    <button onClick={onClick} className="flex items-center flex-shrink-0 focus:outline-none group">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Stone"
          onError={() => setImgError(true)}
          className="h-7 w-auto object-contain"
        />
      ) : (
        <span className="text-xl font-black tracking-tight text-white group-hover:opacity-80 transition-opacity">
          stone.
        </span>
      )}
    </button>
  )
}

export function TopBar() {
  const currentUser = useAppStore(s => s.currentUser)
  const currentPage = useAppStore(s => s.currentPage)
  const navigate    = useAppStore(s => s.navigate)
  const openForm    = useAppStore(s => s.openForm)
  const role        = ROLES[currentUser?.role]
  const isAdmin     = currentUser?.role === 'admin'

  return (
    <header
      className="flex items-center gap-6 px-5 py-0 flex-shrink-0 h-14"
      style={{ backgroundColor: BG, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo → Home */}
      <StoneLogo onClick={() => navigate('home')} />

      <div className="w-px h-5 bg-white/10 flex-shrink-0" />

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id ||
            (item.id === 'analytics' && currentPage === 'category') ||
            (item.id === 'raiox' && currentPage === 'raiox')
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'relative flex items-center gap-2 px-3 h-14 text-sm font-medium transition-all',
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
              )}
            >
              <Icon size={14} />
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: '#10CB9A' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationBell />

        {/* Settings — admin only */}
        {isAdmin && (
          <button
            onClick={() => navigate('settings')}
            title="Configurações"
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              currentPage === 'settings'
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/80 hover:bg-white/8'
            )}
          >
            <Settings size={16} />
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-white text-xs font-semibold leading-none">{currentUser?.name}</p>
            <p className="text-white/40 text-[10px] leading-none mt-0.5 capitalize">{role?.label}</p>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: role?.badgeColor || BG }}>
            {currentUser?.avatar}
          </div>
        </div>

        {/* Novo Processo */}
        {role?.canCreate && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 ml-1"
            style={{ backgroundColor: '#10CB9A' }}
          >
            <Plus size={15} />
            <span className="hidden md:inline">Novo Processo</span>
          </button>
        )}
      </div>
    </header>
  )
}
