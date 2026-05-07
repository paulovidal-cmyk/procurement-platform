import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine, LabelList,
} from 'recharts'
import { TrendingUp, DollarSign, Clock, Package, Target, BarChart2 } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import { formatCurrency } from '../utils/formatters.js'
import { CATEGORIES } from '../constants/categories.js'
import { COLUMN_DEFS } from '../constants/columns.js'

const BRAND = '#00D26A'
const SAVING_META_MONTHLY = 80000

// ─── Tooltips ───────────────────────────────────────────────────────────────────

function SavingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  const hit = value >= SAVING_META_MONTHLY
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border border-line shadow-lg text-[11px]">
      <p className="font-bold text-ink mb-0.5">{label}</p>
      <p className="font-bold text-brand tabular-nums">{formatCurrency(value)}</p>
      <p className="text-[10px] text-subtle tabular-nums">Meta: {formatCurrency(SAVING_META_MONTHLY)}</p>
      <p className={`text-[10px] mt-0.5 font-semibold ${hit ? 'text-emerald-600' : 'text-amber-600'}`}>
        {hit ? '✓ Meta atingida' : `↓ ${formatCurrency(SAVING_META_MONTHLY - value)} abaixo`}
      </p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border border-line shadow-lg text-[11px]">
      <p className="font-bold text-ink mb-0.5">{d.name}</p>
      <p className="font-bold tabular-nums" style={{ color: d.payload.color }}>{formatCurrency(d.value)}</p>
      <p className="text-subtle tabular-nums">{d.payload.pct?.toFixed(1)}% do total</p>
    </div>
  )
}

function StatusTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-2.5 py-1.5 bg-white border border-line shadow-lg text-[11px]">
      <p className="font-bold text-ink">{label}</p>
      <p className="font-bold text-ink tabular-nums">{payload[0]?.value} card{payload[0]?.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Atoms ──────────────────────────────────────────────────────────────────────

function KpiTile({ icon: Icon, label, value, sub, accent = BRAND }) {
  return (
    <div className="rounded-xl bg-gray-50/60 border border-line p-3">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        <Icon size={11} style={{ color: accent }} />
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-base font-bold text-ink leading-tight tracking-tight tabular-nums truncate">{value}</div>
      {sub && <p className="text-[9px] text-subtle mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export function Analytics() {
  const cards = useAppStore(s => s.cards)

  const approved = cards.filter(c => c.columnId === 'aprovado')
  const pending  = cards.filter(c => ['coordenacao', 'gestor', 'diretor'].includes(c.columnId))

  const totalSaving = approved.reduce((s, c) => s + Math.max(c.savingValue || 0, 0), 0)
  const totalSpend  = approved.reduce((s, c) => s + (c.valorFinal || 0), 0)
  const hardSaving  = approved.filter(c => c.tipoSaving === 'Hard').reduce((s, c) => s + Math.max(c.savingValue || 0, 0), 0)

  const leadTimes = approved
    .filter(c => c.approvalHistory.length > 0)
    .map(c => (new Date(c.approvalHistory.at(-1).at) - new Date(c.createdAt)) / 86400000)
  const avgLead = leadTimes.length
    ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1)
    : '—'

  // Monthly saving (last 6 months) com demo histórico
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
    const bonus = [45000, 62000, 38000, 89000, 0, 0][i] || 0
    return { label, value: Math.round(value + bonus) }
  })

  // Spend por categoria
  const categoryData = CATEGORIES.map(cat => {
    const value = approved.filter(c => c.categoria === cat.value).reduce((s, c) => s + (c.valorFinal || 0), 0)
    return { name: cat.label, value, color: cat.color }
  }).filter(c => c.value > 0)
  const totalCatSpend = categoryData.reduce((s, d) => s + d.value, 0)
  categoryData.forEach(d => { d.pct = totalCatSpend ? (d.value / totalCatSpend) * 100 : 0 })

  // Status distribution
  const statusData = COLUMN_DEFS.map(col => ({
    label: col.label.replace('Aprovação ', '').replace(' Comprador', ''),
    count: cards.filter(c => c.columnId === col.id).length,
    fill: col.headerColor,
  })).filter(d => d.count > 0)

  const metaProgress = SAVING_META_MONTHLY * 6
  const metaPct = Math.min((totalSaving / metaProgress) * 100, 100)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-4">

          {/* ═══ HERO COCKPIT ═══════════════════════════════════════════════ */}
          <section className="rounded-3xl border border-line bg-white overflow-hidden">
            <div className="grid grid-cols-12">

              {/* LEFT — Saving mensal mini chart */}
              <div
                className="col-span-12 lg:col-span-5 relative flex flex-col py-5 px-5 lg:border-r border-line"
                style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.06) 0%, rgba(255,255,255,0) 60%)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Saving mensal</p>
                    <p className="text-[20px] font-black text-ink tracking-tight tabular-nums leading-none mt-1">
                      {formatCurrency(totalSaving)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-tint text-brand">
                    <Target size={10} />
                    Meta {formatCurrency(SAVING_META_MONTHLY)}/mês
                  </span>
                </div>
                <div className="flex-1" style={{ minHeight: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySavings} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,23,0.06)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#5B6B66' }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#97A3A0' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      />
                      <Tooltip content={<SavingTooltip />} cursor={{ fill: 'rgba(0,210,106,0.06)' }} />
                      <ReferenceLine y={SAVING_META_MONTHLY} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.2} />
                      <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CENTER — Title + KPI strip */}
              <div className="col-span-12 lg:col-span-7 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center">
                        <BarChart2 size={14} className="text-brand" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
                        Dashboard Executivo
                      </p>
                    </div>
                    <h2 className="text-[28px] font-black tracking-tight leading-none text-ink">
                      Pipeline de Compras
                    </h2>
                    <p className="text-[11px] text-muted mt-1">
                      Visão consolidada · {cards.length} processo{cards.length !== 1 ? 's' : ''} ativo{cards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: metaPct >= 100 ? 'rgba(0,210,106,0.12)' : 'rgba(245,158,11,0.12)',
                      color: metaPct >= 100 ? BRAND : '#B45309',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: metaPct >= 100 ? BRAND : '#F59E0B' }}
                    />
                    {metaPct.toFixed(0)}% da meta
                  </span>
                </div>

                {/* Meta progress bar */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Saving vs Meta Semestral
                    </span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: metaPct >= 100 ? BRAND : '#F59E0B' }}>
                      {formatCurrency(totalSaving)} / {formatCurrency(metaProgress)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${metaPct}%`, background: metaPct >= 100 ? BRAND : '#F59E0B' }}
                    />
                  </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-3 pt-4 mt-auto border-t border-line">
                  <KpiTile icon={TrendingUp}  label="Saving Aprovado" value={formatCurrency(totalSaving)} sub={`Hard: ${formatCurrency(hardSaving)}`} accent={BRAND} />
                  <KpiTile icon={DollarSign}  label="Spend Total"     value={formatCurrency(totalSpend)}  sub={`${approved.length} processos`} accent="#3B82F6" />
                  <KpiTile icon={Clock}       label="Lead Time"       value={`${avgLead} d`}              sub="criação → aprov." accent="#8B5CF6" />
                  <KpiTile icon={Package}     label="Pendentes"       value={pending.length}              sub={`${cards.length} total`} accent="#F59E0B" />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ CHARTS ROW ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Spend por Categoria — donut */}
            <section className="lg:col-span-2 rounded-2xl border border-line bg-white p-4 overflow-hidden">
              <div className="mb-3">
                <p className="text-[11px] font-bold text-ink">Spend por Categoria</p>
                <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">Processos aprovados</p>
              </div>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {categoryData.slice(0, 4).map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-[10px] text-ink truncate flex-1">{d.name}</span>
                        <span className="text-[10px] text-subtle tabular-nums">{d.pct.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-subtle">
                  <Package size={24} className="mb-1.5 opacity-30" />
                  <p className="text-[11px]">Nenhum processo aprovado</p>
                </div>
              )}
            </section>

            {/* Status distribution */}
            <section className="lg:col-span-3 rounded-2xl border border-line bg-white p-4 overflow-hidden">
              <div className="mb-3">
                <p className="text-[11px] font-bold text-ink">Distribuição por Status do Pipeline</p>
                <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">Cards por etapa</p>
              </div>
              <ResponsiveContainer width="100%" height={statusData.length > 0 ? 28 * statusData.length + 20 : 100}>
                <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 30, left: 4, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#5B6B66', fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<StatusTooltip />} cursor={{ fill: 'rgba(0,210,106,0.06)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={14}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0A0E0C' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          {/* ═══ SAVING BREAKDOWN ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Hard saving vs Cost avoidance */}
            <section className="rounded-2xl border border-line bg-white p-4">
              <div className="mb-3">
                <p className="text-[11px] font-bold text-ink">Hard Saving vs Cost Avoidance</p>
                <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">Composição do saving aprovado</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Hard Saving',    value: hardSaving,                 color: BRAND,     desc: 'Redução efetiva de custo' },
                  { label: 'Cost Avoidance', value: totalSaving - hardSaving,   color: '#3B82F6', desc: 'Custos evitados' },
                ].map(item => {
                  const pct = totalSaving ? (item.value / totalSaving) * 100 : 0
                  return (
                    <div key={item.label}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[11px] font-semibold text-ink">{item.label}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: item.color }}>
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: item.color }}
                        />
                      </div>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <p className="text-[9px] text-subtle">{item.desc}</p>
                        <span className="text-[9px] text-subtle tabular-nums">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Top approved by saving */}
            <section className="rounded-2xl border border-line bg-white p-4 overflow-hidden">
              <div className="mb-3">
                <p className="text-[11px] font-bold text-ink">Top Savings Aprovados</p>
                <p className="text-[9px] text-subtle uppercase tracking-wider mt-0.5">Maiores reduções da safra atual</p>
              </div>
              <ul className="divide-y divide-line">
                {[...approved]
                  .filter(c => c.savingValue > 0)
                  .sort((a, b) => b.savingValue - a.savingValue)
                  .slice(0, 5)
                  .map(c => (
                    <li key={c.id} className="flex items-center gap-2 py-1.5">
                      <span className="font-mono text-[10px] text-brand font-bold w-14 flex-shrink-0">{c.cardId}</span>
                      <span className="text-[11px] text-ink flex-1 truncate">{c.razaoSocial}</span>
                      <span className="text-[11px] font-bold text-brand tabular-nums">{formatCurrency(c.savingValue)}</span>
                    </li>
                  ))
                }
                {approved.filter(c => c.savingValue > 0).length === 0 && (
                  <li className="text-[11px] text-subtle py-2">Nenhum processo aprovado ainda</li>
                )}
              </ul>
            </section>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
