import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { maskCNPJ, validateCNPJ } from '../../algorithms/cnpjValidator.js'
import { OcrUploader } from './OcrUploader.jsx'
import { CATEGORIES } from '../../constants/categories.js'

const BASELINE_TYPES = [
  { value: 'MPE', label: 'MPE', desc: 'Micro/Pequeno Porte' },
  { value: 'Histórico', label: 'Histórico', desc: 'Compras anteriores' },
  { value: 'Orçamento', label: 'Orçamento', desc: 'Cotação recebida' },
]

export function Step1Supplier({ formData, onChange, errors, isLocked }) {
  const [cnpjTouched, setCnpjTouched] = useState(false)

  const handleCNPJChange = (e) => {
    if (isLocked) return
    onChange('cnpj', maskCNPJ(e.target.value))
  }

  const cnpjValidation = cnpjTouched && formData.cnpj ? validateCNPJ(formData.cnpj) : null

  const handleOcrParsed = (data) => {
    if (isLocked) return
    if (data.cnpj) onChange('cnpj', data.cnpj)
    if (data.razaoSocial) onChange('razaoSocial', data.razaoSocial)
    if (data.fornecedor) onChange('fornecedor', data.fornecedor)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={18} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800">Dados do Fornecedor</h3>
      </div>

      {!isLocked && <OcrUploader onParsed={handleOcrParsed} />}

      {isLocked && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          <span className="text-base">🔒</span>
          Campos travados — card em fluxo de aprovação. Somente Admin pode editar.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="CNPJ *"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj || ''}
            onChange={handleCNPJChange}
            onBlur={() => setCnpjTouched(true)}
            disabled={isLocked}
            error={
              errors.cnpj ||
              (cnpjTouched && formData.cnpj && !validateCNPJ(formData.cnpj).valid
                ? validateCNPJ(formData.cnpj).error : null)
            }
            hint={cnpjTouched && formData.cnpj && validateCNPJ(formData.cnpj).valid ? '✓ CNPJ válido' : null}
            maxLength={18}
          />
        </div>
        <Input
          label="Nome Fantasia"
          placeholder="Ex: TechSupply"
          value={formData.fornecedor || ''}
          onChange={(e) => onChange('fornecedor', e.target.value)}
          disabled={isLocked}
          error={errors.fornecedor}
        />
      </div>

      <Input
        label="Razão Social *"
        placeholder="Nome completo conforme CNPJ"
        value={formData.razaoSocial || ''}
        onChange={(e) => onChange('razaoSocial', e.target.value)}
        disabled={isLocked}
        error={errors.razaoSocial}
      />

      <Select
        label="Categoria *"
        value={formData.categoria || ''}
        onChange={(e) => onChange('categoria', e.target.value)}
        disabled={isLocked}
        error={errors.categoria}
      >
        <option value="">Selecione a categoria...</option>
        {CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </Select>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Baseline *</label>
        <div className="grid grid-cols-3 gap-3">
          {BASELINE_TYPES.map(bt => (
            <button
              key={bt.value}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && onChange('tipoBaseline', bt.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                formData.tipoBaseline === bt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className={`text-sm font-semibold ${formData.tipoBaseline === bt.value ? 'text-blue-700' : 'text-gray-800'}`}>
                {bt.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{bt.desc}</p>
            </button>
          ))}
        </div>
        {errors.tipoBaseline && <p className="text-xs text-red-600 mt-1">{errors.tipoBaseline}</p>}
      </div>
    </div>
  )
}
