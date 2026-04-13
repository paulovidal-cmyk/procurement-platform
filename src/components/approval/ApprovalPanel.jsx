import { useState } from 'react'
import { CheckCircle, XCircle, X, Clock, TrendingDown, Shield, Lock } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { formatCurrency, formatDateTime } from '../../utils/formatters.js'
import useAppStore from '../../store/useAppStore.js'
import { canUserApproveColumn } from '../../algorithms/approvalRouter.js'
import { COLUMN_MAP } from '../../constants/columns.js'
import { CATEGORY_MAP } from '../../constants/categories.js'

const STONE_GREEN = '#10CB9A'

export function ApprovalPanel() {
  const isOpen = useAppStore(s => s.uiState.isApprovalPanelOpen)
  const approvingCardId = useAppStore(s => s.uiState.approvingCardId)
  const cards = useAppStore(s => s.cards)
  const currentUser = useAppStore(s => s.currentUser)
  const approveCard = useAppStore(s => s.approveCard)
  const rejectCard = useAppStore(s => s.rejectCard)
  const closeApprovalPanel = useAppStore(s => s.closeApprovalPanel)

  const [comment, setComment] = useState('')

  const card = cards.find(c => c.id === approvingCardId)
  if (!isOpen || !card) return null

  const userCanApprove = canUserApproveColumn(currentUser, card.columnId)
  const col = COLUMN_MAP[card.columnId]
  const catConfig = CATEGORY_MAP[card.categoria]

  const handleApprove = () => {
    approveCard(card.id, comment)
    setComment('')
  }

  const handleReject = () => {
    if (!comment.trim()) return
    rejectCard(card.id, comment)
    setComment('')
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={closeApprovalPanel} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[400px] bg-white shadow-2xl flex flex-col">

        {/* Header — Stone green accent */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200"
          style={{ borderTopWidth: '3px', borderTopColor: STONE_GREEN }}>
          <div>
            <p className="font-mono text-xs font-bold text-blue-600">{card.cardId}</p>
            <h2 className="font-bold text-gray-900">Decisão de Aprovação</h2>
          </div>
          <button onClick={closeApprovalPanel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Card summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div>
              <p className="font-bold text-gray-900">{card.razaoSocial}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.cnpj}</p>
            </div>

            {card.categoria && (
              <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ backgroundColor: (catConfig?.color || '#6B7280') + '20', color: catConfig?.color || '#6B7280' }}>
                {card.categoria}
              </span>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-500">Valor Final</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{formatCurrency(card.valorFinal, card.moeda)}</p>
              </div>
              <div className={`rounded-xl p-3 ${card.isNegative ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                <p className="text-xs text-gray-500">Saving</p>
                <p className={`font-bold text-sm mt-0.5 ${card.isNegative ? 'text-orange-600' : 'text-emerald-700'}`}>
                  {formatCurrency(card.savingValue, card.moeda)}
                  {card.savingPercent !== null && (
                    <span className="text-xs ml-1 font-medium">({card.savingPercent?.toFixed(1)}%)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {card.tipoSaving === 'Hard' ? (
                <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  <TrendingDown size={10} />Hard Saving
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  <Shield size={10} />Cost Avoidance
                </span>
              )}
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{card.tipoBaseline}</span>
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                <Lock size={9} />Imutável
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Justificativa</p>
              <p className="text-sm text-gray-700 leading-relaxed">{card.justificativa}</p>
            </div>
          </div>

          {/* Current stage */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: (col?.color || '#888') + '15' }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col?.color }} />
            <span className="text-sm font-semibold" style={{ color: col?.color }}>{col?.label}</span>
          </div>

          {/* Approval history */}
          {card.approvalHistory.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Clock size={12} />Histórico de decisões
              </h4>
              <div className="space-y-2">
                {card.approvalHistory.map((event, idx) => (
                  <div key={idx} className="flex gap-3 text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${event.action === 'aprovado' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800 text-xs">{event.actor}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${event.action === 'aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {event.action}
                        </span>
                      </div>
                      {event.comment && <p className="text-gray-600 text-xs mt-0.5">{event.comment}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(event.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action area */}
          {userCanApprove && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Comentário <span className="text-gray-400 font-normal">(obrigatório para rejeitar)</span>
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Adicione um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          )}

          {!userCanApprove && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-700">
                Esta etapa requer aprovação de <strong>{col?.label?.replace('Aprovação ', '')}</strong>.
                Você não tem permissão para este estágio.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {userCanApprove && (
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleReject}
              disabled={!comment.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#EF4444' }}
            >
              <XCircle size={16} />
              Reprovar
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: STONE_GREEN }}
            >
              <CheckCircle size={16} />
              Aprovar
            </button>
          </div>
        )}
      </div>
    </>
  )
}
