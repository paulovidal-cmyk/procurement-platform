import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList, Cell,
} from 'recharts'
import {
  Calendar, Filter, X, Search, ChevronDown, Users, Package,
  TrendingUp, DollarSign, Sparkles, Info, Database,
} from 'lucide-react'
import useProdutividadeStore from '../store/useProdutividadeStore.js'
import {
  normalizeRows, computeDashboard, buildFilterOptions,
  NUMERATOR_FILTER_FIELDS, HEADCOUNT_FILTER_FIELDS, YEARS,
} from '../algorithms/produtividade.js'

const BRAND = '#00D26A'
const YEAR_COLORS = { 2024: '#9aa6a2', 2025: '#00B85B', 2026: '#00D26A' }

// ─── Formatadores ───────────────────────────────────────────────────────────
function fmtBRL(v) {
  if (v == null || isNaN(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi`
  if (a >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (a >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}
const fmtInt = (v) => (v == null || isNaN(v) ? '—' : Math.round(v).toLocaleString('pt-BR'))
const fmtDec = (v, d = 1) => (v == null || isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }))

const FILTER_LABELS = {
  filtroLog: 'Filtro Logística', contratoSpot: 'Contrato/Spot', tipoNeg: 'Tipo de Negociação',
  tipoPedido: 'Tipo de Pedido', fornecedor: 'Fornecedor', categoria: 'Categoria',
  subcategoria: 'Subcategoria', comprador: 'Comprador', cargo: 'Cargo',
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
    { label: 'Compradores (ativos)', value: fmtInt(k.headcount), icon: Users },
    { label: 'Pedidos / comprador', value: fmtDec(k.pedidosPorComprador, 1), icon: TrendingUp, hi: true },
    { label: 'Spend / comprador', value: fmtBRL(k.spendPorComprador), icon: DollarSign, hi: true },
    { label: 'Spend total', value: fmtBRL(k.spendTotal), icon: DollarSign },
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

const METRICS = [
  { id: 'pedidosPorComprador', label: 'Pedidos / comprador', fmt: (v) => fmtDec(v, 1) },
  { id: 'spendPorComprador', label: 'Spend / comprador', fmt: fmtBRL },
  { id: 'pedidos', label: 'Pedidos (total)', fmt: fmtInt },
  { id: 'spendTotal', label: 'Spend (total)', fmt: fmtBRL },
]

// ─── Página ─────────────────────────────────────────────────────────────────
export function Produtividade() {
  const rawRows = useProdutividadeStore(s => s.rows)
  const [mode, setMode] = useState('fy')           // 'fy' | 'ytd'
  const [filters, setFilters] = useState({})
  const [monthlyMetric, setMonthlyMetric] = useState('pedidosPorComprador')

  const normalized = useMemo(() => normalizeRows(rawRows), [rawRows])
  const options = useMemo(() => buildFilterOptions(normalized), [normalized])
  const dash = useMemo(() => computeDashboard(normalized, { mode, filters }), [normalized, mode, filters])

  const years = YEARS
  const cutoffLabel = dash.cutoff
    ? `${String(dash.cutoff.day).padStart(2, '0')}/${String(dash.cutoff.month).padStart(2, '0')}`
    : '—'
  const activeFilterCount = Object.values(filters).reduce((s, a) => s + (a?.length || 0), 0)

  const setField = (field, vals) => setFilters(f => ({ ...f, [field]: vals }))
  const clearFilters = () => setFilters({})

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
              Esforço do comprador na emissão de pedidos — pedidos e spend por comprador
            </p>
          </div>
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
            ⊙ Comprador e Cargo afetam também o headcount (denominador). Os demais filtram só pedidos e spend.
          </p>
        </div>

        {/* KPI cards por ano */}
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

        {/* Gráficos comparativos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartCard title="Pedidos por comprador" subtitle="Comparativo entre anos">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={years.map(y => ({ year: String(y), value: dash.perYear[y]?.pedidosPorComprador || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip fmt={(v) => fmtDec(v, 1)} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Bar dataKey="value" name="Pedidos/comprador" radius={[6, 6, 0, 0]}>
                  {years.map(y => <Cell key={y} fill={YEAR_COLORS[y] || BRAND} />)}
                  <LabelList dataKey="value" position="top" formatter={(v) => fmtDec(v, 1)} style={{ fontSize: 11, fontWeight: 700, fill: '#0D3125' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Spend por comprador" subtitle="Comparativo entre anos">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={years.map(y => ({ year: String(y), value: dash.perYear[y]?.spendPorComprador || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtBRL} width={70} />
                <Tooltip content={<ChartTooltip fmt={fmtBRL} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Bar dataKey="value" name="Spend/comprador" radius={[6, 6, 0, 0]}>
                  {years.map(y => <Cell key={y} fill={YEAR_COLORS[y] || BRAND} />)}
                  <LabelList dataKey="value" position="top" formatter={fmtBRL} style={{ fontSize: 10, fontWeight: 700, fill: '#0D3125' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

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
        <ChartCard title="Abertura por comprador" subtitle="Pedidos e spend por comprador por ano">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">Comprador</th>
                  {years.map(y => (
                    <th key={y} colSpan={2} className="text-center py-1.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">{y}</th>
                  ))}
                </tr>
                <tr className="border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
                  <th></th>
                  {years.map(y => (
                    <Fragment key={y}>
                      <th className="text-right py-1 px-2 text-[9px] text-gray-400 font-medium">Pedidos</th>
                      <th className="text-right py-1 px-2 text-[9px] text-gray-400 font-medium">Spend</th>
                    </Fragment>
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
                      <Fragment key={y}>
                        <td className="text-right py-1.5 px-2 tabular-nums" style={{ color: 'rgba(13,49,37,0.7)' }}>{fmtInt(c.byYear[y]?.pedidos)}</td>
                        <td className="text-right py-1.5 px-2 tabular-nums" style={{ color: 'rgba(13,49,37,0.7)' }}>{fmtBRL(c.byYear[y]?.spend)}</td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartCard title="Pedidos por comprador" subtitle="Top emissores (3 anos)">
            <ResponsiveContainer width="100%" height={Math.max(180, dash.byComprador.slice(0, 12).length * 34)}>
              <BarChart layout="vertical" data={dash.byComprador.slice(0, 12).map(c => ({
                name: c.comprador, ...Object.fromEntries(years.map(y => [y, c.byYear[y]?.pedidos || 0])),
              }))} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip fmt={fmtInt} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {years.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[0, 4, 4, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Spend por comprador" subtitle="Top emissores (3 anos)">
            <ResponsiveContainer width="100%" height={Math.max(180, dash.byComprador.slice(0, 12).length * 34)}>
              <BarChart layout="vertical" data={dash.byComprador.slice(0, 12).map(c => ({
                name: c.comprador, ...Object.fromEntries(years.map(y => [y, c.byYear[y]?.spend || 0])),
              }))} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtBRL} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip fmt={fmtBRL} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {years.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[0, 4, 4, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Abertura Spot vs Contrato */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartCard title="Pedidos por comprador — Spot vs Contrato">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dash.spotContrato.groups.map(g => ({
                name: g.key, ...Object.fromEntries(years.map(y => [y, g.byYear[y]?.pedidosPorComprador || 0])),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip fmt={(v) => fmtDec(v, 1)} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {years.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Spend por comprador — Spot vs Contrato">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dash.spotContrato.groups.map(g => ({
                name: g.key, ...Object.fromEntries(years.map(y => [y, g.byYear[y]?.spendPorComprador || 0])),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,49,37,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtBRL} width={70} />
                <Tooltip content={<ChartTooltip fmt={fmtBRL} />} cursor={{ fill: 'rgba(0,210,106,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {years.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[y] || BRAND} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Nota metodológica */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Info size={13} style={{ color: 'rgba(13,49,37,0.4)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(13,49,37,0.5)' }}>Nota metodológica</h3>
          </div>
          <ul className="space-y-1 text-[11px] leading-snug" style={{ color: 'rgba(13,49,37,0.55)' }}>
            <li>• <b>Pedidos</b> = contagem distinta do identificador de pedido (uma linha = item; um pedido pode ter vários itens).</li>
            <li>• <b>Headcount</b> = compradores ativos no período: admissão ≤ fim e (sem saída ou saída ≥ início). Recalculado mês a mês na visão mensal.</li>
            <li>• <b>YTD</b> = 01/01 até {cutoffLabel} (data mais recente da base) em cada ano, para comparação no mesmo intervalo.</li>
            <li>• <b>Filtros</b>: Comprador e Cargo afetam também o headcount; os demais restringem apenas pedidos e spend.</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
