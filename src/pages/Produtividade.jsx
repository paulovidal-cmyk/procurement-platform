import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from 'recharts'
import {
  Calendar, Filter, X, Search, ChevronDown, Users, Package,
  TrendingUp, Sparkles, Info, Database,
} from 'lucide-react'
import useProdutividadeStore from '../store/useProdutividadeStore.js'
import {
  normalizeRows, computeDashboard, buildFilterOptions,
  NUMERATOR_FILTER_FIELDS, HEADCOUNT_FILTER_FIELDS, YEARS,
} from '../algorithms/produtividade.js'

const BRAND = '#00D26A'
const YEAR_COLORS = { 2024: '#9aa6a2', 2025: '#00B85B', 2026: '#00D26A' }
// Segmentos do gráfico empilhado por Escopo de Compras
const ESCOPO_COLORS = { 'Compras': '#00D26A', 'Fora do Escopo': '#9aa6a2' }
const escopoColor = (k, i) => ESCOPO_COLORS[k] || (i % 2 ? '#C2EAC9' : '#5B6B66')

// ─── Formatadores ───────────────────────────────────────────────────────────
const fmtInt = (v) => (v == null || isNaN(v) ? '—' : Math.round(v).toLocaleString('pt-BR'))
const fmtDec = (v, d = 1) => (v == null || isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }))

const FILTER_LABELS = {
  escopoCompras: 'Escopo de Compras', filtroLog: 'Filtro Logística', contratoSpot: 'Contrato/Spot',
  tipoNeg: 'Tipo de Negociação', tipoPedido: 'Tipo de Pedido', fornecedor: 'Fornecedor',
  categoria: 'Categoria', subcategoria: 'Subcategoria', comprador: 'Comprador', cargo: 'Cargo',
}
const FILTER_ORDER = [...NUMERATOR_FILTER_FIELDS, ...HEADCOUNT_FILTER_FIELDS]

