import { Plus, Trash2, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { calculateVPL } from '../../algorithms/vplCalculator.js'
import { formatCurrency } from '../../utils/formatters.js'
import { Input } from '../ui/Input.jsx'

function uuid() {
  return Math.random().toString(36).slice(2)
}

export function VplBuilder({ cashFlows = [], discountRate = 12, moeda = 'BRL', onChange }) {
  const { vpl, breakdown } = calculateVPL(cashFlows, discountRate)

  const handleAddRow = () => {
    const nextPeriod = cashFlows.length > 0 ? Math.max(...cashFlows.map(r => r.period || 0)) + 1 : 0
    onChange({
      cashFlows: [...cashFlows, { id: uuid(), period: nextPeriod, value: 0 }],
      discountRate,
    })
  }

  const handleRemoveRow = (id) => {
    onChange({
      cashFlows: cashFlows.filter(r => r.id !== id),
      discountRate,
    })
  }

  const handleRowChange = (id, field, value) => {
    onChange({
      cashFlows: cashFlows.map(r => r.id === id ? { ...r, [field]: parseFloat(value) || 0 } : r),
      discountRate,
    })
  }

  const handleRateChange = (e) => {
    onChange({ cashFlows, discountRate: parseFloat(e.target.value) || 0 })
  }

  const isPositive = vpl >= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-800">Análise VPL (Opcional)</h4>
          <div className="group relative">
            <Info size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-6 left-0 w-64 bg-gray-900 text-white text-xs rounded-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              VPL = Σ CFt / (1 + r)^t <br/>
              CFt = fluxo no período t<br/>
              r = taxa de desconto<br/>
              t = período (0 = presente)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Taxa de desconto:</label>
          <input
            type="number"
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={discountRate}
            onChange={handleRateChange}
            min="0"
            max="100"
            step="0.1"
          />
          <span className="text-xs text-gray-600">% a.a.</span>
        </div>
      </div>

      {cashFlows.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Período (t)</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Fluxo de Caixa</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Valor Presente</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cashFlows.map((row, idx) => {
                const bp = breakdown.find(b => b.period === row.period)
                return (
                  <tr key={row.id || idx} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={row.period}
                        onChange={(e) => handleRowChange(row.id, 'period', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-32 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={row.value}
                        onChange={(e) => handleRowChange(row.id, 'value', e.target.value)}
                        step="100"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {bp ? formatCurrency(bp.discounted, moeda) : '—'}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddRow}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <Plus size={15} />
        Adicionar período
      </button>

      {cashFlows.length > 0 && (
        <div className={`rounded-xl p-4 border-2 ${isPositive ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPositive
                ? <TrendingUp size={18} className="text-emerald-600" />
                : <TrendingDown size={18} className="text-red-600" />
              }
              <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                VPL Calculado
              </span>
            </div>
            <span className={`text-2xl font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(vpl, moeda)}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? 'Projeto com retorno positivo à taxa informada.' : 'Projeto com retorno negativo à taxa informada.'}
          </p>
        </div>
      )}
    </div>
  )
}
