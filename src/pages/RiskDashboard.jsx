import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, X, ExternalLink, Info, AlertTriangle, Shield,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
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
    { subject: 'Saúde',      value: +(s.nota_financeira?.toFixed(1)   ?? 0) },
    { subject: 'Reputação',  value: +(s.nota_inteligencia?.toFixed(1) ?? 0) },
    { subject: 'Interna',    value: +(s.nota_risco?.toFixed(1)        ?? 0) },
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
        {/* Header */}
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

          {/* Floco de neve individual */}
          <div className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <div className="relative flex-shrink-0" style={{ width: 120, height: 110 }}>
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

            <div className="flex-1 flex flex-col gap-1.5">
              {[
                { label: 'Saúde Fin.',  value: s.nota_financeira },
                { label: 'Reputação',   value: s.nota_inteligencia },
                { label: 'Risco Int.',  value: s.nota_risco },
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

          {/* Sub-notas */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Subnotas</p>
            <div className="grid grid-cols-2 gap-1">
              {subNotas.map(item => <SubNotaRow key={item.label} label={item.label} value={item.value} />)}
            </div>
          </div>

          {/* Evidência */}
          {s.link_noticia && s.evidencia_titulo && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Evidência</p>
              <a href={s.link_noticia} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                <ExternalLink size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-blue-700 leading-snug">{s.evidencia_titulo}</span>
              </a>
            </div>
          )}

          {/* Análise IA */}
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
  const [sortKey,    setSortKey]    = useState('spend')
  const [sortDir,    setSortDir]    = useState('desc')

  // ── Filter cascades ────────────────────────────────────────────────────────
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

  useEffect(() => { setPage(0) }, [catFilter, subFilter, fornFilter, sortKey, sortDir])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSpend   = useMemo(() => filtered.reduce((s, p) => s + p.spend, 0), [filtered])
  const totalPedidos = useMemo(() => filtered.reduce((s, p) => s + (p.qtd_pedidos || 0), 0), [filtered])
  const baixo = filtered.filter(s => s.nota_geral >= 75).length
  const medio = filtered.filter(s => s.nota_geral >= 50 && s.nota_geral < 75).length
  const alto  = filtered.filter(s => s.nota_geral < 50).length

  // ── Global radar ──────────────────────────────────────────────────────────
  const globalRadar = useMemo(() => calcGlobalRadar(filtered), [filtered])
  const radarData = [
    { subject: 'Saúde',     value: +globalRadar.financeiro.toFixed(1) },
    { subject: 'Reputação', value: +globalRadar.inteligencia.toFixed(1) },
    { subject: 'Interna',   value: +globalRadar.risco.toFixed(1) },
  ]

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') return mult * (av || '').localeCompare(bv || '', 'pt-BR', { sensitivity: 'base' })
      return mult * ((av ?? 0) - (bv ?? 0))
    })
  }, [filtered, sortKey, sortDir])

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Sort TH helper (function, not component, to avoid re-mounting) ────────
  const sTH = (label, col, cls = '') => {
    const active = sortKey === col
    const Icon   = !col ? null : !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th
        key={col || label}
        className={`py-2 text-[9px] uppercase tracking-wider whitespace-nowrap select-none transition-colors ${col ? 'cursor-pointer hover:bg-gray-100' : ''} ${active ? 'text-emerald-600 font-bold' : 'text-gray-400 font-semibold'} ${cls}`}
        onClick={() => col && toggleSort(col)}
      >
        <div className="flex items-center gap-0.5 px-1">
          <span>{label}</span>
          {Icon && <Icon size={8} className={active ? 'text-emerald-500' : 'text-gray-300'} />}
        </div>
      </th>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e9f3f0' }}>

      {/* ── Header card: Radar | KPIs | Filters ── */}
      <div className="flex-shrink-0 px-3 pt-2.5 pb-2">
        <div className="bg-white rounded-xl border flex"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          {/* LEFT — Grande floco de neve global */}
          <div className="flex-shrink-0 flex items-center justify-center px-3 py-2 border-r"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <div className="relative" style={{ width: 164, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="58%">
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} />
                  <Radar dataKey="value" isAnimationActive={false}
                    stroke="#10CB9A" fill="#10CB9A" fillOpacity={0.22}
                    strokeWidth={2} dot={false} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Central nota badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="flex flex-col items-center justify-center rounded-full text-white shadow-lg"
                  style={{
                    width: 48, height: 48,
                    background: riskColor(globalRadar.geral),
                    boxShadow: `0 0 0 4px ${riskColor(globalRadar.geral)}33`,
                  }}
                >
                  <span className="text-base font-black leading-none">
                    {globalRadar.geral.toFixed(0)}
                  </span>
                  <span className="text-[8px] font-semibold leading-none opacity-80 mt-0.5">média</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER — Big number KPIs */}
          <div className="flex-1 flex items-center gap-5 px-5 py-3">

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Shield size={11} style={{ color: '#10CB9A' }} />
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  Risk Shield
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {filtered.length}/{suppliers.length} fornec.
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

            <div>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider leading-none mb-1">Spend Total</p>
              <p className="text-2xl font-black leading-none" style={{ color: '#0D3125' }}>
                {fmtSpend(totalSpend)}
              </p>
            </div>

            <div>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider leading-none mb-1">Pedidos</p>
              <p className="text-2xl font-black leading-none" style={{ color: '#0D3125' }}>
                {totalPedidos.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

            {/* Risk breakdown */}
            <div className="flex flex-col gap-1.5">
              {[
                { count: baixo, label: 'Baixo', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                { count: medio, label: 'Médio', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { count: alto,  label: 'Alto',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="text-xs font-black w-4 text-right leading-none"
                    style={{ color: item.color }}>{item.count}</span>
                  <span className="text-[9px] text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Filtros */}
          <div className="flex-shrink-0 flex flex-col justify-center gap-1.5 px-4 py-3 border-l"
            style={{ borderColor: 'rgba(13,49,37,0.06)', minWidth: 210 }}>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Filtros</p>
            {[
              { value: catFilter,  options: categorias,   onChange: e => { setCatFilter(e.target.value); setSubFilter('Todas'); setFornFilter('Todos') } },
              { value: subFilter,  options: subcategorias, onChange: e => { setSubFilter(e.target.value);  setFornFilter('Todos') } },
              { value: fornFilter, options: fornecedores,  onChange: e => setFornFilter(e.target.value) },
            ].map((f, i) => (
              <select key={i} value={f.value} onChange={f.onChange}
                className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300 w-full"
                style={{ color: '#0D3125' }}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
        <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  {sTH('Fornecedor',  'fornecedor',        'px-3 text-left')}
                  {sTH('Categoria',   'categoria',         'px-3 text-left')}
                  {sTH('Spend',       'spend',             'px-3 text-right')}
                  {sTH('Pedidos',     'qtd_pedidos',       'px-2 text-center')}
                  {sTH('Saúde',       'nota_financeira',   'px-2 text-center')}
                  {sTH('Reputação',   'nota_inteligencia', 'px-2 text-center')}
                  {sTH('Interna',     'nota_risco',        'px-2 text-center')}
                  {sTH('Nota Geral',  'nota_geral',        'px-2 text-center')}
                  {sTH('Evidência',   null,                'px-3 text-left')}
                  {sTH('',           null,                 'w-5')}
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
                    <td className="px-3 py-1.5">
                      <p className="font-semibold truncate max-w-[160px] leading-snug" style={{ color: '#0D3125' }}>
                        {sup.fornecedor}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">{sup.cnpj}</p>
                    </td>

                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <p className="text-gray-700 font-medium leading-snug">{sup.categoria || '—'}</p>
                      <p className="text-[9px] text-gray-400">{sup.subcategoria || ''}</p>
                    </td>

                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <p className="font-semibold text-gray-700">{fmtSpend(sup.spend)}</p>
                    </td>

                    <td className="px-2 py-1.5 text-center">
                      <p className="text-gray-600 font-medium">
                        {(sup.qtd_pedidos || 0).toLocaleString('pt-BR')}
                      </p>
                    </td>

                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_financeira} /></td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_inteligencia} /></td>
                    <td className="px-2 py-1.5"><NotaBadge nota={sup.nota_risco} /></td>

                    <td className="px-2 py-1.5" style={{ background: riskBg(sup.nota_geral) }}>
                      <NotaBadge nota={sup.nota_geral} lg />
                    </td>

                    <td className="px-3 py-1.5">
                      {sup.evidencia_titulo ? (
                        <div className="flex items-center gap-1.5" style={{ maxWidth: 220 }}>
                          <p className="text-[10px] text-gray-600 leading-snug flex-1 min-w-0 line-clamp-2">
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

                    <td className="pr-2 py-1.5">
                      <ChevronRight size={10} className="text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-gray-100">
            <p className="text-[9px] text-gray-400">
              {sorted.length} fornecedores · pág. {page + 1}/{totalPages}
            </p>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className="w-5 h-5 rounded text-[9px] font-semibold transition-all"
                  style={i === page ? { background: '#0D3125', color: 'white' } : { color: '#9ca3af' }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SupplierDrawer supplier={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
