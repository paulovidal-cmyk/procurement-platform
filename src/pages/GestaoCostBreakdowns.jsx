import { useState } from 'react'
import { X, Plus, Edit2, Trash2, AlertTriangle, TrendingDown, Info,
         Package, ChevronRight } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import useRaioXStore from '../store/useRaioXStore.js'
import { calcularBreakdown, fmtPct, getSparklineSeries } from '../algorithms/raiox.js'

// ── helpers ─────────────────────────────────────────────────────────────────

const BADGE_COLOR = v =>
  v === null || v === undefined || isNaN(v) ? '#6b7280' :
  v < 0 ? '#10b981' : v > 0 ? '#ef4444' : '#6b7280'

const BADGE_BG = v =>
  v === null || v === undefined || isNaN(v) ? 'rgba(107,114,128,0.1)' :
  v < 0 ? 'rgba(16,185,129,0.12)' : v > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }) {
  if (!data || data.length < 2) {
    return <div className="h-10 flex items-center justify-center text-gray-300 text-xs">sem dados</div>
  }
  return (
    <div className="h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, border: 'none',
              boxShadow: '0 1px 6px rgba(0,0,0,0.15)', background: 'white' }}
            formatter={v => [`${v?.toFixed(2)}%`, '']}
            labelFormatter={() => ''}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Package Card ─────────────────────────────────────────────────────────────

