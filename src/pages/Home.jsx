import {
  ShoppingCart, BarChart2, ScanLine, ShieldCheck, ArrowUpRight,
  TrendingDown, CheckCircle2, Clock, Sparkles,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import useAppStore from '../store/useAppStore.js'

const MODULES = [
  {
    id: 'kanban', icon: ShoppingCart, label: 'Kanban de Compras',
    desc: 'Fluxo de aprovação estruturado e tracking de saving em tempo real.',
  },
  {
    id: 'analytics', icon: BarChart2, label: 'Analytics',
    desc: 'Dashboards executivos, matriz de Kraljic e KPIs de procurement.',
  },
  {
    id: 'raiox', icon: ScanLine, label: 'Raio-X de Preços',
    desc: 'Cost breakdowns com indicadores econômicos e should cost.',
  },
  {
    id: 'riskshield', icon: ShieldCheck, label: 'Supplier Risk Shield',
    desc: 'Análise de risco da base de fornecedores com radar de performance.',
  },
]

const SAVING_SERIES = [
  { v: 102 }, { v: 118 }, { v: 110 }, { v: 134 }, { v: 142 },
  { v: 138 }, { v: 156 }, { v: 161 }, { v: 158 }, { v: 168 }, { v: 172 }, { v: 176 },
]

const HIGHLIGHTS = [
  { icon: CheckCircle2, label: 'Processos ativos', value: '7',     sub: 'em andamento' },
  { icon: Clock,        label: 'Lead time médio',  value: '4.2d',  sub: 'até aprovação' },
  { icon: TrendingDown, label: 'Spend YTD',        value: 'R$ 12.4M', sub: '+8% vs 2024' },
]

export function Home() {
  const navigate    = useAppStore(s => s.navigate)
  const currentUser = useAppStore(s => s.currentUser)
  const firstName   = currentUser?.name?.split(' ')[0]

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

          {/* Hero card — saving big number + sparkline */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-muted">Saving YTD</p>
                <p className="text-[42px] font-extrabold text-ink leading-none mt-1 tracking-tight">R$ 176k</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: 'rgba(16,185,129,0.10)', color: '#0e9971' }}>
                    <ArrowUpRight size={11} strokeWidth={2.5} />+23%
                  </span>
                  <span className="text-[11px] text-subtle">vs meta YTD</span>
                </div>
              </div>
              <div className="hidden sm:block w-48 h-14">
                <ResponsiveContainer>
                  <LineChart data={SAVING_SERIES} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
                    <Line type="monotone" dataKey="v" stroke="#10CB9A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-line">
              {HIGHLIGHTS.map(h => {
                const Icon = h.icon
                return (
                  <div key={h.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-tint flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-subtle truncate">{h.label}</p>
                      <p className="text-base font-bold text-ink leading-tight mt-0.5">{h.value}</p>
                      <p className="text-[10px] text-subtle mt-0.5 truncate">{h.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Welcome strip */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-tint flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Olá, {firstName}.</p>
              <p className="text-[11px] text-muted">O que vamos fazer hoje?</p>
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Módulos</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULES.map(mod => {
                const Icon = mod.icon
                return (
                  <button
                    key={mod.id}
                    onClick={() => navigate(mod.id)}
                    className="group text-left rounded-2xl border border-line bg-white p-5 transition-all hover:border-line-strong hover:shadow-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-tint flex items-center justify-center">
                        <Icon size={16} className="text-brand" />
                      </div>
                      <ArrowUpRight size={14} className="text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-semibold text-sm text-ink">{mod.label}</p>
                    <p className="text-xs text-muted leading-relaxed mt-1">{mod.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-2 pb-2">
            <p className="text-[10px] text-subtle text-center">
              Stone Procurement Platform · {currentUser?.email}
            </p>
          </div>
      </div>
    </div>
  )
}
