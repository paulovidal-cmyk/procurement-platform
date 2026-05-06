import { ShoppingCart, BarChart2, Gavel, ScanLine, ShieldCheck, ArrowRight, TrendingDown, CheckCircle, Clock } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import { ROLES } from '../constants/roles.js'

const MODULES = [
  {
    id: 'kanban',
    icon: ShoppingCart,
    label: 'Kanban de Compras',
    desc: 'Gerencie processos de compra com fluxo de aprovação estruturado e tracking de saving em tempo real.',
    color: '#10CB9A',
    bg: 'rgba(16,203,154,0.08)',
    border: 'rgba(16,203,154,0.25)',
  },
  {
    id: 'analytics',
    icon: BarChart2,
    label: 'Analytics',
    desc: 'Dashboards executivos com análise de categorias, matriz de Kraljic e KPIs de procurement.',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    id: 'raiox',
    icon: ScanLine,
    label: 'Raio-X de Preços',
    desc: 'Monte cost breakdowns com indicadores econômicos e compare o should cost do fornecedor.',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'leilao',
    icon: Gavel,
    label: 'Leilão Eletrônico',
    desc: 'Plataforma de leilão reverso para maximizar saving em compras competitivas.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    badge: 'Em breve',
  },
  {
    id: 'riskshield',
    icon: ShieldCheck,
    label: 'Supplier Risk Shield',
    desc: 'Visualização analítica do risco da base de fornecedores com radar de performance e alertas de evidência.',
    color: '#10CB9A',
    bg: 'rgba(16,203,154,0.08)',
    border: 'rgba(16,203,154,0.25)',
  },
]

const STATS = [
  { icon: TrendingDown, label: 'Saving YTD',    value: 'R$ 176k', sub: '+23% vs meta' },
  { icon: CheckCircle,  label: 'Processos',      value: '7',       sub: 'em andamento' },
  { icon: Clock,        label: 'Lead Time Médio', value: '4.2d',   sub: 'aprovação' },
]

export function Home() {
  const navigate    = useAppStore(s => s.navigate)
  const currentUser = useAppStore(s => s.currentUser)
  const role        = ROLES[currentUser?.role]

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">

        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(13,49,37,0.08)', color: '#0D3125', border: '1px solid rgba(13,49,37,0.15)' }}>
            Hub de Compras · Stone
          </div>
          <h1 className="text-4xl font-black leading-tight" style={{ color: '#0D3125' }}>
            Olá, {currentUser?.name?.split(' ')[0]}.<br />
            <span style={{ color: '#10CB9A' }}>O que vamos fazer hoje?</span>
          </h1>
          <p className="text-lg max-w-xl" style={{ color: '#4a7a68' }}>
            Plataforma integrada de procurement — da negociação à aprovação, com dados e governança em tempo real.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {STATS.map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-2xl p-5 bg-white shadow-sm"
                style={{ border: '1px solid rgba(13,49,37,0.08)' }}>
                <Icon size={18} className="mb-3" style={{ color: '#10CB9A' }} />
                <p className="text-2xl font-black" style={{ color: '#0D3125' }}>{s.value}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#0D3125' }}>{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a7a68' }}>{s.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Modules */}
        <div>
          <p className="text-sm font-semibold mb-4 uppercase tracking-widest"
            style={{ color: 'rgba(13,49,37,0.4)' }}>Módulos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MODULES.map(mod => {
              const Icon = mod.icon
              const isLocked = mod.id === 'leilao'
              return (
                <button
                  key={mod.id}
                  onClick={() => !isLocked && navigate(mod.id)}
                  disabled={isLocked}
                  className="text-left rounded-2xl p-6 transition-all group"
                  style={{ background: mod.bg, border: `1px solid ${mod.border}`,
                    cursor: isLocked ? 'default' : 'pointer' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <Icon size={20} style={{ color: mod.color }} />
                    </div>
                    {mod.badge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {mod.badge}
                      </span>
                    ) : (
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: mod.color }} />
                    )}
                  </div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#0D3125' }}>{mod.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#4a7a68' }}>{mod.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <p className="text-xs text-center" style={{ color: 'rgba(13,49,37,0.3)' }}>
            Stone Procurement Platform · {currentUser?.email}
          </p>
        </div>
      </div>
    </div>
  )
}
