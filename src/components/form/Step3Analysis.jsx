import { BarChart2, MessageSquare } from 'lucide-react'
import { VplBuilder } from './VplBuilder.jsx'

export function Step3Analysis({ formData, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 size={18} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800">Análise e Justificativa</h3>
      </div>

      <VplBuilder
        cashFlows={formData.vpl?.cashFlows || []}
        discountRate={formData.vpl?.discountRate || 12}
        moeda={formData.moeda || 'BRL'}
        onChange={(vplData) => onChange('vpl', vplData)}
      />

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} />
            Justificativa da Compra *
          </span>
        </label>
        <textarea
          rows={4}
          className={`w-full px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.justificativa ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          placeholder="Descreva a necessidade da compra, critérios de seleção do fornecedor, benefícios esperados..."
          value={formData.justificativa || ''}
          onChange={(e) => onChange('justificativa', e.target.value)}
        />
        {errors.justificativa && <p className="text-xs text-red-600 mt-1">{errors.justificativa}</p>}
        <p className="text-xs text-gray-400 mt-1">{(formData.justificativa || '').length} caracteres</p>
      </div>
    </div>
  )
}
