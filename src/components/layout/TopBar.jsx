import { useState } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { NotificationBell } from '../notifications/NotificationBell.jsx'
import { ROLES } from '../../constants/roles.js'
import useAppStore from '../../store/useAppStore.js'
import { cn } from '../../utils/cn.js'

const HEADER_BG = '#0D3125'

export function TopBar() {
  const currentUser = useAppStore(s => s.currentUser)
  const openForm = useAppStore(s => s.openForm)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearch = useAppStore(s => s.setSearch)
  const cards = useAppStore(s => s.cards)

  const role = ROLES[currentUser?.role]

  // Live search results
  const [searchFocused, setSearchFocused] = useState(false)
  const searchResults = searchQuery.trim().length >= 2
    ? cards.filter(c =>
        c.cardId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fornecedor?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : []

  return (
    <header
      className="flex items-center gap-4 px-4 py-3 flex-shrink-0"
      style={{ backgroundColor: HEADER_BG }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 w-16 justify-center flex-shrink-0">
        <div className="text-center">
          <p className="text-lg font-black text-white leading-none tracking-tight">stone.</p>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10 flex-shrink-0" />

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
          searchFocused ? 'bg-white/15 ring-2 ring-white/20' : 'bg-white/8 hover:bg-white/12'
        )}>
          <Search size={14} className="text-white/50 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar TCPS-XXXX ou fornecedor..."
            className="bg-transparent text-white placeholder-white/40 text-sm flex-1 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          />
          {searchQuery && (
            <button onClick={() => setSearch('')} className="text-white/40 hover:text-white/70">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            {searchResults.map(card => (
              <div
                key={card.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                onClick={() => { setSearch(''); }}
              >
                <span className="font-mono text-xs font-bold text-blue-600">{card.cardId}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{card.razaoSocial}</p>
                  <p className="text-xs text-gray-400">{card.categoria} · {card.comprador}</p>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  card.columnId === 'aprovado' ? 'bg-emerald-100 text-emerald-700' :
                  card.columnId === 'cancelado' ? 'bg-gray-100 text-gray-600' :
                  'bg-amber-100 text-amber-700'
                )}>
                  {card.approvalLevelLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications bell */}
        <NotificationBell />

        {/* User avatar + role */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div>
            <p className="text-white text-xs font-semibold leading-none text-right">{currentUser?.name}</p>
            <p className="text-white/50 text-xs leading-none text-right mt-0.5 capitalize">{role?.label}</p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: role?.badgeColor || '#0D3125' }}
          >
            {currentUser?.avatar}
          </div>
        </div>

        {/* New process button — Verde Escuro Stone #0D3125 */}
        {role?.canCreate && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#0D3125' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo Processo</span>
          </button>
        )}
      </div>
    </header>
  )
}
