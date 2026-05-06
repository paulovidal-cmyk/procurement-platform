import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, ExternalLink, Info, AlertTriangle } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import useRiskStore from '../store/useRiskStore.js'
import { calcGlobalRadar, riskColor, riskBg, riskLabel, fmtSpend } from '../algorithms/risk.js'

const PAGE_SIZE = 10

// ── Nota Badge (circular) ─────────────────────────────────────────────────

function NotaBadge({ nota, lg = false }) {
  const dim = lg ? 'w-9 h-9 text-xs' : 'w-7 h-7 text-[10px]'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-black mx-auto flex-shrink-0`}
      style={{
        background: riskBg(nota),
        color: riskColor(nota),
        border: `1.5px solid ${riskColor(nota)}44`,
      }}
    >
      {nota != null ? Math.round(nota) : '—'}
    </div>
  )
}

// ── Supplier Drawer ───────────────────────────────────────────────────────

function SupplierDrawer({ supplier: s, onClose }) {
  if (!s) return null

  const radarData = [
    { subject: 'Financeiro',   value: +(s.nota_financeira?.toFixed(1) ?? 0) },
    { subject: 'Inteligência', value: +(s.nota_inteligencia?.toFixed(1) ?? 0) },
    { subject: 'Risco',        value: +(s.nota_risco?.toFixed(1) ?? 0) },
  ]

  const SUB_NOTAS = [
    { label: 'Situação Fin.',   value: s.fin_situacao },
    { label: 'Maturidade Fin.', value: s.fin_maturidade },
    { label: 'Exposição Fin.',  value: s.fin_exposicao },
    { label: 'Kraljic',         value: s.int_kraljic },
    { label: 'Pedidos',         value: s.int_pedidos },
    { label: 'Ticket',          value: s.int_ticket },
  ]

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid rgba(13,49,37,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm truncate" style={{ color: '#0D3125' }}>{s.fornecedor}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.cnpj}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: riskBg(s.nota_geral), color: riskColor(s.nota_geral) }}>
              {riskLabel(s.nota_geral)} · {Math.round(s.nota_geral)}
            </span>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Radar + Main scores */}
          <div className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            {/* Radar */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject"
                    tick={{ fontSize: 8, fill: '#9ca3af' }} />
                  <Radar dataKey="value" isAnimationActive={false}
                    stroke={riskColor(s.nota_geral)}
                    fill={riskColor(s.nota_geral)} fillOpacity={0.2} dot={false} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow"
                  style={{ background: riskColor(s.nota_geral) }}>
                  {Math.round(s.nota_geral)}
                </div>
              </div>
            </div>

            {/* 3 main scores */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { label: 'Financeiro',    value: s.nota_financeira },
                { label: 'Inteligência',  value: s.nota_inteligencia },
                { label: 'Risco',         value: s.nota_risco },
              ].map(item => (
                <div key={item.label} className="rounded-xl py-2 px-1.5 text-center"
                  style={{ background: riskBg(item.value) }}>
                  <p className="text-[9px] text-gray-500 leading-tight mb-1">{item.label}</p>
                  <p className="text-lg font-black leading-none"
                    style={{ color: riskColor(item.value) }}>
                    {Math.round(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-notas grid */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Subnotas</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SUB_NOTAS.map(item => (
                <div key={item.label}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: riskColor(item.value) }}>
                    {Math.round(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidência */}
          {s.link_noticia && s.evidencia_titulo && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidência</p>
              <a href={s.link_noticia} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                <ExternalLink size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-blue-700 leading-relaxed">{s.evidencia_titulo}</span>
              </a>
            </div>
          )}

          {/* AI Analysis */}
          {s.analise_ia_detalhada && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Análise Detalhada
              </p>
              <div className={`flex items-start gap-2 rounded-xl p-3 border text-xs leading-relaxed ${
                s.nota_geral < 50
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : s.nota_geral < 75
                    ? 'bg-amber-50 border-amber-100 text-amber-800'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-800'
              }`}>
                {s.nota_geral < 50
                  ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  : <Info size={13} className="flex-shrink-0 mt-0.5" />
                }
                <span>{s.analise_ia_detalhada}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export function RiskDashboard() {
  const suppliers = useRiskStore(s => s.suppliers)

  const [catFilter,  setCatFilter]  = useState('Todas')
  const [subFilter,  setSubFilter]  = useState('Todas')
  const [fornFilter, setFornFilter] = useState('Todos')
  const [page,       setPage]       = useState(0)
  const [selected,   setSelected]   = useState(null)

  // Filter options
  const categorias = useMemo(() =>
    ['Todas', ...new Set(suppliers.map(s => s.categoria).filter(Boolean))],
    [suppliers])

  const subcategorias = useMemo(() => {
    const base = catFilter === 'Todas' ? suppliers : suppliers.filter(s => s.categoria === catFilter)
    return ['Todas', ...new Set(base.map(s => s.subcategoria).filter(Boolean))]
  }, [suppliers, catFilter])

  const fornecedores = useMemo(() => {
    let b = suppliers
    if (catFilter !== 'Todas') b = b.filter(s => s.categoria === catFilter)
    if (subFilter !== 'Todas') b = b.filter(s => s.subcategoria === subFilter)
    return ['Todos', ...b.map(s => s.fornecedor)]
  }, [suppliers, catFilter, subFilter])

  // Filtered suppliers
  const filtered = useMemo(() => {
    let r = suppliers
    if (catFilter  !== 'Todas') r = r.filter(s => s.categoria    === catFilter)
    if (subFilter  !== 'Todas') r = r.filter(s => s.subcategoria === subFilter)
    if (fornFilter !== 'Todos') r = r.filter(s => s.fornecedor   === fornFilter)
    return r
  }, [suppliers, catFilter, subFilter, fornFilter])

  useEffect(() => { setPage(0) }, [catFilter, subFilter, fornFilter])

  // Radar data
  const globalRadar = useMemo(() => calcGlobalRadar(filtered), [filtered])
  const radarData = [
    { subject: 'Financeiro',   value: +globalRadar.financeiro.toFixed(1) },
    { subject: 'Inteligência', value: +globalRadar.inteligencia.toFixed(1) },
    { subject: 'Risco',        value: +globalRadar.risco.toFixed(1) },
  ]

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const baixo  = filtered.filter(s => s.nota_geral >= 75).length
  const medio  = filtered.filter(s => s.nota_geral >= 50 && s.nota_geral < 75).length
  const alto   = filtered.filter(s => s.nota_geral < 50).length

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e9f3f0' }}>

      {/* ── Top: Filters + Global Radar ── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="bg-white rounded-xl border flex overflow-hidden"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          {/* Left: title + risk counts + filters */}
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-black" style={{ color: '#0D3125' }}>
                  Supplier Risk Shield
                </h2>
                <p className="text-[10px]" style={{ color: 'rgba(13,49,37,0.4)' }}>
                  {filtered.length} de {suppliers.length} fornecedores · Média Geral:{' '}
                  <span style={{ color: riskColor(globalRadar.geral) }}>
                    {globalRadar.geral.toFixed(1)}
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {baixo} Baixo
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {medio} Médio
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {alto} Alto
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select value={catFilter}
                onChange={e => { setCatFilter(e.target.value); setSubFilter('Todas'); setFornFilter('Todos') }}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                style={{ color: '#0D3125' }}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={subFilter}
                onChange={e => { setSubFilter(e.target.value); setFornFilter('Todos') }}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                style={{ color: '#0D3125' }}>
                {subcategorias.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={fornFilter}
                onChange={e => setFornFilter(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                style={{ color: '#0D3125' }}>
                {fornecedores.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Right: Global Radar (floco de neve) */}
          <div className="flex-shrink-0 w-44 border-l flex items-center justify-center"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <div className="relative w-40 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="58%">
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject"
                    tick={{ fontSize: 8, fill: '#9ca3af' }} />
                  <Radar dataKey="value" isAnimationActive={false}
                    stroke="#10CB9A" fill="#10CB9A" fillOpacity={0.2} dot={false} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Center badge: nota média global */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow"
                  style={{ background: riskColor(globalRadar.geral) }}>
                  {globalRadar.geral.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pb-3">
        <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs min-w-[820px]">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: 'Fornecedor', cls: 'text-left px-3' },
                    { label: 'Categoria',  cls: 'text-left px-3' },
                    { label: 'Spend',      cls: 'text-right px-3' },
                    { label: 'Geral',      cls: 'text-center px-2 w-12' },
                    { label: 'Fin.',       cls: 'text-center px-2 w-12' },
                    { label: 'Intel.',     cls: 'text-center px-2 w-12' },
                    { label: 'Risco',      cls: 'text-center px-2 w-12' },
                    { label: 'Evidência',  cls: 'text-left px-3' },
                    { label: '',           cls: 'w-6' },
                  ].map((h, i) => (
                    <th key={i}
                      className={`${h.cls} py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-xs text-gray-400">
                      Nenhum fornecedor encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
                {paginated.map(sup => (
                  <tr key={sup.id}
                    className="border-b border-gray-50 hover:bg-emerald-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(sup)}>
                    <td className="px-3 py-1.5">
                      <p className="font-semibold truncate max-w-[160px]" style={{ color: '#0D3125' }}>
                        {sup.fornecedor}
                      </p>
                      <p className="text-[9px] text-gray-400">{sup.cnpj}</p>
                    </td>
                    <td className="px-3 py-1.5">
                      <p className="text-gray-700">{sup.categoria}</p>
                      <p className="text-[9px] text-gray-400">{sup.subcategoria}</p>
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-700 whitespace-nowrap">
                      {fmtSpend(sup.spend)}
                    </td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_geral} lg /></td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_financeira} /></td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_inteligencia} /></td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_risco} /></td>
                    <td className="px-3 py-1.5 max-w-[180px]">
                      {sup.link_noticia && sup.evidencia_titulo ? (
                        <a href={sup.link_noticia} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-blue-600 hover:underline text-[10px] truncate block leading-relaxed">
                          {sup.evidencia_titulo}
                        </a>
                      ) : (
                        <span className="text-gray-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="pr-3 py-1.5">
                      <ChevronRight size={11} className="text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              {filtered.length} fornecedores · página {page + 1}/{totalPages}
            </p>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className="w-6 h-6 rounded-lg text-[10px] font-semibold transition-all"
                  style={i === page
                    ? { background: '#0D3125', color: 'white' }
                    : { color: '#6b7280' }
                  }
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <SupplierDrawer supplier={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
