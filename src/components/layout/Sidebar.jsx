import { LayoutDashboard, BarChart2, HelpCircle, Settings, LogOut } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import useAppStore from '../../store/useAppStore.js'
import { ROLES } from '../../constants/roles.js'

const NAV_ITEMS = [
  { id: 'kanban', icon: LayoutDashboard, label: 'Kanban' },
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { id: 'help', icon: HelpCircle, label: 'Guia' },
]

export function Sidebar() {
  const currentPage = useAppStore(s => s.currentPage)
  const currentUser = useAppStore(s => s.currentUser)
  const navigate = useAppStore(s => s.navigate)
  const logout = useAppStore(s => s.logout)

  const role = ROLES[currentUser?.role]
  const canAccessSettings = role?.canAccessSettings

  return (
    <aside
      className="flex flex-col items-center py-4 gap-2 w-16 flex-shrink-0 border-r border-white/10"
      style={{ backgroundColor: '#0A2B1F' }}
    >
      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              title={item.label}
              className={cn(
                'relative group w-full flex flex-col items-center py-2.5 px-1 rounded-xl transition-all',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-medium leading-none">{item.label}</span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: '#10CB9A' }} />
              )}
            </button>
          )
        })}

        {/* Settings (admin only) */}
        {canAccessSettings && (
          <button
            onClick={() => navigate('settings')}
            title="Configurações"
            className={cn(
              'relative group w-full flex flex-col items-center py-2.5 px-1 rounded-xl transition-all',
              currentPage === 'settings'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
            )}
          >
            <Settings size={20} />
            <span className="text-[10px] mt-1 font-medium leading-none">Config</span>
            {currentPage === 'settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                style={{ backgroundColor: '#10CB9A' }} />
            )}
          </button>
        )}
      </nav>

      {/* Logout */}
      <div className="px-2 w-full">
        <button
          onClick={logout}
          title="Sair"
          className="w-full flex flex-col items-center py-2.5 px-1 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span className="text-[10px] mt-1">Sair</span>
        </button>
      </div>
    </aside>
  )
}
