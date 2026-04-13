import { TrendingDown, Shield, User, CheckCircle, XCircle, Edit3, Trash2, Zap, Lock, Eye } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.js'
import { CATEGORY_MAP } from '../../constants/categories.js'
import { cn } from '../../utils/cn.js'

const LEVEL_COLORS = {
  fast_track:  'bg-emerald-100 text-emerald-700',
  coordenacao: 'bg-sky-100 text-sky-700',
  gestor:      'bg-blue-100 text-blue-700',
  diretor:     'bg-blue-900/20 text-blue-900',
}

export function KanbanCard({
  card,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  canEdit,       // full edit permission (owner + not locked, or admin)
  canApprove,
  searchQuery,
}) {
  const isApprovalColumn = ['coordenacao', 'gestor', 'diretor'].includes(card.columnId)
  const isTerminal = ['aprovado', 'cancelado'].includes(card.columnId)
  const catConfig = CATEGORY_MAP[card.categoria]

  // Read-only: card is locked and user isn't admin (canEdit would be false via canEditFn)
  const isReadOnly = card.isLocked && !canEdit

  const isHighlighted = searchQuery && (
    card.cardId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.fornecedor?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const isDimmed = searchQuery && searchQuery.length >= 2 && !isHighlighted

  return (
    <div
      className={cn(
        'kanban-card bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-3 group',
        isDimmed ? 'opacity-25' : 'opacity-100',
        isHighlighted && 'ring-2 ring-blue-400 shadow-md',
        card.isNegative ? 'border-orange-200' : 'border-gray-200',
        isReadOnly && 'cursor-default',
        !isReadOnly && !isTerminal && 'cursor-grab',
      )}
    >
      {/* ── Top row: TCPS ID + indicators ── */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] font-bold text-blue-600">{card.cardId}</span>
        <div className="flex items-center gap-1">
          {isReadOnly && (
            <span title="Somente leitura">
              <Eye size={11} className="text-gray-400" />
            </span>
          )}
          {card.isLocked && !isTerminal && !isReadOnly && (
            <span title="Imutável — em aprovação">
              <Lock size={11} className="text-amber-500" />
            </span>
          )}
          {card.tipoSaving === 'Hard' ? (
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 leading-4">
              <TrendingDown size={9} />Hard
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 leading-4">
              <Shield size={9} />Avoid
            </Badge>
          )}
          {card.approvalLevel === 'fast_track' && (
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 leading-4">
              <Zap size={9} />FT
            </Badge>
          )}
        </div>
      </div>

      {/* ── Supplier ── */}
      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
        {card.razaoSocial}
      </p>

      {/* ── Category + Comprador ── */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {card.categoria && (
          <span
            className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: (catConfig?.color || '#6B7280') + '18',
              color: catConfig?.color || '#6B7280',
            }}
          >
            {card.categoria}
          </span>
        )}
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <User size={10} />
          <span className="truncate max-w-[90px]">{card.comprador}</span>
        </div>
      </div>

      {/* ── Value + Saving ── */}
      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400">Final</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(card.valorFinal, card.moeda)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">Saving</p>
          <span className={cn(
            'text-sm font-bold',
            card.isNegative ? 'text-orange-600' : 'text-emerald-600'
          )}>
            {card.savingPercent !== null
              ? `${card.savingPercent >= 0 ? '+' : ''}${card.savingPercent?.toFixed(1)}%`
              : '—'}
          </span>
        </div>
      </div>

      {/* ── Footer: alçada + actions ── */}
      <div className="flex items-center justify-between mt-2">
        <Badge className={cn('text-[10px]', LEVEL_COLORS[card.approvalLevel] || 'bg-gray-100 text-gray-600')}>
          {card.approvalLevelLabel}
        </Badge>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Aprovar / Reprovar — only for approvers in the right column */}
          {canApprove && isApprovalColumn && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(card.id) }}
                className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                title="Aprovar"
              >
                <CheckCircle size={14} className="text-emerald-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(card.id) }}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Reprovar"
              >
                <XCircle size={14} className="text-red-500" />
              </button>
            </>
          )}

          {/* Edit — owner in aguardando, or admin for any non-terminal */}
          {canEdit && !isTerminal && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(card.id) }}
              className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              title={card.isLocked ? 'Editar (Admin)' : 'Editar'}
            >
              <Edit3 size={14} className={card.isLocked ? 'text-orange-500' : 'text-blue-500'} />
            </button>
          )}

          {/* View only — show eye icon to open read-only form */}
          {isReadOnly && !isTerminal && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(card.id) }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Visualizar (somente leitura)"
            >
              <Eye size={14} className="text-gray-400" />
            </button>
          )}

          {/* Delete — admin or owner when not locked */}
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
