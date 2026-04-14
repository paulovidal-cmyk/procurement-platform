import { useState, useMemo, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TrendingUp, Package, ShoppingCart, Award, Newspaper,
         ChevronDown, Database, RefreshCw, ExternalLink, Wifi, WifiOff } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0D3125',
  card:    '#0A2A1F',
  border:  'rgba(16,203,154,0.18)',
  text:    '#B6ECA9',
  muted:   'rgba(182,236,169,0.55)',
  accent:  '#10CB9A',
  chart: ['#10CB9A','#34D399','#6EE7B7','#A7F3D0','#D1FAE5','#059669','#047857','#065F46'],
}

const QUADRANT_META = {
  'Estratégico': { label:'Estratégico', bg:'rgba(16,203,154,0.12)',  border:'rgba(16,203,154,0.35)',  dot:C.accent,  desc:'Alto spend · Alta complexidade' },
  'Alavancável': { label:'Alavancável', bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.35)',  dot:'#60A5FA', desc:'Alto spend · Baixa complexidade' },
  'Gargalo':     { label:'Gargalo',     bg:'rgba(239,68,68,0.10)',   border:'rgba(239,68,68,0.35)',   dot:'#F87171', desc:'Baixo spend · Alta complexidade' },
  'Rotina':      { label:'Rotina',      bg:'rgba(156,163,175,0.10)', border:'rgba(156,163,175,0.30)', dot:'#9CA3AF', desc:'Baixo spend · Baixa complexidade' },
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
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v/1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)     return `R$ ${(v/1_000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DarkCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}
      style={{ background: C.card, borderColor: C.border }}>
      {children}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <DarkCard className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(16,203,154,0.12)', border: `1px solid ${C.border}` }}>
        <Icon size={18} style={{ color: C.accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</p>
        <p className="text-xl font-bold truncate" style={{ color: accent || C.text }}>{value}</p>
        {sub && <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{sub}</p>}
      </div>
    </DarkCard>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl text-xs"
      style={{ background: '#051A10', border: `1px solid ${C.border}`, color: C.text }}>
      {label && <p className="font-semibold mb-1" style={{ color: C.accent }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.text }}>
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
    <div className="rounded-xl px-3 py-2 shadow-xl text-xs"
      style={{ background: '#051A10', border: `1px solid ${C.border}`, color: C.text }}>
      <p className="font-semibold mb-1" style={{ color: C.accent }}>{name}</p>
      <p>{fmt(value)} <span style={{ color: C.muted }}>({(percent*100).toFixed(1)}%)</span></p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CategoryDashboard() {
  const csvData      = useAppStore(s => s.sheetsData)
  const csvLoading   = useAppStore(s => s.sheetsLoading)
  const csvError     = useAppStore(s => s.sheetsError)
  const loadCsvData  = useAppStore(s => s.loadSheetsData)

  // Auto-load on first render
  useEffect(() => { loadCsvData() }, [])

  const categories = useMemo(() => [...new Set(csvData.map(r => r.categoria))].sort(), [csvData])
  const [selectedCat, setSelectedCat] = useState('')
  const activeCat = selectedCat || categories[0] || ''

  const data = useMemo(() =>
    activeCat ? csvData.filter(r => r.categoria === activeCat) : csvData,
    [csvData, activeCat]
  )

  // KPIs
  const totalSpend   = data.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const totalPedidos = data.reduce((s, r) => s + (Number(r.qtdPedidos) || 0), 0)
  const avgSpend     = data.length ? totalSpend / data.length : 0

  // Leader supplier
  const supplierMap = {}
  data.forEach(r => { supplierMap[r.fornecedor] = (supplierMap[r.fornecedor] || 0) + (Number(r.spend) || 0) })
  const sortedSuppliers = Object.entries(supplierMap).sort((a,b) => b[1] - a[1])
  const leader = sortedSuppliers[0]?.[0] || '—'
  const leaderShare = totalSpend > 0 ? ((sortedSuppliers[0]?.[1] || 0) / totalSpend * 100).toFixed(0) : 0

  // Donut chart: Spend by Subcategoria
  const subMap = {}
  data.forEach(r => { subMap[r.subcategoria] = (subMap[r.subcategoria] || 0) + (Number(r.spend) || 0) })
  const donutData = Object.entries(subMap).sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value }))

  // Bar chart: Top 5 suppliers
  const top5 = sortedSuppliers.slice(0, 5).map(([name, spend]) => {
    const pedidos = data.filter(r => r.fornecedor === name).reduce((s,r) => s+(Number(r.qtdPedidos)||0), 0)
    return { name: name.length > 18 ? name.slice(0,16)+'…' : name, spend, pedidos }
  })

  // Kraljic quadrants
  const quadrantGroups = { 'Estratégico':[], 'Alavancável':[], 'Gargalo':[], 'Rotina':[] }
  data.forEach(r => {
    const q = r.quadrante
    if (quadrantGroups[q]) quadrantGroups[q].push(r.fornecedor)
  })
  // Deduplicate within quadrant
  Object.keys(quadrantGroups).forEach(k => {
    quadrantGroups[k] = [...new Set(quadrantGroups[k])]
  })

  // Mock news for top 5 suppliers
  const top5Names = sortedSuppliers.slice(0,5).map(([n]) => n)
  const news = getMockNews(top5Names)

  const isConnected = !csvError

  return (
    <div className="h-full overflow-y-auto" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: C.text }}>
              Análise de Categoria
            </h1>
            <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: C.muted }}>
              <Wifi size={12} style={{ color: C.accent }} />
              {csvLoading ? 'Carregando planilha…' : `${csvData.length} registros · Google Sheets`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category selector */}
            <div className="relative">
              <select
                value={activeCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 cursor-pointer"
                style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text,
                  boxShadow: `0 0 0 0 ${C.accent}` }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: C.muted }} />
            </div>

            <button
              onClick={loadCsvData}
              disabled={csvLoading}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
            >
              <RefreshCw size={13} className={csvLoading ? 'animate-spin' : ''} style={{ color: C.accent }} />
              {csvLoading ? 'Carregando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Error */}
        {csvError && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 text-red-300"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)' }}>
            Erro ao carregar planilha: {csvError}
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={TrendingUp}   label="Total Spend"        value={fmt(totalSpend)}    sub={`${data.length} negociações`}         />
          <KpiCard icon={Package}      label="Total de Pedidos"   value={totalPedidos.toLocaleString('pt-BR')} sub="soma de qtd pedidos" />
          <KpiCard icon={ShoppingCart} label="Ticket Médio"       value={fmt(avgSpend)}      sub="por negociação"                       />
          <KpiCard icon={Award}        label="Fornecedor Líder"   value={leader}             sub={`${leaderShare}% do spend`} accent={C.accent} />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Donut: Spend por Subcategoria */}
          <DarkCard className="lg:col-span-2">
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Spend por Subcategoria</p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  paddingAngle={2} dataKey="value" nameKey="name">
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={C.chart[i % C.chart.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconSize={8} iconType="circle"
                  formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </DarkCard>

          {/* Bar: Top 5 Fornecedores */}
          <DarkCard className="lg:col-span-3">
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Top 5 Fornecedores · Spend</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top5} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fill: C.muted, fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }}
                  axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spend" name="Spend" radius={[0,6,6,0]} barSize={16}>
                  {top5.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </DarkCard>
        </div>

        {/* ── Kraljic Matrix ── */}
        <DarkCard>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: C.text }}>Matriz de Kraljic</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>Classificação estratégica dos fornecedores</p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background:'#60A5FA' }} /> Baixo risco →
              </span>
              <span className="flex items-center gap-1.5">
                ↑ Alto spend
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative">
            {/* Y-axis label */}
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] whitespace-nowrap"
              style={{ color: C.muted }}>Impacto Financeiro (Spend)</div>

            {['Alavancável','Estratégico','Rotina','Gargalo'].map(q => {
              const meta = QUADRANT_META[q]
              const suppliers = quadrantGroups[q] || []
              return (
                <div key={q} className="rounded-xl p-4 min-h-[140px]"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.text }}>{meta.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{meta.desc}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: meta.border, color: C.text }}>
                      {suppliers.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suppliers.slice(0, 8).map(s => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(0,0,0,0.25)', color: C.text, border: `1px solid ${meta.border}` }}>
                        {s.length > 18 ? s.slice(0,16)+'…' : s}
                      </span>
                    ))}
                    {suppliers.length > 8 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: C.muted }}>
                        +{suppliers.length - 8}
                      </span>
                    )}
                    {suppliers.length === 0 && (
                      <span className="text-[11px]" style={{ color: C.muted }}>Nenhum fornecedor</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* X-axis label */}
            <div className="col-span-2 text-center text-[10px] mt-1" style={{ color: C.muted }}>
              Complexidade de Abastecimento / Risco →
            </div>
          </div>
        </DarkCard>

        {/* ── AI News Feed ── */}
        <DarkCard>
          <div className="flex items-center gap-2 mb-5">
            <Newspaper size={15} style={{ color: C.accent }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>
              Notícias dos Top Fornecedores
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full ml-1"
              style={{ background:'rgba(16,203,154,0.12)', color: C.accent, border:`1px solid ${C.border}` }}>
              IA · Simulado
            </span>
          </div>

          <div className="space-y-3">
            {news.map((n) => (
              <div key={n.id} className="flex items-start gap-4 p-3 rounded-xl transition-colors cursor-default"
                style={{ background:'rgba(0,0,0,0.15)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background:'rgba(16,203,154,0.15)', color: C.accent }}>
                  {n.supplier.slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug" style={{ color: C.text }}>{n.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px]" style={{ color: C.accent }}>{n.supplier}</span>
                    <span className="text-[11px]" style={{ color: C.muted }}>via {n.source}</span>
                    <span className="text-[11px]" style={{ color: C.muted }}>{n.time}</span>
                  </div>
                </div>
                <ExternalLink size={13} className="flex-shrink-0 mt-0.5" style={{ color: C.muted }} />
              </div>
            ))}
          </div>

          <p className="text-[11px] mt-4 text-center" style={{ color: C.muted }}>
            Integração real com Google News RSS pode ser configurada via backend/proxy para evitar CORS.
          </p>
        </DarkCard>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  )
}
