import { useState } from 'react'
import { PieChart, BarChart2, ChevronRight } from 'lucide-react'
import { CategoryDashboard } from './CategoryDashboard.jsx'
import { Analytics } from './Analytics.jsx'

const SUBNAV = [
  { id: 'category', icon: PieChart,  label: 'Análise de Categoria',  desc: 'Spend, Kraljic e fornecedores' },
  { id: 'kanban',   icon: BarChart2, label: 'Analytics do Kanban',   desc: 'Fluxo de aprovações e saving' },
]

export function AnalyticsHub() {
  const [active, setActive] = useState('category')

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#e9f3f0' }}>

      {/* Internal Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5 px-3 border-r bg-white"
        style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3"
          style={{ color: 'rgba(13,49,37,0.35)' }}>
          Analytics
        </p>
        <nav className="flex flex-col gap-1">
          {SUBNAV.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="relative w-full text-left px-3 py-3 rounded-xl transition-all"
                style={{
                  background: isActive ? 'rgba(16,203,154,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(16,203,154,0.2)' : '1px solid transparent',
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: '#10CB9A' }} />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon size={15} style={{ color: isActive ? '#10CB9A' : 'rgba(13,49,37,0.35)' }} />
                  <div>
                    <p className="text-xs font-semibold leading-tight"
                      style={{ color: isActive ? '#0D3125' : 'rgba(13,49,37,0.6)' }}>
                      {item.label}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-tight"
                      style={{ color: 'rgba(13,49,37,0.35)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {active === 'category' ? <CategoryDashboard /> : <Analytics />}
      </div>
    </div>
  )
}
