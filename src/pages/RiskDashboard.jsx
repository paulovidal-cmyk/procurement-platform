import { useState, useMemo, useEffect, Fragment } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, ExternalLink, Info, AlertTriangle,
  ShieldCheck, Sparkles, ArrowUp, ArrowDown, ArrowUpDown, Filter,
  Building2, Package, Users,
} from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import useRiskStore from '../store/useRiskStore.js'
import { calcGlobalRadar, riskColor, riskBg, riskLabel, fmtSpend } from '../algorithms/risk.js'

const PAGE_SIZE = 10
const BRAND = '#00D26A'

// ─── Atoms ──────────────────────────────────────────────────────────────────────

function NotaBadge({ nota, lg = false }) {
  const sz = lg ? 'w-7 h-7 text-[11px]' : 'w-6 h-6 text-[10px]'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold mx-auto flex-shrink-0`}
      style={{
        background: riskBg(nota),
        color: riskColor(nota),
        border: `1.5px solid ${riskColor(nota)}33`,
      }}
    >
      {nota != null ? Math.round(nota) : '—'}
    </div>
  )
}

function ScoreBar({ label, value, sublabel }) {
  const color = riskColor(value)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</span>
        <span className="text-base font-bold tabular-nums" style={{ color }}>
          {Math.round(value ?? 0)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%`, background: color }} />
      </div>
      {sublabel && <p className="text-[9px] text-subtle mt-1">{sublabel}</p>}
    </div>
  )
}

function MiniBar({ label, value }) {
  const color = riskColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-subtle min-w-[78px]">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums w-7 text-right" style={{ color }}>
        {Math.round(value ?? 0)}
      </span>
    </div>
  )
}

// ─── Inline drill-down panel ────────────────────────────────────────────────────

