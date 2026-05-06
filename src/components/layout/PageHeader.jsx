import { Plus } from 'lucide-react'
import { NotificationBell } from '../notifications/NotificationBell.jsx'
import { ROLES } from '../../constants/roles.js'
import useAppStore from '../../store/useAppStore.js'

export function PageHeader({ title, subtitle, right }) {
  const currentUser = useAppStore(s => s.currentUser)
  const openForm    = useAppStore(s => s.openForm)
  const role        = ROLES[currentUser?.role]

  return (
    <header className="flex items-center justify-between gap-4 h-14 px-6 border-b border-line bg-white flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-ink leading-none truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-subtle mt-1 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {right}
        <NotificationBell />
        {role?.canCreate && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#10CB9A' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden md:inline">Novo Processo</span>
          </button>
        )}
      </div>
    </header>
  )
}
