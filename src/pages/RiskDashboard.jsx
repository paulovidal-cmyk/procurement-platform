import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, ExternalLink, Info, AlertTriangle, Shield } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import useRiskStore from '../store/useRiskStore.js'
import { calcGlobalRadar, riskColor, riskBg, riskLabel, fmtSpend } from '../algorithms/risk.js'

const PAGE_SIZE = 10

// ── Nota Badge ────────────────────────────────────────────────────────────────

function NotaBadge({ nota, lg = false }) {
  const sz = lg ? 'w-8 h-8 text-[11px]' : 'w-6 h-6 text-[9px]'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-black mx-auto flex-shrink-0`}
      style={{
        background: riskBg(nota),
        color: riskColor(nota),
        border: `1.5px solid ${riskColor(nota)}55`,
      }}
    >
      {nota != null ? Math.round(nota) : '—'}
    </div>
  )
}

// ── Sub-nota Row ──────────────────────────────────────────────────────────────

function SubNotaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-[10px] font-bold" style={{ color: riskColor(value) }}>
        {Math.round(value ?? 0)}
      </span>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function SupplierDrawer({ supplier: s, onClose }) {
  if (!s) return null

  const radarData = [
    { subject: 'Saúde',      value: +(s.nota_financeira?.toFixed(1) ?? 0) },
    { subject: 'Reputação',  value: +(s.nota_inteligencia?.toFixed(1) ?? 0) },
    { subject: 'Interna',    value: +(s.nota_risco?.toFixed(1) ?? 0) },
  ]

  const subNotas = [
    { label: 'Situação Fin.',   value: s.fin_situacao },
    { label: 'Maturidade Fin.', value: s.fin_maturidade },
    { label: 'Exposição Fin.',  value: s.fin_exposicao },
    { label: 'Kraljic',         value: s.int_kraljic },
    { label: 'Pedidos',         value: s.int_pedidos },
    { label: 'Ticket Médio',    value: s.int_ticket },
  ]

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid rgba(13,49,37,0.1)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="min-w-0">
            <p className="font-black text-sm leading-tight truncate" style={{ color: '#0D3125' }}>
              {s.fornecedor}
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{s.cnpj}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: riskBg(s.nota_geral), color: riskColor(s.nota_geral) }}>
              {riskLabel(s.nota_geral)} · {Math.round(s.nota_geral)}
            </span>
            <button onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Floco de neve individual ──────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <div className="relative w-[120px] h-[110px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#9ca3af' }} />
                  <Radar dataKey="value" isAnimationActive={false}
                    stroke={riskColor(s.nota_geral)}
                    fill={riskColor(s.nota_geral)} fillOpacity={0.18} dot={false} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow"
                  style={{ background: riskColor(s.nota_geral) }}>
                  {Math.round(s.nota_geral)}
                </div>
              </div>
            </div>

            {/* 3 notas principais */}
            <div className="flex-1 flex flex-col gap-1.5">
              {[
                { label: 'Saúde Fin.',   value: s.nota_financeira },
                { label: 'Reputação',    value: s.nota_inteligencia },
                { label: 'Risco Int.',   value: s.nota_risco },
              ].map(item => (
                <div key={item.label}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl"
                  style={{ background: riskBg(item.value) }}>
                  <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
                  <span className="text-sm font-black" style={{ color: riskColor(item.value) }}>
                    {Math.round(item.value ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sub-notas ──────────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Subnotas
            </p>
            <div className="grid grid-cols-2 gap-1">
              {subNotas.map(item => (
                <SubNotaRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

          {/* ── Evidência ──────────────────────────────────────────────────── */}
          {s.link_noticia && s.evidencia_titulo && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Evidência
              </p>
              <a href={s.link_noticia} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                <ExternalLink size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-blue-700 leading-snug">{s.evidencia_titulo}</span>
              </a>
            </div>
          )}

          {/* ── Análise IA ─────────────────────────────────────────────────── */}
          {s.analise_ia_detalhada && (
            <div className="px-4 py-3">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Análise Detalhada
              </p>
              <div className={`flex items-start gap-2 rounded-xl p-3 border text-[11px] leading-relaxed ${
                s.nota_geral < 50
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : s.nota_geral < 75
                    ? 'bg-amber-50 border-amber-100 text-amber-800'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-800'
              }`}>
                {s.nota_geral < 50
                  ? <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  : <Info size={12} className="flex-shrink-0 mt-0.5" />
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

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function RiskDashboard() {
  const suppliers = useRiskStore(s => s.suppliers)

  const [catFilter,  setCatFilter]  = useState('Todas')
  const [subFilter,  setSubFilter]  = useState('Todas')
  const [fornFilter, setFornFilter] = useState('Todos')
  const [page,       setPage]       = useState(0)
  const [selected,   setSelected]   = useState(null)

  // Filter cascades
  const categorias = useMemo(() =>
    ['Todas', ...new Set(suppliers.map(s => s.categoria).filter(Boolean))],
    [suppliers])

  const subcategorias = useMemo(() => {
    const base = catFilter === 'Todas' ? suppliers : suppliers.filter(s => s.categoria === catFilter)
    return ['Todas', ...new Set(base.map(s => s.subcategoria).filter(Boolean))]
  }, [suppliers, catFilter])

  const fornecedores = useMemo(() => {
    let b = suppliers
    if (catFilter !== 'Todas') b = b.filter(s => s.categoria    === catFilter)
    if (subFilter !== 'Todas') b = b.filter(s => s.subcategoria === subFilter)
    return ['Todos', ...b.map(s => s.fornecedor)]
  }, [suppliers, catFilter, subFilter])

  const filtered = useMemo(() => {
    let r = suppliers
    if (catFilter  !== 'Todas') r = r.filter(s => s.categoria    === catFilter)
    if (subFilter  !== 'Todas') r = r.filter(s => s.subcategoria === subFilter)
    if (fornFilter !== 'Todos') r = r.filter(s => s.fornecedor   === fornFilter)
    return r
  }, [suppliers, catFilter, subFilter, fornFilter])

  useEffect(() => { setPage(0) }, [catFilter, subFilter, fornFilter])

  // KPI aggregates
  const totalSpend   = useMemo(() => filtered.reduce((s, p) => s + p.spend, 0), [filtered])
  const totalPedidos = useMemo(() => filtered.reduce((s, p) => s + (p.qtd_pedidos || 0), 0), [filtered])
  const baixo = filtered.filter(s => s.nota_geral >= 75).length
  const medio = filtered.filter(s => s.nota_geral >= 50 && s.nota_geral < 75).length
  const alto  = filtered.filter(s => s.nota_geral <  50).length

  // Global radar
  const globalRadar = useMemo(() => calcGlobalRadar(filtered), [filtered])
  const radarData = [
    { subject: 'Saúde',     value: +globalRadar.financeiro.toFixed(1) },
    { subject: 'Reputação', value: +globalRadar.inteligencia.toFixed(1) },
    { subject: 'Interna',   value: +globalRadar.risco.toFixed(1) },
  ]

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const TH = ({ children, cls = '' }) => (
    <th className={`py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${cls}`}>
      {children}
    </th>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e9f3f0' }}>

      {/* ── Compact Header Card ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 pt-2.5 pb-2">
        <div className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          {/* Row 1: title + KPI chips + mini global radar */}
          <div className="flex items-center gap-3 px-3 py-2 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>

            {/* Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Shield size={12} style={{ color: '#10CB9A' }} />
              <p className="text-xs font-black" style={{ color: '#0D3125' }}>
                Supplier Risk Shield
              </p>
            </div>

            <div className="w-px h-3 bg-gray-200 flex-shrink-0" />

            {/* KPI chips */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <span className="text-[10px] text-gray-500">
                <span className="font-semibold text-gray-700">{filtered.length}</span> fornec.
              </span>
              <span className="text-[10px] text-gray-500">
                <span className="font-semibold text-gray-700">{fmtSpend(totalSpend)}</span> spend
              </span>
              <span className="text-[10px] text-gray-500">
                <span className="font-semibold text-gray-700">{totalPedidos.toLocaleString('pt-BR')}</span> pedidos
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {baixo} Baixo
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {medio} Médio
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                {alto} Alto
              </span>
            </div>

            {/* Mini global radar (floco de neve) */}
            <div className="relative w-24 h-[68px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="60%">
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fill: '#9ca3af' }} />
                  <Radar dataKey="value" isAnimationActive={false}
                    stroke="#10CB9A" fill="#10CB9A" fillOpacity={0.2} dot={false} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                  style={{ background: riskColor(globalRadar.geral) }}>
                  {globalRadar.geral.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: filters */}
          <div className="flex gap-2 px-3 py-2">
            <select value={catFilter}
              onChange={e => { setCatFilter(e.target.value); setSubFilter('Todas'); setFornFilter('Todos') }}
              className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
              style={{ color: '#0D3125' }}>
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={subFilter}
              onChange={e => { setSubFilter(e.target.value); setFornFilter('Todos') }}
              className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
              style={{ color: '#0D3125' }}>
              {subcategorias.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={fornFilter}
              onChange={e => setFornFilter(e.target.value)}
              className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
              style={{ color: '#0D3125' }}>
              {fornecedores.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
        <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          {/* Scrollable table body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  <TH cls="px-3 text-left">Fornecedor</TH>
                  <TH cls="px-3 text-left">Categoria</TH>
                  <TH cls="px-3 text-right">Spend</TH>
                  <TH cls="px-2 text-center">Pedidos</TH>
                  <TH cls="px-2 text-center">Saúde</TH>
                  <TH cls="px-2 text-center">Reputação</TH>
                  <TH cls="px-2 text-center">Interna</TH>
                  <TH cls="px-2 text-center">Nota Geral</TH>
                  <TH cls="px-3 text-left">Evidência</TH>
                  <TH cls="w-5" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-[11px] text-gray-400">
                      Nenhum fornecedor encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
                {paginated.map(sup => (
                  <tr
                    key={sup.id}
                    onClick={() => setSelected(sup)}
                    className="border-b border-gray-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {/* Fornecedor */}
                    <td className="px-3 py-1.5">
                      <p className="font-semibold truncate max-w-[160px] leading-snug"
                        style={{ color: '#0D3125' }}>
                        {sup.fornecedor}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">{sup.cnpj}</p>
                    </td>

                    {/* Categoria */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <p className="text-gray-700 leading-snug font-medium">{sup.categoria || '—'}</p>
                      <p className="text-[9px] text-gray-400">{sup.subcategoria || ''}</p>
                    </td>

                    {/* Spend */}
                    <td className="px-3 py-1.5 text-right">
                      <p className="font-semibold text-gray-700 whitespace-nowrap">
                        {fmtSpend(sup.spend)}
                      </p>
                    </td>

                    {/* Pedidos */}
                    <td className="px-2 py-1.5 text-center">
                      <p className="text-gray-600 font-medium">
                        {(sup.qtd_pedidos || 0).toLocaleString('pt-BR')}
                      </p>
                    </td>

                    {/* Saúde */}
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_financeira} /></td>
                    {/* Reputação */}
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_inteligencia} /></td>
                    {/* Interna */}
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_risco} /></td>

                    {/* Nota Geral — coluna destacada */}
                    <td className="px-2 py-1.5" style={{ background: `${riskBg(sup.nota_geral)}` }}>
                      <NotaBadge nota={sup.nota_geral} lg />
                    </td>

                    {/* Evidência */}
                    <td className="px-3 py-1.5">
                      {sup.evidencia_titulo ? (
                        <div className="flex items-center gap-1.5" style={{ maxWidth: 220 }}>
                          <p className="text-[10px] text-gray-600 leading-snug flex-1 min-w-0"
                            style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {sup.evidencia_titulo}
                          </p>
                          {sup.link_noticia && (
                            <a
                              href={sup.link_noticia}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              title="Ver notícia"
                              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-blue-100"
                              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
                            >
                              <ExternalLink size={10} style={{ color: '#3b82f6' }} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Chevron */}
                    <td className="pr-2 py-1.5">
                      <ChevronRight size={10} className="text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-gray-100">
            <p className="text-[9px] text-gray-400">
              {filtered.length} fornecedores · pág. {page + 1}/{totalPages}
            </p>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="w-5 h-5 rounded text-[9px] font-semibold transition-all"
                  style={i === page
                    ? { background: '#0D3125', color: 'white' }
                    : { color: '#9ca3af' }
                  }
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      <SupplierDrawer supplier={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