// ─── MultiSelect ────────────────────────────────────────────────────────────
function MultiSelect({ field, label, options, selected, onChange, affectsHeadcount }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return ql ? options.filter(o => String(o).toLowerCase().includes(ql)) : options
  }, [options, q])
  const visible = filtered.slice(0, 300)
  const allSelected = selected.length === 0 || selected.length === options.length

  const toggle = (opt) => {
    const set = new Set(selected.length === 0 ? [] : selected)
    if (set.has(opt)) set.delete(opt); else set.add(opt)
    onChange([...set])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
        style={{
          borderColor: selected.length ? BRAND : 'rgba(13,49,37,0.12)',
          background: selected.length ? 'rgba(0,210,106,0.08)' : 'white',
          color: '#0D3125',
        }}>
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 rounded-full text-white" style={{ background: BRAND }}>
            {selected.length}
          </span>
        )}
        {affectsHeadcount && <span title="Afeta o headcount" className="text-[9px] text-amber-500">⊙</span>}
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-64 bg-white rounded-xl border shadow-xl p-2"
          style={{ borderColor: 'rgba(13,49,37,0.12)' }} role="listbox">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-50 mb-1.5">
            <Search size={12} className="text-gray-400" />
            <input
              autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar..." aria-label={`Buscar em ${label}`}
              className="bg-transparent text-xs outline-none flex-1" />
          </div>
          <div className="flex items-center justify-between px-1 pb-1.5 mb-1 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <button onClick={() => onChange([])} className="text-[10px] font-semibold" style={{ color: BRAND }}>
              Selecionar todos
            </button>
            <button onClick={() => onChange([])} className="text-[10px] font-semibold text-gray-400">
              Limpar
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {visible.map(opt => {
              const checked = selected.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={() => toggle(opt)}
                    className="accent-emerald-500" />
                  <span className="text-xs truncate" style={{ color: '#0D3125' }} title={opt}>{opt}</span>
                </label>
              )
            })}
            {filtered.length > 300 && (
              <p className="text-[10px] text-gray-400 px-2 py-1.5">
                Mostrando 300 de {filtered.length.toLocaleString('pt-BR')} — refine a busca.
              </p>
            )}
            {filtered.length === 0 && <p className="text-[10px] text-gray-400 px-2 py-1.5">Nenhum resultado.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KPI Card por ano ───────────────────────────────────────────────────────
function YearCard({ k }) {
  if (!k) return null
  const rows = [
    { label: 'Pedidos (distintos)', value: fmtInt(k.pedidos), icon: Package },
    { label: 'Headcount médio', value: fmtDec(k.headcount, 1), icon: Users },
    { label: 'Pedidos / comprador', value: fmtDec(k.pedidosPorComprador, 1), icon: TrendingUp, hi: true },
  ]
  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-black tabular-nums" style={{ color: '#0D3125' }}>{k.year}</span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: YEAR_COLORS[k.year] || BRAND }} />
      </div>
      <div className="space-y-2">
        {rows.map(r => {
          const Icon = r.icon
          return (
            <div key={r.label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(13,49,37,0.6)' }}>
                <Icon size={11} style={{ color: r.hi ? BRAND : 'rgba(13,49,37,0.35)' }} /> {r.label}
              </span>
              <span className={`tabular-nums ${r.hi ? 'text-sm font-extrabold' : 'text-xs font-semibold'}`}
                style={{ color: '#0D3125' }}>{r.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tooltip genérico ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border shadow-lg text-[11px]" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
      <p className="font-bold mb-0.5" style={{ color: '#0D3125' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="tabular-nums font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children, right }) {
  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#0D3125' }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

// ─── Hero do indicador-foco: Pedidos / comprador ─────────────────────────────
function HeroPedidos({ perYear, years, mode }) {
  const present = years.filter(y => perYear[y] && perYear[y].headcount > 0)
  if (!present.length) return null
  const last = present[present.length - 1]
  const prev = present.length >= 2 ? present[present.length - 2] : null
  const lastK = perYear[last]
  const prevVal = prev ? perYear[prev].pedidosPorComprador : null
  const delta = prevVal ? ((lastK.pedidosPorComprador - prevVal) / prevVal) * 100 : null
  const up = delta != null && delta >= 0
  const maxVal = Math.max(...present.map(y => perYear[y].pedidosPorComprador || 0), 1)

  return (
    <div className="rounded-3xl border p-5 sm:p-6"
      style={{ borderColor: 'rgba(13,49,37,0.1)', background: 'linear-gradient(135deg, #ffffff 0%, #eefaf2 100%)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,300px)_1fr] gap-6 items-center">
        {/* Foco: ano mais recente */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(13,49,37,0.5)' }}>
            <TrendingUp size={13} style={{ color: BRAND }} /> Pedidos / comprador · {last}
          </div>
          <div className="flex items-end gap-3 mt-1.5">
            <span className="text-[52px] leading-none font-black tabular-nums tracking-tight" style={{ color: '#0D3125' }}>
              {fmtDec(lastK.pedidosPorComprador, 1)}
            </span>
            {delta != null && (
              <span className="mb-2 inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: up ? 'rgba(0,210,106,0.14)' : 'rgba(239,68,68,0.1)', color: up ? '#00B85B' : '#ef4444' }}>
                {up ? '▲' : '▼'} {fmtDec(Math.abs(delta), 1)}% vs {prev}
              </span>
            )}
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: 'rgba(13,49,37,0.5)' }}>
            {fmtInt(lastK.pedidos)} pedidos ÷ {fmtDec(lastK.headcount, 1)} compradores
            {' '}(média {mode === 'ytd' ? 'YTD' : 'no ano'}, ponderada por entradas/saídas)
          </p>
        </div>
        {/* Comparativo por ano */}
        <div className="flex items-end justify-around gap-4 border-l pl-6" style={{ borderColor: 'rgba(13,49,37,0.08)', minHeight: 150 }}>
          {present.map(y => {
            const v = perYear[y].pedidosPorComprador || 0
            const h = Math.max(10, (v / maxVal) * 116)
            return (
              <div key={y} className="flex flex-col items-center gap-1.5 flex-1 justify-end">
                <span className="text-lg font-extrabold tabular-nums" style={{ color: '#0D3125' }}>{fmtDec(v, 1)}</span>
                <div className="w-full max-w-[56px] rounded-t-lg transition-all" style={{ height: h, background: YEAR_COLORS[y] || BRAND }} />
                <span className="text-[11px] font-bold" style={{ color: 'rgba(13,49,37,0.55)' }}>{y}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const METRICS = [
  { id: 'pedidosPorComprador', label: 'Pedidos / comprador', fmt: (v) => fmtDec(v, 1) },
  { id: 'pedidos', label: 'Pedidos (total)', fmt: fmtInt },
]

// ─── Página ─────────────────────────────────────────────────────────────────
export function Produtividade() {
  const rawRows = useProdutividadeStore(s => s.rows)
  const [mode, setMode] = useState('fy')           // 'fy' | 'ytd'
  const [filters, setFilters] = useState({})
  const [monthlyMetric, setMonthlyMetric] = useState('pedidosPorComprador')
  const [selectedYears, setSelectedYears] = useState(YEARS)

  const years = useMemo(() => YEARS.filter(y => selectedYears.includes(y)), [selectedYears])
  const toggleYear = (y) => setSelectedYears(prev =>
    prev.includes(y)
      ? (prev.length > 1 ? prev.filter(v => v !== y) : prev)  // mantém ao menos 1
      : [...prev, y].sort((a, b) => a - b)
  )

  const normalized = useMemo(() => normalizeRows(rawRows), [rawRows])
  const options = useMemo(() => buildFilterOptions(normalized), [normalized])
  const dash = useMemo(() => computeDashboard(normalized, { mode, filters, years }), [normalized, mode, filters, years])
  const cutoffLabel = dash.cutoff
    ? `${String(dash.cutoff.day).padStart(2, '0')}/${String(dash.cutoff.month).padStart(2, '0')}`
    : '—'
  const activeFilterCount = Object.values(filters).reduce((s, a) => s + (a?.length || 0), 0)

  const setField = (field, vals) => setFilters(f => ({ ...f, [field]: vals }))
  const clearFilters = () => setFilters({})

  // Dados do gráfico empilhado: pedidos/comprador por ano, segmentado por Escopo.
  const escopoKeys = dash.byEscopo?.keys || []
  const escopoData = years.map(y => {
    const row = { year: String(y) }
    let total = 0
    for (const k of escopoKeys) {
      const v = dash.byEscopo.byYear[y]?.[k]?.pedidosPorComprador || 0
      row[k] = v
      total += v
    }
    row.__total = total
    return row
  })

  if (!normalized.length) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#e9f3f0' }}>
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(0,210,106,0.12)' }}>
            <Database size={22} style={{ color: BRAND }} />
          </div>
          <p className="text-sm font-bold" style={{ color: '#0D3125' }}>Nenhuma base carregada</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(13,49,37,0.5)' }}>
            Peça ao administrador para importar a planilha em “Atualizar base de dados”.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="max-w-6xl mx-auto px-5 py-5 space-y-4">

        {/* Header + toggle de período */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black" style={{ color: '#0D3125' }}>Produtividade</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.5)' }}>
              Esforço do comprador na emissão de pedidos — pedidos por comprador
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de Ano */}
            <div className="flex items-center gap-1 bg-white rounded-full border p-1" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
              {YEARS.map(y => {
                const on = selectedYears.includes(y)
                return (
                  <button key={y} onClick={() => toggleYear(y)}
                    aria-pressed={on}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold tabular-nums transition-all"
                    style={{
                      background: on ? (YEAR_COLORS[y] || BRAND) : 'transparent',
                      color: on ? 'white' : 'rgba(13,49,37,0.45)',
                    }}>
                    {y}
                  </button>
                )
              })}
            </div>
            {/* Toggle de período */}
            <div className="flex items-center gap-1 bg-white rounded-full border p-1" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
              {[
                { id: 'fy', label: 'Full Year' },
                { id: 'ytd', label: `YTD até ${cutoffLabel}` },
              ].map(b => (
                <button key={b.id} onClick={() => setMode(b.id)}
                  aria-pressed={mode === b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: mode === b.id ? BRAND : 'transparent',
                    color: mode === b.id ? 'white' : 'rgba(13,49,37,0.6)',
                  }}>
                  <Calendar size={12} /> {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="bg-white rounded-2xl border p-3" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide pr-1" style={{ color: 'rgba(13,49,37,0.4)' }}>
              <Filter size={12} /> Filtros
            </span>
            {FILTER_ORDER.map(field => (
              <MultiSelect
                key={field} field={field} label={FILTER_LABELS[field]}
                options={options[field] || []}
                selected={filters[field] || []}
                onChange={(vals) => setField(field, vals)}
                affectsHeadcount={HEADCOUNT_FILTER_FIELDS.includes(field)}
              />
            ))}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50">
                <X size={12} /> Limpar filtros ({activeFilterCount})
              </button>
            )}
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'rgba(13,49,37,0.4)' }}>
            ⊙ Comprador e Cargo afetam também o headcount (denominador). Os demais filtram só os pedidos.
          </p>
        </div>

        {/* Hero: indicador-foco Pedidos / comprador */}
        <HeroPedidos perYear={dash.perYear} years={years} mode={mode} />

        {/* KPI cards por ano (detalhe) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {years.map(y => <YearCard key={y} k={dash.perYear[y]} />)}
        </div>

        {/* Análise automática */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={14} style={{ color: BRAND }} />
            <h3 className="text-sm font-bold" style={{ color: '#0D3125' }}>Análise de produtividade — leitura automática</h3>
          </div>
          <ul className="space-y-1.5">
            {dash.analysis.map((b, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-snug" style={{ color: 'rgba(13,49,37,0.8)' }}>
                <span style={{ color: BRAND }}>•</span> <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] mt-3 pt-2.5 border-t" style={{ color: 'rgba(13,49,37,0.4)', borderColor: 'rgba(13,49,37,0.06)' }}>
            Geradas por regras determinísticas sobre os dados da visão atual — não é texto de IA.
          </p>
        </div>

        {/* Pedidos/comprador por Escopo de Compras (empilhado) */}
        <ChartCard
          title="Pedidos / comprador por Escopo de Compras"
          subtitle="Empilhado: dentro vs fora do escopo · rótulo do topo = total por comprador">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={escopoData} margin={{ top: 26 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip fmt={(v) => fmtDec(v, 1)} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {escopoKeys.map((k, i) => {
                const isLast = i === escopoKeys.length - 1
                return (
                  <Bar key={k} dataKey={k} name={k} stackId="esc" fill={escopoColor(k, i)}
                    radius={isLast ? [6, 6, 0, 0] : [0, 0, 0, 0]}>
                    <LabelList dataKey={k} position="center"
                      formatter={(v) => (v >= 0.1 ? fmtDec(v, 1) : '')}
                      style={{ fontSize: 10, fontWeight: 700, fill: '#ffffff' }} />
                    {isLast && (
                      <LabelList dataKey="__total" position="top"
                        formatter={(v) => fmtDec(v, 1)}
                        style={{ fontSize: 12, fontWeight: 800, fill: '#0D3125' }} />
                    )}
                  </Bar>
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Série mensal */}
        <ChartCard
          title="Visão mensal" subtitle="Uma linha por ano — headcount recalculado mês a mês"
          right={
            <select value={monthlyMetric} onChange={e => setMonthlyMetric(e.target.value)}
              aria-label="Métrica da visão mensal"
              className="text-xs font-semibold rounded-lg border px-2 py-1.5 bg-white outline-none"
              style={{ borderColor: 'rgba(13,49,37,0.12)', color: '#0D3125' }}>
              {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          }>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dash.monthly.map(p => ({
              label: p.label,
              ...Object.fromEntries(years.map(y => [y, p[y]?.[monthlyMetric] ?? 0])),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={METRICS.find(m => m.id === monthlyMetric)?.fmt} width={70} />
              <Tooltip content={<ChartTooltip fmt={METRICS.find(m => m.id === monthlyMetric)?.fmt} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {years.map(y => (
                <Line key={y} type="monotone" dataKey={String(y)} name={String(y)}
                  stroke={YEAR_COLORS[y] || BRAND} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Abertura por comprador */}
        <ChartCard title="Abertura por comprador" subtitle="Pedidos distintos por comprador por ano">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">Comprador</th>
                  {years.map(y => (
                    <th key={y} className="text-right py-1.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dash.byComprador.map(c => (
                  <tr key={c.comprador} className="border-b last:border-0" style={{ borderColor: 'rgba(13,49,37,0.04)' }}>
                    <td className="py-1.5 px-2 font-medium" style={{ color: '#0D3125' }}>
                      {c.comprador}
                      {c.saiuNoPeriodo && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">saída</span>
                      )}
                    </td>
                    {years.map(y => (
                      <td key={y} className="text-right py-1.5 px-2 tabular-nums" style={{ color: 'rgba(13,49,37,0.7)' }}>{fmtInt(c.byYear[y]?.pedidos)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Pedidos por comprador" subtitle="Top 12 emissores — pedidos distintos por ano">
          <ResponsiveContainer width="100%" height={Math.max(200, dash.byComprador.slice(0, 12).length * 38)}>
            <BarChart layout="vertical" data={dash.byComprador.slice(0, 12).map(c => ({
              name: c.comprador, ...Object.fromEntries(years.map(y => [y, c.byYear[y]?.pedidos || 0])),
            }))} margin={{ left: 10, right: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={94} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip fmt={fmtInt} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {years.map(y => (
                <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey={String(y)} position="right"
                    formatter={(v) => (v > 0 ? fmtInt(v) : '')}
                    style={{ fontSize: 9, fontWeight: 700, fill: '#0D3125' }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Abertura Spot vs Contrato */}
        <ChartCard title="Pedidos por comprador — Spot vs Contrato" subtitle="Comparativo entre anos">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dash.spotContrato.groups.map(g => ({
              name: g.key, ...Object.fromEntries(years.map(y => [y, g.byYear[y]?.pedidosPorComprador || 0])),
            }))} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip fmt={(v) => fmtDec(v, 1)} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {years.map(y => (
                <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey={String(y)} position="top"
                    formatter={(v) => (v >= 0.1 ? fmtDec(v, 1) : '')}
                    style={{ fontSize: 9, fontWeight: 700, fill: '#0D3125' }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Nota metodológica */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Info size={13} style={{ color: 'rgba(13,49,37,0.4)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(13,49,37,0.5)' }}>Nota metodológica</h3>
          </div>
          <ul className="space-y-1 text-[11px] leading-snug" style={{ color: 'rgba(13,49,37,0.55)' }}>
            <li>• <b>Pedidos</b> = contagem distinta do identificador de pedido (uma linha = item; um pedido pode ter vários itens).</li>
            <li>• <b>Headcount médio</b> = média dos compradores ativos mês a mês no período (ativo: admissão ≤ fim do mês e sem saída ou saída ≥ início). Quem entra/sai pesa proporcionalmente aos meses ativos — é o denominador de pedidos/comprador.</li>
            <li>• <b>YTD</b> = 01/01 até {cutoffLabel} (data mais recente da base) em cada ano, para comparação no mesmo intervalo.</li>
            <li>• <b>Filtros</b>: Comprador e Cargo afetam também o headcount; os demais (inclusive Escopo de Compras) restringem apenas a contagem de pedidos.</li>
            <li>• Esta análise foca exclusivamente em <b>produtividade (volume de pedidos)</b> — indicadores de spend não são exibidos aqui.</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
