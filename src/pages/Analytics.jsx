import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine, LabelList,
} from 'recharts'
import { TrendingUp, DollarSign, Clock, Package, Target } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import { formatCurrency } from '../utils/formatters.js'
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories.js'
import { COLUMN_DEFS } from '../constants/columns.js'

const STONE_GREEN = '#10CB9A'
const SAVING_META_MONTHLY = 80000 // R$ 80k/mês demo

// Custom tooltip for bar chart
function SavingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-bold">{formatCurrency(payload[0]?.value)}</p>
      <p className="text-red-500">Meta: {formatCurrency(SAVING_META_MONTHLY)}</p>
      {payload[0]?.value >= SAVING_META_MONTHLY
        ? <p className="text-emerald-600 font-medium mt-1">✓ Meta atingida</p>
        : <p className="text-orange-500 mt-1">↓ {formatCurrency(SAVING_META_MONTHLY - payload[0]?.value)} abaixo da meta</p>
      }
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="font-bold" style={{ color: d.payload.color }}>{formatCurrency(d.value)}</p>
      <p className="text-gray-400">{d.payload.pct?.toFixed(1)}% do total</p>
    </div>
  )
}

function StatusTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="font-bold text-gray-900">{payload[0]?.value} card{payload[0]?.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, accent = STONE_GREEN }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + '18' }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function Analytics() {
  const cards = useAppStore(s => s.cards)

  const approved  = cards.filter(c => c.columnId === 'aprovado')
  const pending   = cards.filter(c => ['coordenacao','gestor','diretor'].includes(c.columnId))

  const totalSaving = approved.reduce((s, c) => s + Math.max(c.savingValue || 0, 0), 0)
  const totalSpend  = approved.reduce((s, c) => s + (c.valorFinal || 0), 0)
  const hardSaving  = approved.filter(c => c.tipoSaving === 'Hard').reduce((s, c) => s + Math.max(c.savingValue || 0, 0), 0)

  // Lead time avg
  const leadTimes = approved
    .filter(c => c.approvalHistory.length > 0)
    .map(c => (new Date(c.approvalHistory.at(-1).at) - new Date(c.createdAt)) / 86400000)
  const avgLead = leadTimes.length
    ? (leadTimes.reduce((a,b) => a+b, 0) / leadTimes.length).toFixed(1)
    : '—'

  // ── Monthly saving (last 6 months) ──
  const now = new Date()
  const monthlySavings = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    const value = approved
      .filter(c => {
        const cd = new Date(c.createdAt)
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth()
      })
      .reduce((s, c) => s + Math.max(c.savingValue || 0, 0), 0)
    // Add demo historical data for older months
    const bonus = [45000, 62000, 38000, 89000, 0, 0][i] || 0
    return { label, value: Math.round(value + bonus), meta: SAVING_META_MONTHLY }
  })

  // ── Spend por categoria ──
  const categoryData = CATEGORIES.map(cat => {
    const value = approved.filter(c => c.categoria === cat.value).reduce((s, c) => s + (c.valorFinal || 0), 0)
    return { name: cat.label, value, color: cat.color }
  }).filter(c => c.value > 0)
  const totalCatSpend = categoryData.reduce((s, d) => s + d.value, 0)
  categoryData.forEach(d => { d.pct = totalCatSpend ? (d.value / totalCatSpend) * 100 : 0 })

  // ── Distribuição de status ──
  const statusData = COLUMN_DEFS.map(col => ({
    label: col.label.replace('Aprovação ', '').replace(' Comprador', ''),
    count: cards.filter(c => c.columnId === col.id).length,
    fill: col.headerColor,
  })).filter(d => d.count > 0)

  const metaProgress = SAVING_META_MONTHLY * 6
  const metaPct = Math.min((totalSaving / metaProgress) * 100, 100)

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dashboard Executivo</h2>
            <p className="text-xs text-gray-500 mt-0.5">Visão consolidada · pipeline de procurement</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Target size={13} className="text-emerald-600" />
            Meta mensal: <span className="font-bold text-gray-800">{formatCurrency(SAVING_META_MONTHLY)}</span>
          </div>
        </div>

        {/* ── Metrics row ── */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard icon={TrendingUp} label="Saving Aprovado" value={formatCurrency(totalSaving)}
            sub={`Hard: ${formatCurrency(hardSaving)}`} accent={STONE_GREEN} />
          <MetricCard icon={DollarSign} label="Spend Total" value={formatCurrency(totalSpend)}
            sub={`${approved.length} processos`} accent="#3B82F6" />
          <MetricCard icon={Clock} label="Lead Time Médio" value={`${avgLead} dias`}
            sub="criação → aprovação" accent="#8B5CF6" />
          <MetricCard icon={Package} label="Pendentes" value={pending.length}
            sub={`${cards.length} total`} accent="#F59E0B" />
        </div>

        {/* ── Meta progress bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Saving vs Meta Semestral</p>
            <span className="text-sm font-bold" style={{ color: metaPct >= 100 ? STONE_GREEN : '#F59E0B' }}>
              {metaPct.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${metaPct}%`, backgroundColor: metaPct >= 100 ? STONE_GREEN : '#F59E0B' }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 mt-1">
            <span>{formatCurrency(totalSaving)}</span>
            <span>Meta: {formatCurrency(metaProgress)}</span>
          </div>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-5 gap-3">

          {/* Saving Mensal vs Meta — 3 cols */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">Saving Mensal vs Meta</p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: STONE_GREEN }} />
                  Saving
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-red-400 inline-block" />
                  Meta
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlySavings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<SavingTooltip />} />
                <ReferenceLine y={SAVING_META_MONTHLY} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="value" fill={STONE_GREEN} radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Spend por Categoria — 2 cols */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Spend por Categoria</p>
            <p className="text-[11px] text-gray-400 mb-3">Processos aprovados</p>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Package size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Nenhum aprovado</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Status Distribution ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Distribuição por Status do Pipeline</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 40, left: 80, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category" dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false} tickLine={false} width={80}
              />
              <Tooltip content={<StatusTooltip />} />
              <Bar dataKey="count" radius={[0,4,4,0]} maxBarSize={18}>
                {statusData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Saving breakdown ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Hard Saving vs Cost Avoidance</p>
            <div className="space-y-3">
              {[
                { label: 'Hard Saving', value: hardSaving, color: STONE_GREEN, desc: 'Redução efetiva de custo' },
                { label: 'Cost Avoidance', value: totalSaving - hardSaving, color: '#3B82F6', desc: 'Custos evitados' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="font-bold" style={{ color: item.color }}>{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${totalSaving ? (item.value / totalSaving) * 100 : 0}%`,
                        backgroundColor: item.color,
                      }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top approved by saving */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Top Savings Aprovados</p>
            <div className="space-y-2">
              {[...approved]
                .filter(c => c.savingValue > 0)
                .sort((a,b) => b.savingValue - a.savingValue)
                .slice(0, 4)
                .map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-blue-600 w-16 flex-shrink-0">{c.cardId}</span>
                    <span className="text-xs text-gray-600 flex-1 truncate">{c.razaoSocial}</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(c.savingValue)}</span>
                  </div>
                ))
              }
              {approved.filter(c => c.savingValue > 0).length === 0 && (
                <p className="text-xs text-gray-400">Nenhum processo aprovado ainda</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
