import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle,
         ToggleLeft, ToggleRight, TrendingUp, TrendingDown, Info } from 'lucide-react'
import useRaioXStore, { EMPTY_LINHA, EMPTY_PACOTE } from '../store/useRaioXStore.js'
import { calcularBreakdown, fmtPct } from '../algorithms/raiox.js'
import { INDICADOR_LABELS } from '../data/mockIndicadores.js'

const BADGE = v =>
  v === null || v === undefined || isNaN(v) ? 'text-gray-400' :
  v < 0 ? 'text-emerald-600' : v > 0 ? 'text-red-600' : 'text-gray-500'

export function CriacaoPacotes({ initialPkg, onSaved }) {
  const indicadoresData = useRaioXStore(s => s.indicadoresData)
  const savePacote      = useRaioXStore(s => s.savePacote)

  const [form, setForm] = useState(() => initialPkg ? { ...initialPkg } : EMPTY_PACOTE())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(initialPkg ? { ...initialPkg } : EMPTY_PACOTE())
    setSaved(false)
  }, [initialPkg])

  const titulo = [form.subcategoria, form.fornecedor].filter(Boolean).join(' · ') || 'Novo Pacote'

  // ── Engine ──────────────────────────────────────────────────────
  const { linhasCalc, totalPeso, variacaoBase, variacaoFinal } = useMemo(
    () => calcularBreakdown(form.linhas, indicadoresData, form.margem),
    [form.linhas, form.margem, indicadoresData]
  )

  const pesoOk = Math.abs(totalPeso - 100) < 0.01

  // Should Cost
  const precoFornecedor = parseFloat(form.precoFornecedor)
  const gap = !isNaN(precoFornecedor) ? precoFornecedor - variacaoFinal : null
  const insight = gap === null ? null
    : Math.abs(gap) < 0.5 ? 'O fornecedor está alinhado com a cesta de indicadores ponderada.'
    : gap > 0
      ? `Atenção: O fornecedor está reajustando ${gap.toFixed(2)}% acima da cesta de indicadores ponderada.`
      : `Positivo: O fornecedor está oferecendo ${Math.abs(gap).toFixed(2)}% abaixo da cesta de indicadores ponderada.`

  // ── Helpers ──────────────────────────────────────────────────────
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setLinha = (id, k, v) =>
    setForm(f => ({ ...f, linhas: f.linhas.map(l => l.id === id ? { ...l, [k]: v } : l) }))

  const addLinha = () =>
    setForm(f => ({ ...f, linhas: [...f.linhas, EMPTY_LINHA()] }))

  const removeLinha = (id) =>
    setForm(f => ({ ...f, linhas: f.linhas.filter(l => l.id !== id) }))

  const handleSave = () => {
    if (!form.subcategoria) return
    savePacote(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved?.() }, 800)
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Cabeçalho ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate" style={{ color: '#0D3125' }}>
                {titulo}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.4)' }}>
                Cost Breakdown · Should Cost Analysis
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!form.subcategoria}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: saved ? '#10CB9A' : '#0D3125' }}
            >
              {saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saved ? 'Salvo!' : 'Salvar Pacote'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <input
                value={form.subcategoria}
                onChange={e => setField('subcategoria', e.target.value)}
                placeholder="Ex: Embalagens Plásticas"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Fornecedor</label>
              <input
                value={form.fornecedor}
                onChange={e => setField('fornecedor', e.target.value)}
                placeholder="Ex: PackBrasil Ltda"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* ── Builder ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Composição do Cost Breakdown</h3>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              pesoOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              Peso total: {totalPeso.toFixed(0)}% {pesoOk ? '✓' : '⚠'}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Indicador','Peso %','Tipo','Data Inicial','Data Final','VC','Override','VL','VP',''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhasCalc.map((linha) => (
                  <tr key={linha.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">

                    {/* Indicador */}
                    <td className="px-3 py-2.5">
                      <select
                        value={linha.indicador}
                        onChange={e => setLinha(linha.id, 'indicador', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 font-medium"
                        style={{ color: '#0D3125' }}
                      >
                        {INDICADOR_LABELS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </td>

                    {/* Peso */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={linha.peso}
                        onChange={e => setLinha(linha.id, 'peso', e.target.value)}
                        className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="0"
                      />
                    </td>

                    {/* Tipo toggle */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setLinha(linha.id, 'tipoVariacao',
                          linha.tipoVariacao === 'ponta_a_ponta' ? 'media_movel' : 'ponta_a_ponta')}
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all"
                        style={{
                          background: linha.tipoVariacao === 'ponta_a_ponta'
                            ? 'rgba(16,203,154,0.12)' : 'rgba(96,165,250,0.12)',
                          color: linha.tipoVariacao === 'ponta_a_ponta' ? '#0D9488' : '#3B82F6',
                        }}
                        title={linha.tipoVariacao === 'ponta_a_ponta' ? 'Ponta a Ponta' : 'Média Móvel 12m'}
                      >
                        {linha.tipoVariacao === 'ponta_a_ponta'
                          ? <><ToggleLeft size={12} /> PaP</>
                          : <><ToggleRight size={12} /> MM12</>
                        }
                      </button>
                    </td>

                    {/* Data Inicial */}
                    <td className="px-3 py-2.5">
                      {linha.tipoVariacao === 'ponta_a_ponta' ? (
                        <input
                          type="month"
                          value={linha.dataInicial}
                          onChange={e => setLinha(linha.id, 'dataInicial', e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Data Final */}
                    <td className="px-3 py-2.5">
                      <input
                        type="month"
                        value={linha.dataFinal}
                        onChange={e => setLinha(linha.id, 'dataFinal', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </td>

                    {/* VC */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${BADGE(linha.vc)}`}>
                        {fmtPct(linha.vc)}
                      </span>
                    </td>

                    {/* Override */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number" step="0.01"
                        value={linha.override}
                        onChange={e => setLinha(linha.id, 'override', e.target.value)}
                        className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="—"
                      />
                    </td>

                    {/* VL */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${BADGE(linha.vl)} ${linha.override !== '' && linha.override !== null ? 'underline decoration-dotted' : ''}`}
                        title={linha.override !== '' ? 'Override aplicado' : ''}>
                        {fmtPct(linha.vl)}
                      </span>
                    </td>

                    {/* VP */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-bold ${BADGE(linha.vp)}`}>
                        {fmtPct(linha.vp)}
                      </span>
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => removeLinha(linha.id)}
                        disabled={form.linhas.length === 1}
                        className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-20"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-dashed border-gray-200">
            <button
              onClick={addLinha}
              className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <Plus size={15} />
              Adicionar Indicador
            </button>
          </div>
        </div>

        {/* ── Rodapé / Cálculo Final ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Ajuste de Negociação */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Ajuste de Negociação</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Variação Base</p>
                <p className={`text-lg font-black ${BADGE(variacaoBase)}`}>{fmtPct(variacaoBase)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Σ ponderado</p>
              </div>

              <div className="rounded-xl p-3 border-2 border-dashed border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 text-center">Margem/Desafio</p>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number" step="0.5"
                    value={form.margem}
                    onChange={e => setField('margem', e.target.value)}
                    className="w-16 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">Ex: -10 = desafio</p>
              </div>

              <div className="rounded-xl p-3 text-center"
                style={{ background: variacaoFinal < 0 ? 'rgba(16,203,154,0.08)' : 'rgba(239,68,68,0.06)',
                         border: `2px solid ${variacaoFinal < 0 ? 'rgba(16,203,154,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Resultado Final</p>
                <p className={`text-lg font-black ${BADGE(variacaoFinal)}`}>{fmtPct(variacaoFinal)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  (1{fmtPct(variacaoBase, 1)}) × (1{fmtPct(parseFloat(form.margem) || 0, 1)})-1
                </p>
              </div>
            </div>
          </div>

          {/* Should Cost */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Should Cost · Comparação</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Mercado</p>
                <p className={`text-lg font-black ${BADGE(variacaoFinal)}`}>{fmtPct(variacaoFinal)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Cesta ponderada</p>
              </div>

              <div className="rounded-xl p-3 border-2 border-dashed border-blue-200">
                <p className="text-[10px] text-blue-500 uppercase tracking-wide mb-1 text-center">Fornecedor</p>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number" step="0.5"
                    value={form.precoFornecedor}
                    onChange={e => setField('precoFornecedor', e.target.value)}
                    className="w-16 text-center text-sm font-semibold border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">Reajuste proposto</p>
              </div>

              <div className={`rounded-xl p-3 text-center ${gap === null ? 'bg-gray-50' :
                gap > 0.5 ? 'bg-red-50 border border-red-200' :
                gap < -0.5 ? 'bg-emerald-50 border border-emerald-200' :
                'bg-gray-50 border border-gray-200'}`}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">GAP</p>
                <p className={`text-lg font-black ${gap === null ? 'text-gray-300' : BADGE(gap * -1)}`}>
                  {gap === null ? '—' : fmtPct(gap)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Fornecedor − Mercado</p>
              </div>
            </div>

            {insight && (
              <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs ${
                gap > 0.5 ? 'bg-red-50 border border-red-200 text-red-700' :
                gap < -0.5 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                'bg-gray-50 border border-gray-200 text-gray-600'
              }`}>
                {gap > 0.5 ? <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> :
                 gap < -0.5 ? <TrendingDown size={14} className="flex-shrink-0 mt-0.5" /> :
                 <Info size={14} className="flex-shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{insight}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