function InlineDetail({ s }) {
  const radarData = [
    { subject: 'Saúde',     value: +(s.nota_financeira?.toFixed(1)   ?? 0) },
    { subject: 'Reputação', value: +(s.nota_inteligencia?.toFixed(1) ?? 0) },
    { subject: 'Interna',   value: +(s.nota_risco?.toFixed(1)        ?? 0) },
  ]
  const color = riskColor(s.nota_geral)

  return (
    <div className="bg-gradient-to-br from-gray-50/60 to-white border-l-2"
      style={{ borderLeftColor: color }}>
      <div className="grid grid-cols-12 gap-5 px-5 py-4">

        {/* LEFT — Mini radar + score */}
        <div className="col-span-12 lg:col-span-3 flex items-center gap-3">
          <div className="relative flex-shrink-0" style={{ width: 130, height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                <PolarGrid gridType="polygon" stroke="rgba(15,23,23,0.10)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#5B6B66' }} />
                <Radar dataKey="value" isAnimationActive={false}
                  stroke={color} fill={color} fillOpacity={0.20}
                  strokeWidth={1.5} dot={false} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md text-[11px] font-extrabold"
                style={{ background: color }}>
                {Math.round(s.nota_geral)}
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-subtle">Status</p>
            <p className="text-sm font-bold leading-tight" style={{ color }}>
              {riskLabel(s.nota_geral)}
            </p>
            <p className="text-[10px] text-muted mt-1">
              <span className="font-mono">{s.cnpj}</span>
            </p>
          </div>
        </div>

        {/* CENTER — Sub-scores */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-x-5 gap-y-2 self-center">
          <div className="col-span-2 flex items-center gap-1.5 mb-1">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-subtle">Subnotas</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <MiniBar label="Situação Fin."   value={s.fin_situacao}   />
          <MiniBar label="Kraljic"         value={s.int_kraljic}    />
          <MiniBar label="Maturidade Fin." value={s.fin_maturidade} />
          <MiniBar label="Pedidos"         value={s.int_pedidos}    />
          <MiniBar label="Exposição Fin."  value={s.fin_exposicao}  />
          <MiniBar label="Ticket Médio"    value={s.int_ticket}     />
        </div>

        {/* RIGHT — Evidência + AI */}
        <div className="col-span-12 lg:col-span-4 space-y-2">
          {s.evidencia_titulo && (
            <div className="rounded-xl border border-line bg-white p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold mb-1">Evidência recente</p>
              <div className="flex items-start gap-2">
                <p className="text-[11px] text-ink leading-snug flex-1">{s.evidencia_titulo}</p>
                {s.link_noticia && (
                  <a href={s.link_noticia} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-gray-50 hover:bg-brand-tint text-muted hover:text-brand transition-colors">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          )}
          {s.analise_ia_detalhada && (
            <div className="rounded-xl border border-line bg-white p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={10} className="text-brand" />
                <p className="text-[9px] uppercase tracking-wider text-subtle font-semibold">Análise IA</p>
              </div>
              <div className="flex items-start gap-1.5">
                {s.nota_geral < 50
                  ? <AlertTriangle size={11} className="flex-shrink-0 mt-0.5 text-red-500" />
                  : <Info size={11} className="flex-shrink-0 mt-0.5 text-muted" />}
                <p className="text-[11px] text-ink leading-snug">{s.analise_ia_detalhada}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export function RiskDashboard() {
  const suppliers = useRiskStore(s => s.suppliers)

  const [catFilter,  setCatFilter]  = useState('Todas')
  const [subFilter,  setSubFilter]  = useState('Todas')
  const [fornFilter, setFornFilter] = useState('Todos')
  const [page,       setPage]       = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [sortKey,    setSortKey]    = useState('spend')
  const [sortDir,    setSortDir]    = useState('desc')

  // ── Filter cascades ──────────────────────────────────────────────────────────
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

  const filtered = useMemo(() => {
    let r = suppliers
    if (catFilter  !== 'Todas') r = r.filter(s => s.categoria    === catFilter)
    if (subFilter  !== 'Todas') r = r.filter(s => s.subcategoria === subFilter)
    if (fornFilter !== 'Todos') r = r.filter(s => s.fornecedor   === fornFilter)
    return r
  }, [suppliers, catFilter, subFilter, fornFilter])

  useEffect(() => { setPage(0); setExpandedId(null) }, [catFilter, subFilter, fornFilter, sortKey, sortDir])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalSpend   = useMemo(() => filtered.reduce((s, p) => s + p.spend, 0), [filtered])
  const totalPedidos = useMemo(() => filtered.reduce((s, p) => s + (p.qtd_pedidos || 0), 0), [filtered])
  const baixo = filtered.filter(s => s.nota_geral >= 75).length
  const medio = filtered.filter(s => s.nota_geral >= 50 && s.nota_geral < 75).length
  const alto  = filtered.filter(s => s.nota_geral < 50).length

  // ── Global radar ────────────────────────────────────────────────────────────
  const globalRadar = useMemo(() => calcGlobalRadar(filtered), [filtered])
  const radarData = [
    { subject: 'Saúde',     value: +globalRadar.financeiro.toFixed(1) },
    { subject: 'Reputação', value: +globalRadar.inteligencia.toFixed(1) },
    { subject: 'Interna',   value: +globalRadar.risco.toFixed(1) },
  ]
  const heroColor = riskColor(globalRadar.geral)
  const heroLabel = riskLabel(globalRadar.geral)

  // ── Sort ────────────────────────────────────────────────────────────────────
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

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Sort TH helper ──────────────────────────────────────────────────────────
  const sTH = (label, col, cls = '') => {
    const active = sortKey === col
    const Icon   = !col ? null : !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th
        key={col || label}
        className={`py-2 text-[9px] uppercase tracking-wider whitespace-nowrap select-none transition-colors ${col ? 'cursor-pointer' : ''} ${active ? 'text-ink font-bold' : 'text-subtle font-semibold'} ${cls}`}
        onClick={() => col && toggleSort(col)}
      >
        <div className="flex items-center gap-0.5 px-1">
          <span>{label}</span>
          {Icon && <Icon size={9} className={active ? 'text-brand' : 'text-gray-300'} strokeWidth={2.5} />}
        </div>
      </th>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-4">

          {/* ═══ HERO COCKPIT ═══════════════════════════════════════════════ */}
          <section className="rounded-3xl border border-line bg-white overflow-hidden">
            <div className="grid grid-cols-12">

              {/* LEFT — Big radar with score in the middle */}
              <div className="col-span-12 lg:col-span-4 relative flex items-center justify-center py-5 lg:border-r border-line"
                style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.06) 0%, rgba(255,255,255,0) 60%)' }}>
                <div className="relative" style={{ width: 280, height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                      <PolarGrid gridType="polygon" stroke="rgba(15,23,23,0.08)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: '#5B6B66', fontWeight: 600 }}
                      />
                      <Radar
                        dataKey="value"
                        isAnimationActive={false}
                        stroke={BRAND}
                        fill={BRAND}
                        fillOpacity={0.22}
                        strokeWidth={2}
                        dot={{ fill: BRAND, r: 3 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* Center score */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center justify-center rounded-full text-white shadow-xl"
                      style={{
                        width: 76, height: 76,
                        background: `radial-gradient(circle at 30% 30%, ${heroColor}, ${heroColor}dd)`,
                        boxShadow: `0 6px 20px ${heroColor}55, 0 0 0 4px ${heroColor}1a`,
                      }}>
                      <span className="text-[28px] font-black leading-none tracking-tight">
                        {globalRadar.geral.toFixed(0)}
                      </span>
                      <span className="text-[8px] font-bold leading-none opacity-90 mt-0.5 uppercase tracking-wider">
                        média
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER — Score breakdown + KPIs */}
              <div className="col-span-12 lg:col-span-8 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center">
                        <ShieldCheck size={14} className="text-brand" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
                        Pontuação Consolidada
                      </p>
                    </div>
                    <h2 className="text-[28px] font-black tracking-tight leading-none text-ink">
                      Risco {heroLabel}
                    </h2>
                    <p className="text-[11px] text-muted mt-1">
                      Média ponderada das três dimensões avaliadas · {filtered.length} fornecedor{filtered.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{ background: riskBg(globalRadar.geral), color: heroColor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroColor }} />
                    {heroLabel.toUpperCase()}
                  </span>
                </div>

                {/* Dimension breakdown — 3 progress bars */}
                <div className="grid grid-cols-3 gap-5 mb-4">
                  <ScoreBar label="Saúde Financeira" value={globalRadar.financeiro} />
                  <ScoreBar label="Reputação"         value={globalRadar.inteligencia} />
                  <ScoreBar label="Interna"           value={globalRadar.risco} />
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-3 pt-4 mt-auto border-t border-line">
                  <KpiTile
                    icon={Building2}
                    label="Spend total"
                    value={fmtSpend(totalSpend)}
                    sub={`${filtered.length} fornecedor${filtered.length !== 1 ? 'es' : ''}`}
                  />
                  <KpiTile
                    icon={Package}
                    label="Pedidos"
                    value={totalPedidos.toLocaleString('pt-BR')}
                    sub="no período"
                  />
                  <KpiTile
                    icon={Users}
                    label="Distribuição"
                    value={
                      <span className="flex items-center gap-2 text-base font-bold">
                        <span className="text-emerald-600">{baixo}</span>
                        <span className="text-subtle">·</span>
                        <span className="text-amber-600">{medio}</span>
                        <span className="text-subtle">·</span>
                        <span className="text-red-600">{alto}</span>
                      </span>
                    }
                    sub="Baixo · Médio · Alto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ FILTERS BAR ═══════════════════════════════════════════════ */}
          <section className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-subtle pr-1">
              <Filter size={12} />
              <span className="text-[10px] uppercase tracking-wider font-semibold">Filtros</span>
            </div>
            {[
              { value: catFilter,  options: categorias,    onChange: e => { setCatFilter(e.target.value); setSubFilter('Todas'); setFornFilter('Todos') } },
              { value: subFilter,  options: subcategorias, onChange: e => { setSubFilter(e.target.value); setFornFilter('Todos') } },
              { value: fornFilter, options: fornecedores,  onChange: e => setFornFilter(e.target.value) },
            ].map((f, i) => (
              <select key={i} value={f.value} onChange={f.onChange}
                className="text-[11px] border border-line rounded-full px-3 h-7 bg-white text-ink hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-brand-tint cursor-pointer"
              >
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            <span className="ml-auto text-[10px] text-subtle">
              {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
            </span>
          </section>

          {/* ═══ TABLE ═══════════════════════════════════════════════ */}
          <section className="rounded-2xl border border-line bg-white overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead className="bg-gray-50/60 border-b border-line">
                  <tr>
                    {sTH('Fornecedor',  'fornecedor',        'px-3 text-left')}
                    {sTH('Categoria',   'categoria',         'px-3 text-left')}
                    {sTH('Spend',       'spend',             'px-3 text-right')}
                    {sTH('Pedidos',     'qtd_pedidos',       'px-2 text-center')}
                    {sTH('Saúde',       'nota_financeira',   'px-2 text-center')}
                    {sTH('Reputação',   'nota_inteligencia', 'px-2 text-center')}
                    {sTH('Interna',     'nota_risco',        'px-2 text-center')}
                    {sTH('Geral',       'nota_geral',        'px-2 text-center')}
                    {sTH('Evidência',   null,                'px-3 text-left')}
                    {sTH('',            null,                'w-6')}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-[11px] text-subtle">
                        Nenhum fornecedor encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                  {paginated.map(sup => {
                    const isOpen = expandedId === sup.id
                    return (
                      <Fragment key={sup.id}>
                        <tr
                          onClick={() => setExpandedId(isOpen ? null : sup.id)}
                          className={`border-b border-line cursor-pointer transition-colors ${isOpen ? 'bg-brand-tint/40' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-3 py-2">
                            <p className="font-semibold truncate max-w-[180px] leading-snug text-ink">
                              {sup.fornecedor}
                            </p>
                            <p className="text-[9px] text-subtle font-mono">{sup.cnpj}</p>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <p className="font-medium leading-snug text-ink">{sup.categoria || '—'}</p>
                            <p className="text-[9px] text-subtle">{sup.subcategoria || ''}</p>
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <p className="font-semibold text-ink tabular-nums">{fmtSpend(sup.spend)}</p>
                          </td>
                          <td className="px-2 py-2 text-center text-muted font-medium tabular-nums">
                            {(sup.qtd_pedidos || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-2 py-2"><NotaBadge nota={sup.nota_financeira} /></td>
                          <td className="px-2 py-2"><NotaBadge nota={sup.nota_inteligencia} /></td>
                          <td className="px-2 py-2"><NotaBadge nota={sup.nota_risco} /></td>
                          <td className="px-2 py-2" style={{ background: riskBg(sup.nota_geral) }}>
                            <NotaBadge nota={sup.nota_geral} lg />
                          </td>
                          <td className="px-3 py-2">
                            {sup.evidencia_titulo ? (
                              <div className="flex items-center gap-1.5" style={{ maxWidth: 220 }}>
                                <p className="text-[10px] text-muted leading-snug flex-1 min-w-0 line-clamp-2">
                                  {sup.evidencia_titulo}
                                </p>
                                {sup.link_noticia && (
                                  <a href={sup.link_noticia} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    title="Ver notícia"
                                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center bg-gray-50 hover:bg-brand-tint text-muted hover:text-brand transition-colors">
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-subtle text-[10px]">—</span>
                            )}
                          </td>
                          <td className="pr-2 py-2 text-center">
                            <ChevronDown
                              size={12}
                              strokeWidth={2.5}
                              className={`transition-transform ${isOpen ? 'text-brand rotate-180' : 'text-subtle'}`}
                            />
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <InlineDetail s={sup} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-line bg-white">
              <p className="text-[10px] text-subtle">
                {sorted.length} fornecedores · pág. {page + 1}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="w-6 h-6 rounded-md text-muted hover:text-ink hover:bg-gray-50 disabled:opacity-30 transition-colors flex items-center justify-center">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-6 h-6 rounded-md text-[10px] font-bold transition-colors ${
                      i === page
                        ? 'bg-ink text-white'
                        : 'text-subtle hover:text-ink hover:bg-gray-50'
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="w-6 h-6 rounded-md text-muted hover:text-ink hover:bg-gray-50 disabled:opacity-30 transition-colors flex items-center justify-center">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// ─── KPI tile ───────────────────────────────────────────────────────────────────
function KpiTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-gray-50/60 border border-line p-3">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        <Icon size={11} />
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-base font-bold text-ink leading-tight tracking-tight">{value}</div>
      {sub && <p className="text-[9px] text-subtle mt-0.5">{sub}</p>}
    </div>
  )
}
