import { useState } from 'react'
import { COLUMN_DEFS } from '../../constants/columns.js'
import { KanbanColumn } from './KanbanColumn.jsx'
import { canUserApproveColumn } from '../../algorithms/approvalRouter.js'
import useAppStore from '../../store/useAppStore.js'
import { ROLES } from '../../constants/roles.js'

export function KanbanBoard() {
  const cards = useAppStore(s => s.cards)
  const currentUser = useAppStore(s => s.currentUser)
  const searchQuery = useAppStore(s => s.searchQuery)
  const openForm = useAppStore(s => s.openForm)
  const openApprovalPanel = useAppStore(s => s.openApprovalPanel)
  const moveCard = useAppStore(s => s.moveCard)
  const deleteCard = useAppStore(s => s.deleteCard)

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

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-4 px-1 pt-1">
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
  )
}
