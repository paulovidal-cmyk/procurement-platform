import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, Type, Hash, Calendar, List, CheckSquare, ToggleLeft, X } from 'lucide-react'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { Button } from '../ui/Button.jsx'

const FIELD_TYPES = [
  { value: 'text',        label: 'Texto',           icon: Type },
  { value: 'number',      label: 'Número',          icon: Hash },
  { value: 'date',        label: 'Data',            icon: Calendar },
  { value: 'select',      label: 'Seleção (Dropdown)', icon: List },
  { value: 'multiselect', label: 'Múltipla Escolha', icon: CheckSquare },
  { value: 'boolean',     label: 'Sim / Não',       icon: ToggleLeft },
]

function generateKey(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40)
}

export function FieldForm({ field, onSave, onClose }) {
  const isEditing = !!field

  const [label, setLabel]     = useState(field?.label || '')
  const [key, setKey]         = useState(field?.key || '')
  const [type, setType]       = useState(field?.type || 'text')
  const [options, setOptions] = useState(field?.options?.join('\n') || '')
  const [required, setRequired] = useState(field?.required || false)
  const [errors, setErrors]   = useState({})

  const originalType = field?.type

  useEffect(() => {
    if (!isEditing) {
      setKey(generateKey(label))
    }
  }, [label, isEditing])

  const needsOptions = type === 'select' || type === 'multiselect'
  const typeChanged  = isEditing && type !== originalType

  const validate = () => {
    const e = {}
    if (!label.trim()) e.label = 'Obrigatório'
    if (!key.trim())   e.key   = 'Obrigatório'
    if (needsOptions && !options.trim()) e.options = 'Informe ao menos uma opção'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const parsedOptions = needsOptions
      ? options.split('\n').map(o => o.trim()).filter(Boolean)
      : []

    onSave({
      ...(field || {}),
      label: label.trim(),
      key: key.trim(),
      type,
      options: parsedOptions,
      required,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {isEditing ? 'Editar Campo' : 'Novo Campo Customizado'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Type change warning */}
          {typeChanged && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <p>Alterar o tipo de um campo existente pode afetar os dados já salvos em cards anteriores. Proceda com atenção.</p>
            </div>
          )}

          {/* Label */}
          <Input
            label="Label do Campo *"
            placeholder="Ex: Prazo de Entrega"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={errors.label}
            hint="Nome exibido no formulário para o Comprador"
          />

          {/* Key — auto-generated, readonly on edit */}
          <div>
            <Input
              label="Chave interna (key)"
              value={key}
              onChange={(e) => !isEditing && setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={isEditing}
              error={errors.key}
              hint={isEditing ? 'A chave não pode ser alterada após criação' : 'Auto-gerada. Usada para armazenar o valor no card.'}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Input *</label>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map(ft => {
                const Icon = ft.icon
                return (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => setType(ft.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      type === ft.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="text-xs font-medium">{ft.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Options — only for select/multiselect */}
          {needsOptions && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Opções *</label>
              <textarea
                rows={5}
                className={`w-full px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                  errors.options ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={"15 dias\n30 dias\n45 dias\n60 dias"}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
              {errors.options
                ? <p className="text-xs text-red-600 mt-1">{errors.options}</p>
                : <p className="text-xs text-gray-400 mt-1">Uma opção por linha</p>
              }
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Campo Obrigatório</p>
              <p className="text-xs text-gray-500">Comprador precisa preencher para submeter</p>
            </div>
            <button
              type="button"
              onClick={() => setRequired(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${required ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${required ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm"
            style={{ backgroundColor: '#0D3125' }}
          >
            <Plus size={15} />
            {isEditing ? 'Salvar Alterações' : 'Adicionar Campo'}
          </button>
        </div>
      </div>
    </div>
  )
}