function PacoteCard({ pkg, indicadoresData, onDetails, onEdit, onDelete }) {
  const { variacaoFinal, variacaoBase } = calcularBreakdown(pkg.linhas, indicadoresData, pkg.margem)

  const mainIndicador = pkg.linhas[0]?.indicador || 'IPCA'
  const sparkData     = getSparklineSeries(indicadoresData, mainIndicador, 12)
  const spColor       = BADGE_COLOR(variacaoFinal)

  const precoFornecedor = parseFloat(pkg.precoFornecedor)
  const gap = !isNaN(precoFornecedor) ? precoFornecedor - variacaoFinal : null

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md"
      style={{ borderColor: 'rgba(13,49,37,0.08)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black truncate" style={{ color: '#0D3125' }}>
              {pkg.subcategoria || 'Sem nome'}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
              {pkg.fornecedor || 'Fornecedor não informado'}
            </p>
          </div>
          {/* Variation badge */}
          <span
            className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: BADGE_BG(variacaoFinal), color: BADGE_COLOR(variacaoFinal) }}
          >
            {fmtPct(variacaoFinal)}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Variação Base</p>
            <p className="text-xs font-bold" style={{ color: BADGE_COLOR(variacaoBase) }}>
              {fmtPct(variacaoBase)}
            </p>
          </div>
          {gap !== null && (
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">GAP</p>
              <p className="text-xs font-bold" style={{ color: BADGE_COLOR(gap * -1) }}>
                {fmtPct(gap)}
              </p>
            </div>
          )}
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Linhas</p>
            <p className="text-xs font-bold text-gray-700">{pkg.linhas.length}</p>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="px-5 pb-2">
        <p className="text-[10px] text-gray-400 mb-1">{mainIndicador} · 12m</p>
        <Sparkline data={sparkData} color={spColor} />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-auto border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
        <p className="text-[10px] text-gray-400">
          {pkg.updatedAt ? `Atualizado ${fmtDate(pkg.updatedAt)}` : `Criado ${fmtDate(pkg.createdAt)}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDelete(pkg.id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={() => onEdit(pkg)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Editar"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDetails(pkg)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(13,49,37,0.06)', color: '#0D3125' }}
          >
            Detalhes <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function Drawer({ pkg, indicadoresData, onClose, onEdit }) {
  if (!pkg) return null

  const { linhasCalc, totalPeso, variacaoBase, variacaoFinal } =
    calcularBreakdown(pkg.linhas, indicadoresData, pkg.margem)

  const precoFornecedor = parseFloat(pkg.precoFornecedor)
  const gap = !isNaN(precoFornecedor) ? precoFornecedor - variacaoFinal : null
  const insight = gap === null ? null
    : Math.abs(gap) < 0.5 ? 'O fornecedor está alinhado com a cesta de indicadores ponderada.'
    : gap > 0
      ? `Atenção: O fornecedor está reajustando ${gap.toFixed(2)}% acima da cesta de indicadores ponderada.`
      : `Positivo: O fornecedor está oferecendo ${Math.abs(gap).toFixed(2)}% abaixo da cesta de indicadores ponderada.`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid rgba(13,49,37,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="min-w-0 flex-1">
            <p className="font-black text-base truncate" style={{ color: '#0D3125' }}>
              {pkg.subcategoria || 'Sem nome'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
              {pkg.fornecedor || 'Fornecedor não informado'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button
              onClick={() => onEdit(pkg)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(16,203,154,0.12)', color: '#0D9488' }}
            >
              <Edit2 size={12} /> Editar
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Summary badges */}
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Variação Base</p>
              <p className="text-xl font-black" style={{ color: BADGE_COLOR(variacaoBase) }}>
                {fmtPct(variacaoBase)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Margem/Desafio</p>
              <p className="text-xl font-black text-gray-700">
                {fmtPct(parseFloat(pkg.margem) || 0)}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{
                background: BADGE_BG(variacaoFinal),
                border: `1.5px solid ${BADGE_COLOR(variacaoFinal)}33`,
              }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Resultado Final</p>
              <p className="text-xl font-black" style={{ color: BADGE_COLOR(variacaoFinal) }}>
                {fmtPct(variacaoFinal)}
              </p>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Composição do Breakdown
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs min-w-[420px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Indicador', 'Tipo', 'Peso', 'VC', 'VL', 'VP'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasCalc.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2 font-semibold" style={{ color: '#0D3125' }}>
                        {l.indicador}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: l.tipoVariacao === 'ponta_a_ponta'
                              ? 'rgba(16,203,154,0.1)' : 'rgba(96,165,250,0.1)',
                            color: l.tipoVariacao === 'ponta_a_ponta' ? '#0D9488' : '#3B82F6',
                          }}>
                          {l.tipoVariacao === 'ponta_a_ponta' ? 'PaP' : 'MM12'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700 font-semibold">{l.peso}%</td>
                      <td className="px-3 py-2 font-semibold" style={{ color: BADGE_COLOR(l.vc) }}>
                        {fmtPct(l.vc)}
                      </td>
                      <td className="px-3 py-2 font-semibold" style={{ color: BADGE_COLOR(l.vl) }}>
                        {fmtPct(l.vl)}
                        {l.override !== '' && l.override !== null && (
                          <span className="text-[9px] text-blue-400 ml-1">ovr</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-bold" style={{ color: BADGE_COLOR(l.vp) }}>
                        {fmtPct(l.vp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                    <td className="px-3 py-2 font-bold text-gray-700">{totalPeso}%</td>
                    <td colSpan={2} />
                    <td className="px-3 py-2 font-black" style={{ color: BADGE_COLOR(variacaoBase) }}>
                      {fmtPct(variacaoBase)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Should Cost */}
          {(pkg.precoFornecedor !== '' && pkg.precoFornecedor !== undefined) && (
            <div className="px-6 pb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Should Cost · Comparação
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Mercado</p>
                  <p className="text-lg font-black" style={{ color: BADGE_COLOR(variacaoFinal) }}>
                    {fmtPct(variacaoFinal)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Cesta ponderada</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide mb-1">Fornecedor</p>
                  <p className="text-lg font-black text-blue-700">
                    {fmtPct(parseFloat(pkg.precoFornecedor) || 0)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Reajuste proposto</p>
                </div>
                <div className="rounded-xl p-3 text-center"
                  style={{
                    background: gap === null ? 'rgba(107,114,128,0.06)' : BADGE_BG(gap * -1),
                    border: `1px solid ${gap === null ? 'transparent' : BADGE_COLOR(gap * -1) + '33'}`,
                  }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">GAP</p>
                  <p className="text-lg font-black"
                    style={{ color: gap === null ? '#9ca3af' : BADGE_COLOR(gap * -1) }}>
                    {gap === null ? '—' : fmtPct(gap)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Forn. − Mercado</p>
                </div>
              </div>

              {insight && (
                <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs mt-3 ${
                  gap > 0.5 ? 'bg-red-50 border border-red-200 text-red-700' :
                  gap < -0.5 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                  'bg-gray-50 border border-gray-200 text-gray-600'
                }`}>
                  {gap > 0.5
                    ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    : gap < -0.5
                      ? <TrendingDown size={13} className="flex-shrink-0 mt-0.5" />
                      : <Info size={13} className="flex-shrink-0 mt-0.5" />
                  }
                  <span className="leading-relaxed">{insight}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function GestaoCostBreakdowns({ onNew, onEdit }) {
  const indicadoresData = useRaioXStore(s => s.indicadoresData)
  const pacotes         = useRaioXStore(s => s.pacotes)
  const deletePacote    = useRaioXStore(s => s.deletePacote)

  const [selected, setSelected] = useState(null)

  const handleDelete = (id) => {
    if (selected?.id === id) setSelected(null)
    deletePacote(id)
  }

  const handleEdit = (pkg) => {
    setSelected(null)
    onEdit(pkg)
  }

  return (
    <div className="h-full overflow-y-auto relative" style={{ background: '#e9f3f0' }}>
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black" style={{ color: '#0D3125' }}>Breakdowns Cadastrados</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.4)' }}>
              {pacotes.length} pacote{pacotes.length !== 1 ? 's' : ''} · Clique em Detalhes para ver o breakdown completo
            </p>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#0D3125' }}
          >
            <Plus size={14} />
            Novo Pacote
          </button>
        </div>

        {/* Empty state */}
        {pacotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(13,49,37,0.06)' }}>
              <Package size={28} style={{ color: 'rgba(13,49,37,0.25)' }} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0D3125' }}>
              Nenhum pacote cadastrado
            </p>
            <p className="text-xs mb-5" style={{ color: 'rgba(13,49,37,0.45)' }}>
              Crie seu primeiro cost breakdown para começar.
            </p>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#10CB9A' }}
            >
              <Plus size={14} /> Criar Primeiro Pacote
            </button>
          </div>
        )}

        {/* Cards grid */}
        {pacotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pacotes.map(pkg => (
              <PacoteCard
                key={pkg.id}
                pkg={pkg}
                indicadoresData={indicadoresData}
                onDetails={setSelected}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        pkg={selected}
        indicadoresData={indicadoresData}
        onClose={() => setSelected(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
