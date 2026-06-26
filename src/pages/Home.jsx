import {
  ShoppingCart, BarChart2, ScanLine, ShieldCheck, ArrowUpRight,
  TrendingDown, PiggyBank, Clock, Sparkles, Target,
} from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import homeHero from '../assets/home-hero.mp4'

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
    desc: 'Cost breakdowns com indicadores econômicos por subcategoria.',
  },
  {
    id: 'riskshield', icon: ShieldCheck, label: 'Supplier Risk Shield',
    desc: 'Análise de risco da base de fornecedores com radar de performance.',
  },
]

const HIGHLIGHTS = [
  { icon: PiggyBank,    label: 'Saving YTD',      value: 'R$ 48M',     sub: '76% da meta · R$ 63M' },
  { icon: Clock,        label: 'TMA',             value: '7,5d',       sub: 'tempo médio de atendimento' },
  { icon: Target,       label: 'SLA',             value: '94%',        sub: 'dentro do prazo' },
  { icon: TrendingDown, label: 'Spend YTD 2026',  value: 'R$ 1,37 bi', sub: '+8% vs 2025' },
]

export function Home() {
  const navigate    = useAppStore(s => s.navigate)
  const currentUser = useAppStore(s => s.currentUser)
  const firstName   = currentUser?.name?.split(' ')[0]

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

          {/* Top banner — vídeo (30% inferior cortado: 1920×756) */}
          <div className="rounded-2xl border border-line overflow-hidden bg-gray-50">
            <video
              src={homeHero}
              autoPlay
              loop
              muted
              playsInline
              className="w-full object-cover object-top block"
              style={{ aspectRatio: '1920 / 756' }}
            />
          </div>

          {/* Indicadores */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              Stone Plataforma de Compras · {currentUser?.email}
            </p>
          </div>
      </div>
    </div>
  )
}
