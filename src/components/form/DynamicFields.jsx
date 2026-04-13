import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { cn } from '../../utils/cn.js'

/**
 * Renders dynamic form fields defined by the admin's customFields config.
 * Values are stored/read from `values` object keyed by field.key.
 */
export function DynamicFields({ fields, values = {}, onChange, disabled = false, errors = {} }) {
  if (!fields || fields.length === 0) return null

  const sorted = [...fields].sort((a, b) => a.order - b.order)

  return (
    <div className="grid grid-cols-2 gap-4">
      {sorted.map(field => {
        const value = values[field.key] ?? ''
        const error = errors[`dynamic_${field.key}`]
        const label = `${field.label}${field.required ? ' *' : ''}`

        switch (field.type) {
          case 'text':
            return (
              <Input
                key={field.id}
                label={label}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                error={error}
              />
            )

          case 'number':
            return (
              <Input
                key={field.id}
                label={label}
                type="number"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                error={error}
              />
            )

          case 'date':
            return (
              <Input
                key={field.id}
                label={label}
                type="date"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                error={error}
              />
            )

          case 'select':
            return (
              <Select
                key={field.id}
                label={label}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                error={error}
              >
                <option value="">Selecione...</option>
                {(field.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            )

          case 'multiselect':
            return (
              <div key={field.id} className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
                <div className="flex flex-wrap gap-2">
                  {(field.options || []).map(opt => {
                    const selected = (value || []).includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return
                          const current = Array.isArray(value) ? value : []
                          onChange(field.key, selected ? current.filter(v => v !== opt) : [...current, opt])
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border-2 transition-all font-medium',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                          disabled && 'opacity-60 cursor-default'
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              </div>
            )

          case 'boolean':
            return (
              <div key={field.id}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
                <div className="flex gap-2">
                  {[
                    { v: true,  label: 'Sim', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                    { v: false, label: 'Não', active: 'border-red-400 bg-red-50 text-red-600' },
                  ].map(opt => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && onChange(field.key, opt.v)}
                      className={cn(
                        'flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
                        value === opt.v ? opt.active : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        disabled && 'opacity-60 cursor-default'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
