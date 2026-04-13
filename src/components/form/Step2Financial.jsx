import { TrendingDown, Shield, DollarSign, AlertTriangle, Lock } from 'lucide-react'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { calculateSaving } from '../../algorithms/savingCalculator.js'
import { routeCard } from '../../algorithms/approvalRouter.js'
import { formatCurrency } from '../../utils/formatters.js'

const PAYMENT_TERMS = ['7', '14', '21', '28', '30', '45', '60', '90', '120']

export function Step2Financial({ formData, onChange, errors, isLocked }) {
  const saving = calculateSaving(formData.valorBaseline, formData.valorFinal, formData.tipoSaving)
  const route = formData.valorFinal ? routeCard(formData.valorFinal, formData.moeda) : null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign size={18} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800">Dados Financeiros</h3>
        {isLocked && (
          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full ml-auto">
            <Lock size={11} />
            Imutável — em aprovação
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Moeda"
          value={formData.moeda || 'BRL'}
          onChange={(e) => onChange('moeda', e.target.value)}
          disabled={isLocked}
        >
          <option value="BRL">BRL — Real</option>
          <option value="USD">USD — Dólar</option>
          <option value="EUR">EUR — Euro</option>
        </Select>

        <Select
          label="Prazo de Pagamento"
          value={formData.prazoPagamento || '30'}
          onChange={(e) => onChange('prazoPagamento', e.target.value)}
          error={errors.prazoPagamento}
        >
          {PAYMENT_TERMS.map(t => (
            <option key={t} value={t}>{t} dias</option>
          ))}
          <option value="A vista">À vista</option>
        </Select>
      </div>

      {/* Financial values — LOCKED when in approval */}
      <div className={`grid grid-cols-2 gap-4 ${isLocked ? 'opacity-75' : ''}`}>
        <div>
          {isLocked ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Valor Baseline</label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Lock size={12} className="text-gray-400" />
                {formatCurrency(formData.valorBaseline, formData.moeda)}
              </div>
            </div>
          ) : (
            <Input
              label="Valor Baseline *"
              type="number"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={formData.valorBaseline || ''}
              onChange={(e) => onChange('valorBaseline', e.target.value)}
              error={errors.valorBaseline}
              hint="Referência: contrato anterior ou orçamento"
            />
          )}
        </div>

        <div>
          {isLocked ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Valor Final</label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Lock size={12} className="text-gray-400" />
                {formatCurrency(formData.valorFinal, formData.moeda)}
              </div>
            </div>
          ) : (
            <Input
              label="Valor Final *"
              type="number"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={formData.valorFinal || ''}
              onChange={(e) => onChange('valorFinal', e.target.value)}
              error={errors.valorFinal}
              hint="Valor negociado final"
            />
          )}
        </div>
      </div>

      {/* Saving type toggle */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Saving *</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onChange('tipoSaving', 'Hard')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.tipoSaving === 'Hard'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-emerald-600" />
              <span className={`text-sm font-semibold ${formData.tipoSaving === 'Hard' ? 'text-emerald-700' : 'text-gray-700'}`}>
                Hard Saving
              </span>
            </div>
            <p className="text-xs text-gray-500">Redução efetiva de custo vs. baseline</p>
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onChange('tipoSaving', 'Avoidance')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.tipoSaving === 'Avoidance'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-blue-600" />
              <span className={`text-sm font-semibold ${formData.tipoSaving === 'Avoidance' ? 'text-blue-700' : 'text-gray-700'}`}>
                Cost Avoidance
              </span>
            </div>
            <p className="text-xs text-gray-500">Evita custo futuro, reajuste ou TCO</p>
          </button>
        </div>
        {errors.tipoSaving && <p className="text-xs text-red-600 mt-1">{errors.tipoSaving}</p>}
      </div>

      {/* Live saving preview */}
      {formData.valorBaseline && formData.valorFinal && (
        <div className={`rounded-xl p-4 border-2 ${saving.isNegative ? 'border-orange-300 bg-orange-50' : 'border-emerald-300 bg-emerald-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            {saving.isNegative
              ? <AlertTriangle size={16} className="text-orange-600" />
              : <TrendingDown size={16} className="text-emerald-600" />
            }
            <span className={`text-sm font-semibold ${saving.isNegative ? 'text-orange-700' : 'text-emerald-700'}`}>
              {saving.isNegative ? 'Atenção: Custo Acima do Baseline' : 'Preview do Saving'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Saving ($)</p>
              <p className={`text-base font-bold ${saving.isNegative ? 'text-orange-600' : 'text-emerald-700'}`}>
                {formatCurrency(saving.savingValue, formData.moeda)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Saving (%)</p>
              <p className={`text-base font-bold ${saving.isNegative ? 'text-orange-600' : 'text-emerald-700'}`}>
                {saving.savingPercent !== null ? `${saving.savingPercent.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Alçada</p>
              {route ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${route.badge}`}>
                  {route.label}
                </span>
              ) : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
