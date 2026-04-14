import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { COLUMN_DEFS } from '../../constants/columns.js'
import { KanbanColumn } from './KanbanColumn.jsx'
import { canUserApproveColumn } from '../../algorithms/approvalRouter.js'
import useAppStore from '../../store/useAppStore.js'
import { ROLES } from '../../constants/roles.js'

export function KanbanBoard() {
  const cards = useAppStore(s => s.cards)
  const currentUser = useAppStore(s => s.currentUser)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearch   = useAppStore(s => s.setSearch)
  const openForm = useAppStore(s => s.openForm)
  const openApprovalPanel = useAppStore(s => s.openApprovalPanel)
  const moveCard = useAppStore(s => s.moveCard)
  const deleteCard = useAppStore(s => s.deleteCard)
  const [searchFocused, setSearchFocused] = useState(false)

  const [dragState, setDragState] = useState({ draggingCardId: null, overColumnId: null })

  const role = ROLES[currentUser?.role]
  const isAdmin = currentUser?.role === 'admin'

  /**
   * Per-card edit permission:
   * - Admin: always can edit (even locked cards)
   * - Comprador: can edit only if owner AND card is in 'aguardando' (not locked)
   * - Approvers: cannot edit cards
   */
  const canEditFn = (card) => {
    if (isAdmin) return true
    if (!role?.canEdit) return false
    if (card.isLocked) return false
    return card.compradorId === currentUser?.id
  }

  const handleDragStart = (e, cardId) => {
    setDragState(prev => ({ ...prev, draggingCardId: cardId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragState(prev => ({ ...prev, overColumnId: columnId }))
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    const { draggingCardId } = dragState
    if (draggingCardId && !['aprovado', 'cancelado'].includes(columnId)) {
      moveCard(draggingCardId, columnId)
    }
    setDragState({ draggingCardId: null, overColumnId: null })
  }

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, overColumnId: null }))
  }

  const handleDelete = (cardId) => {
    if (window.confirm('Excluir este card permanentemente?')) {
      deleteCard(cardId)
    }
  }

  const searchResults = searchQuery.trim().length >= 2
    ? cards.filter(c =>
        c.cardId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fornecedor?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
            searchFocused ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}>
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar TCPS-XXXX ou fornecedor..."
              className="bg-transparent text-gray-800 placeholder-gray-400 text-sm flex-1 focus:outline-none"
              value={searchQuery}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
            {searchQuery && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {searchResults.map(card => (
                <div key={card.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                  onClick={() => { openForm(card.id); setSearch('') }}>
                  <span className="font-mono text-xs font-bold text-blue-600">{card.cardId}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{card.razaoSocial}</p>
                    <p className="text-xs text-gray-400">{card.categoria} · {card.comprador}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">{cards.length} processo{cards.length !== 1 ? 's' : ''}</p>
      </div>

    <div className="flex gap-3 flex-1 overflow-x-auto pb-4 px-1 pt-1">
      {COLUMN_DEFS.map(column => {
        const colCards = cards.filter(c => c.columnId === column.id)
        const userCanApproveThisColumn = canUserApproveColumn(currentUser, column.id)

        return (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={colCards}
            canEditFn={canEditFn}
            canApprove={userCanApproveThisColumn}
            isDropTarget={dragState.overColumnId === column.id && !column.isTerminal}
            searchQuery={searchQuery}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragLeave={handleDragLeave}
            onEdit={(cardId) => openForm(cardId)}
            onApprove={(cardId) => openApprovalPanel(cardId)}
            onReject={(cardId) => openApprovalPanel(cardId)}
            onDelete={handleDelete}
            onCardDragStart={handleDragStart}
          />
        )
      })}
    </div>
    </div>
  )
}
