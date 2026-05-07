import { useState, useMemo, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, Package, ShoppingCart, Award, Newspaper,
  ChevronDown, RefreshCw, ExternalLink, Wifi, Filter,
} from 'lucide-react'
import useAppStore from '../store/useAppStore.js'

const BRAND = '#00D26A'

const CHART_PALETTE = [
  '#00D26A', '#34D399', '#6EE7B7', '#A7F3D0',
  '#059669', '#047857', '#065F46', '#0D3125',
]

const QUADRANT_META = {
  'Estratégico': { label: 'Estratégico', tint: 'rgba(0,210,106,0.10)',  border: 'rgba(0,210,106,0.30)',  dot: '#00D26A', desc: 'Alto spend · Alta complexidade' },
  'Alavancável': { label: 'Alavancável', tint: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', dot: '#60A5FA', desc: 'Alto spend · Baixa complexidade' },
  'Gargalo':     { label: 'Gargalo',     tint: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  dot: '#F87171', desc: 'Baixo spend · Alta complexidade' },
  'Rotina':      { label: 'Rotina',      tint: 'rgba(15,23,23,0.04)',   border: 'rgba(15,23,23,0.10)',   dot: '#9CA3AF', desc: 'Baixo spend · Baixa complexidade' },
}

const NEWS_HEADLINES = [
  n => `${n} anuncia expansão operacional e crescimento de 25% no primeiro trimestre`,
  n => `Relatório setorial aponta ${n} entre líderes em inovação no fornecimento`,
  n => `${n} firma acordo de sustentabilidade e obtém certificação ESG`,
  n => `Análise: ${n} consolida posição com novos contratos corporativos estratégicos`,
  n => `${n} lança plataforma digital para agilizar processos logísticos`,
  n => `${n} registra crescimento de 18% no volume de pedidos B2B`,
  n => `Mercado reage positivamente ao reposicionamento de ${n} no segmento`,
]
const NEWS_SOURCES = ['Valor Econômico', 'Reuters', 'Bloomberg Línea', 'InfoMoney', 'Exame', 'NeoFeed', 'Pipeline']

function getMockNews(suppliers) {
  return suppliers.flatMap((s, si) =>
    [0, 1].map((_, ni) => ({
      id: `${si}-${ni}`,
      supplier: s,
      title: NEWS_HEADLINES[(si * 2 + ni) % NEWS_HEADLINES.length](s),
      source: NEWS_SOURCES[(si + ni) % NEWS_SOURCES.length],
      time: `${(si * 3 + ni * 2 + 1) % 23 + 1}h atrás`,
    }))
  ).slice(0, 5)
}

function fmt(v) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

// ─── Atoms ──────────────────────────────────────────────────────────────────────

function KpiTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-gray-50/60 border border-line p-3">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        <Icon size={11} />
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-base font-bold text-ink leading-tight tracking-tight tabular-nums truncate">{value}</div>
      {sub && <p className="text-[9px] text-subtle mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border border-line shadow-lg text-[11px]">
      {label && <p className="font-bold text-ink mb-0.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#0A0E0C' }} className="tabular-nums">
          {p.name}: <strong>{typeof p.value === 'number' ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, percent } = payload[0]
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border border-line shadow-lg text-[11px]">
      <p className="font-bold text-ink mb-0.5">{name}</p>
      <p className="tabular-nums text-muted">
        {fmt(value)} <span className="text-subtle">({(percent * 100).toFixed(1)}%)</span>
      </p>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export function CategoryDashboard() {
  const csvData     = useAppStore(s => s.sheetsData)
  const csvLoading  = useAppStore(s => s.sheetsLoading)
  const csvError    = useAppStore(s => s.sheetsError)
  const loadCsvData = useAppStore(s => s.loadSheetsData)

  useEffect(() => { loadCsvData() }, [])

  const categories = useMemo(() =>
    [...new Set(csvData.map(r => r.categoria))].sort(),
    [csvData])
  const [selectedCat, setSelectedCat] = useState('')
  const activeCat = selectedCat || categories[0] || ''

  const data = useMemo(() =>
    activeCat ? csvData.filter(r => r.categoria === activeCat) : csvData,
    [csvData, activeCat]
  )

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSpend   = data.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const totalPedidos = data.reduce((s, r) => s + (Number(r.qtdPedidos) || 0), 0)
  const avgSpend     = data.length ? totalSpend / data.length : 0

  const supplierMap = {}
  data.forEach(r => { supplierMap[r.fornecedor] = (supplierMap[r.fornecedor] || 0) + (Number(r.spend) || 0) })
  const sortedSuppliers = Object.entries(supplierMap).sort((a, b) => b[1] - a[1])
  const leader = sortedSuppliers[0]?.[0] || '—'
  const leaderShare = totalSpend > 0
    ? ((sortedSuppliers[0]?.[1] || 0) / totalSpend * 100).toFixed(0)
    : 0

  // ── Charts data ───────────────────────────────────────────────────────────
  const subMap = {}
  data.forEach(r => { subMap[r.subcategoria] = (subMap[r.subcategoria] || 0) + (Number(r.spend) || 0) })
  const donutData = Object.entries(subMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  const top5 = sortedSuppliers.slice(0, 5).map(([name, spend]) => {
    const pedidos = data.filter(r => r.fornecedor === name).reduce((s, r) => s + (Number(r.qtdPedidos) || 0), 0)
    return { name: name.length > 18 ? name.slice(0, 16) + '…' : name, spend, pedidos }
  })

  // ── Kraljic ────────────────────────────────────────────────────────────────
  const quadrantGroups = { 'Estratégico': [], 'Alavancável': [], 'Gargalo': [], 'Rotina': [] }
  data.forEach(r => {
    const q = r.quadrante
    if (quadrantGroups[q]) quadrantGroups[q].push(r.fornecedor)
  })
  Object.keys(quadrantGroups).forEach(k => {
    quadrantGroups[k] = [...new Set(quadrantGroups[k])]
  })

  const top5Names = sortedSuppliers.slice(0, 5).map(([n]) => n)
  const news = getMockNews(top5Names)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-4">

          {/* ═══ HERO COCKPIT ═══════════════════════════════════════════════ */}
          <section className="rounded-3xl border border-line bg-white overflow-hidden">
            <div className="grid grid-cols-12">

              {/* LEFT — Donut + total spend */}
              <div
                className="col-span-12 lg:col-span-4 relative flex items-center justify-center py-5 lg:border-r border-line"
                style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.06) 0%, rgba(255,255,255,0) 60%)' }}
              >
                <div className="relative" style={{ width: 240, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius={64} outerRadius={92}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={false}
                      >
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-subtle">Spend total</span>
                    <span className="text-[22px] font-black leading-tight tracking-tight text-ink tabular-nums mt-0.5">
                      {fmt(totalSpend)}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">{donutData.length} subcategorias</span>
                  </div>
                </div>
              </div>

              {/* CENTER — Title + KPIs */}
              <div className="col-span-12 lg:col-span-8 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center">
                        <TrendingUp size={14} className="text-brand" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
                        Análise de Categoria
                      </p>
                    </div>
                    <h2 className="text-[28px] font-black tracking-tight leading-none text-ink truncate">
                      {activeCat || 'Todas as categorias'}
                    </h2>
                    <p className="text-[11px] text-muted mt-1 flex items-center gap-1.5">
                      <Wifi size={11} className="text-brand" />
                      {csvLoading ? 'Carregando planilha…' : `${csvData.length} registros · Google Sheets`}
                    </p>
                  </div>

                  {/* Category select + refresh */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative">
                      <select
                        value={activeCat}
                        onChange={e => setSelectedCat(e.target.value)}
                        className="appearance-none text-[11px] font-semibold border border-line rounded-full pl-3 pr-7 h-8 bg-white text-ink hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-brand-tint cursor-pointer"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-subtle" />
                    </div>
                    <button
                      onClick={loadCsvData}
                      disabled={csvLoading}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold bg-gray-50 hover:bg-gray-100 text-ink border border-line transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={csvLoading ? 'animate-spin text-brand' : 'text-brand'} />
                      Atualizar
                    </button>
                  </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-3 pt-4 mt-auto border-t border-line">
                  <KpiTile icon={TrendingUp}   label="Total Spend"    value={fmt(totalSpend)}    sub={`${data.length} negociações`} />
                  <KpiTile icon={Package}      label="Pedidos"        value={totalPedidos.toLocaleString('pt-BR')} sub="qtd. total" />
                  <KpiTile icon={ShoppingCart} label="Ticket Médio"   value={fmt(avgSpend)}      sub="por negociação" />
                  <KpiTile icon={Award}        label="Líder"          value={leader}             sub={`${leaderShare}% do spend`} />
                </div>
              </div>
            </div>
          </section>

          {/* Error */}
          {csvError && (
            <div className="rounded-xl px-3 py-2 text-[11px] flex items-center gap-2 text-red-700"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              Erro ao carregar planilha: {csvError}
            </div>
          )}

          {/* ═══ CHARTS ROW ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Donut breakdown — list */}
            <section className="lg:col-span-2 rounded-2xl border border-line bg-white p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-bold text-ink">Spend por Subcategoria</p>
                  <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">{donutData.length} itens</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {donutData.slice(0, 8).map((d, i) => {
                  const pct = totalSpend ? (d.value / totalSpend) * 100 : 0
                  const color = CHART_PALETTE[i % CHART_PALETTE.length]
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[11px] text-ink truncate flex-1">{d.name}</span>
                      <span className="text-[10px] text-subtle tabular-nums">{pct.toFixed(0)}%</span>
                      <span className="text-[11px] font-semibold text-ink tabular-nums w-16 text-right">{fmt(d.value)}</span>
                    </div>
                  )
                })}
                {donutData.length > 8 && (
                  <p className="text-[10px] text-subtle pt-1">+{donutData.length - 8} outras</p>
                )}
              </div>
            </section>

            {/* Top 5 fornecedores */}
            <section className="lg:col-span-3 rounded-2xl border border-line bg-white p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-bold text-ink">Top 5 Fornecedores · Spend</p>
                  <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">Maior participação na categoria</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={top5} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,23,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={v => fmt(v)}
                    tick={{ fill: '#97A3A0', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#5B6B66', fontSize: 11, fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,210,106,0.06)' }} />
                  <Bar dataKey="spend" name="Spend" radius={[0, 6, 6, 0]} barSize={14}>
                    {top5.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          {/* ═══ KRALJIC MATRIX ═══════════════════════════════════════════════ */}
          <section className="rounded-2xl border border-line bg-white p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-brand" />
                <p className="text-[11px] font-bold text-ink">Matriz de Kraljic</p>
                <span className="text-[9px] text-subtle uppercase tracking-wider">Classificação estratégica</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-subtle">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
                  Alto spend ↑
                </span>
                <span>Complexidade →</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {['Alavancável', 'Estratégico', 'Rotina', 'Gargalo'].map(q => {
                const meta = QUADRANT_META[q]
                const sups = quadrantGroups[q] || []
                return (
                  <div
                    key={q}
                    className="rounded-xl p-3 min-h-[120px]"
                    style={{ background: meta.tint, border: `1px solid ${meta.border}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                        <p className="text-[11px] font-bold text-ink">{meta.label}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-line text-ink tabular-nums">
                        {sups.length}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted mb-2">{meta.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {sups.slice(0, 8).map(s => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-line text-ink font-medium"
                        >
                          {s.length > 18 ? s.slice(0, 16) + '…' : s}
                        </span>
                      ))}
                      {sups.length > 8 && (
                        <span className="text-[10px] text-subtle px-1">+{sups.length - 8}</span>
                      )}
                      {sups.length === 0 && (
                        <span className="text-[10px] text-subtle">Nenhum fornecedor</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ═══ AI NEWS FEED ═══════════════════════════════════════════════ */}
          <section className="rounded-2xl border border-line bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
              <Newspaper size={12} className="text-brand" />
              <p className="text-[11px] font-bold text-ink">Notícias dos Top Fornecedores</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-tint text-brand font-bold uppercase tracking-wider">
                IA · Simulado
              </span>
            </div>
            <ul className="divide-y divide-line">
              {news.map(n => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-brand-tint flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-brand">
                    {n.supplier.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-ink leading-snug">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="font-semibold text-brand">{n.supplier}</span>
                      <span className="text-subtle">·</span>
                      <span className="text-muted">{n.source}</span>
                      <span className="text-subtle">·</span>
                      <span className="text-subtle">{n.time}</span>
                    </div>
                  </div>
                  <ExternalLink size={11} className="flex-shrink-0 mt-1 text-subtle" />
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-subtle text-center px-4 py-2 border-t border-line bg-gray-50/40">
              Integração real com Google News RSS pode ser configurada via backend/proxy para evitar CORS.
            </p>
          </section>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
