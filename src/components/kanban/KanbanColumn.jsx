import { Package } from 'lucide-react'
import { KanbanCard } from './KanbanCard.jsx'
import { cn } from '../../utils/cn.js'

function compact(value) {
  if (value === 0) return '—'
  if (Math.abs(value) >= 1_000_000)
    return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000)
    return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

export function KanbanColumn({
  column, cards, canEditFn, canApprove, isDropTarget,
  onDragOver, onDrop, onDragLeave,
  onEdit, onApprove, onReject, onDelete, onCardDragStart,
  searchQuery,
}) {
  const totalValue = cards.reduce((s, c) => s + (c.valorFinal || 0), 0)
  const totalSaving = cards.reduce((s, c) => s + (c.savingValue > 0 ? c.savingValue : 0), 0)

  return (
    <div
      className={cn(
        'kanban-column flex flex-col w-64 flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden',
        isDropTarget ? 'border-blue-400 shadow-md' : 'border-transparent'
      )}
      style={{ backgroundColor: column.bodyBg }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      {/* ── Column Header ── */}
      <div
        className="px-3 py-2.5 flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: column.headerColor }}
      >
        <p
          className="text-xs font-bold leading-tight"
          style={{ color: column.headerText }}
        >
          {column.label}
        </p>
        <div
          className="rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.18)', color: column.headerText }}
        >
          {cards.length}
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <div
        className="grid grid-cols-3 px-2.5 py-2 border-b text-center flex-shrink-0"
        style={{
          backgroundColor: column.headerColor + '30',
          borderColor: column.headerColor + '40',
        }}
      >
        <div>
          <p className="text-[10px] text-gray-500 font-medium">Cards</p>
          <p className="text-xs font-bold text-gray-800">{cards.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-medium">Total</p>
          <p className="text-xs font-bold text-gray-800">{compact(totalValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-medium">Saving</p>
          <p className="text-xs font-bold text-emerald-700">{compact(totalSaving)}</p>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-16">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <Package size={22} className="mb-1.5 opacity-30" />
            <p className="text-xs">Nenhum item</p>
          </div>
        ) : (
          cards.map(card => {
            const cardCanEdit = canEditFn(card)
            return (
              <div
                key={card.id}
                draggable={cardCanEdit && !column.isTerminal && !card.isLocked}
                onDragStart={(e) => onCardDragStart(e, card.id)}
              >
                <KanbanCard
                  card={card}
                  canEdit={cardCanEdit}
                  canApprove={canApprove}
                  searchQuery={searchQuery}
                  onEdit={onEdit}
                  onApprove={onApprove}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              </div>
            )
          })
        )}
      </div>

      {isDropTarget && (
        <div
          className="m-2 border-2 border-dashed rounded-lg py-2 text-center text-xs font-medium"
          style={{ borderColor: column.headerColor, color: column.headerColor, backgroundColor: column.headerColor + '10' }}
        >
          Soltar aqui
        </div>
      )}
    </div>
  )
}
