import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Lock, Type, Hash,
         Calendar, List, CheckSquare, ToggleLeft, GripVertical, Sparkles } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'
import { FieldForm } from './FieldForm.jsx'

const TYPE_META = {
  text:        { label: 'Texto',            icon: Type,        color: 'bg-blue-100 text-blue-700' },
  number:      { label: 'Número',           icon: Hash,        color: 'bg-purple-100 text-purple-700' },
  date:        { label: 'Data',             icon: Calendar,    color: 'bg-amber-100 text-amber-700' },
  select:      { label: 'Dropdown',         icon: List,        color: 'bg-emerald-100 text-emerald-700' },
  multiselect: { label: 'Múltipla Escolha', icon: CheckSquare, color: 'bg-cyan-100 text-cyan-700' },
  boolean:     { label: 'Sim / Não',        icon: ToggleLeft,  color: 'bg-rose-100 text-rose-700' },
}

const CORE_FIELDS = [
  { label: 'CNPJ', key: 'cnpj', type: 'text' },
  { label: 'Razão Social', key: 'razaoSocial', type: 'text' },
  { label: 'Categoria', key: 'categoria', type: 'select' },
  { label: 'Valor Baseline', key: 'valorBaseline', type: 'number' },
  { label: 'Valor Final', key: 'valorFinal', type: 'number' },
  { label: 'Tipo de Saving', key: 'tipoSaving', type: 'select' },
  { label: 'Justificativa', key: 'justificativa', type: 'text' },
]

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.text
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

export function FieldManager() {
  const customFields    = useAppStore(s => s.customFields)
  const addCustomField  = useAppStore(s => s.addCustomField)
  const updateCustomField = useAppStore(s => s.updateCustomField)
  const deleteCustomField = useAppStore(s => s.deleteCustomField)
  const reorderField    = useAppStore(s => s.reorderField)

  const [modal, setModal] = useState(null) // null | 'add' | { field }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // fieldId

  const sorted = [...customFields].sort((a, b) => a.order - b.order)

  const handleSave = (data) => {
    if (modal === 'add') {
      addCustomField(data)
    } else {
      updateCustomField(modal.field.id, data)
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Campos Customizados do Formulário</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Campos adicionais exibidos no formulário de Novo Processo para todos os Compradores.
          </p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#0D3125' }}
        >
          <Plus size={15} />
          Adicionar Campo
        </button>
      </div>

      {/* Custom fields list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Sparkles size={14} className="text-emerald-600" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Campos Personalizados · {sorted.length} campo{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Plus size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Nenhum campo customizado ainda</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Campo" para começar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Chave</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Opções</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Obrig.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((field, idx) => (
                <tr key={field.id} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors group">
                  {/* Order arrows */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => reorderField(field.id, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default transition-colors"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => reorderField(field.id, 'down')}
                        disabled={idx === sorted.length - 1}
                        className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default transition-colors"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </td>

                  {/* Label */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{field.label}</span>
                  </td>

                  {/* Key */}
                  <td className="px-4 py-3">
                    <code className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                      {field.key}
                    </code>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <TypeBadge type={field.type} />
                  </td>

                  {/* Options */}
                  <td className="px-4 py-3">
                    {field.options?.length > 0 ? (
                      <span className="text-xs text-gray-500">
                        {field.options.slice(0, 2).join(', ')}
                        {field.options.length > 2 && (
                          <span className="text-gray-400"> +{field.options.length - 2}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Required */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      field.required
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {field.required ? 'Sim' : 'Não'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal({ field })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Editar campo"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(field.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Excluir campo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Core fields (protected, informational) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Lock size={13} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Campos do Sistema · Protegidos
          </span>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {CORE_FIELDS.map((field, i) => (
              <tr key={field.key} className={`${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <td className="px-4 py-2.5 w-8">
                  <Lock size={11} className="text-gray-300" />
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-sm text-gray-500">{field.label}</span>
                </td>
                <td className="px-4 py-2.5">
                  <code className="text-[11px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded font-mono">
                    {field.key}
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  <TypeBadge type={field.type} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    não editável
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {modal !== null && (
        <FieldForm
          field={modal === 'add' ? null : modal.field}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Excluir Campo</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5 bg-gray-50 rounded-xl p-3">
              Campos já preenchidos em cards existentes perderão este valor. Confirma a exclusão?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteCustomField(deleteConfirm); setDeleteConfirm(null) }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
