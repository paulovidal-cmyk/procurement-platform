import { useState } from 'react'
import { PieChart, BarChart2, Gauge, Upload } from 'lucide-react'
import { CategoryDashboard } from './CategoryDashboard.jsx'
import { Analytics } from './Analytics.jsx'
import { Produtividade } from './Produtividade.jsx'
import { ProdutividadeUpload } from './ProdutividadeUpload.jsx'
import useAppStore from '../store/useAppStore.js'

const SUBNAV_ALL = [
  { id: 'category',      icon: PieChart,  label: 'Análise de Categoria', desc: 'Spend, Kraljic e fornecedores', adminOnly: false },
  { id: 'kanban',        icon: BarChart2, label: 'Analytics do Kanban',  desc: 'Fluxo de aprovações e saving',  adminOnly: false },
  { id: 'produtividade', icon: Gauge,     label: 'Produtividade',        desc: 'Pedidos e spend por comprador', adminOnly: false },
  { id: 'prod-upload',   icon: Upload,    label: 'Atualizar base',       desc: 'Importar planilha (admin)',     adminOnly: true  },
]

export function AnalyticsHub() {
  const currentUser = useAppStore(s => s.currentUser)
  const isAdmin     = currentUser?.role === 'admin'
  const SUBNAV      = SUBNAV_ALL.filter(item => !item.adminOnly || isAdmin)
  const [active, setActive] = useState('category')

  // Fallback: se cair numa view admin sem ser admin, volta para a default.
  const safeActive = (active === 'prod-upload' && !isAdmin) ? 'category' : active

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#e9f3f0' }}>

      {/* Internal Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5 px-3 border-r border-line bg-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-subtle px-2 mb-3">
          Analytics
        </p>
        <nav className="flex flex-col gap-1">
          {SUBNAV.map(item => {
            const Icon = item.icon
            const isActive = safeActive === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`relative w-full text-left px-3 py-2.5 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-brand-tint border-brand/20'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand" />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isActive ? 'text-brand' : 'text-subtle'} />
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-ink' : 'text-muted'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-tight text-subtle">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {safeActive === 'kanban' && (
          <div className="flex-shrink-0 bg-red-600 text-white text-center text-xs font-semibold py-1.5 tracking-wide">
            Em testes, números fictícios
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {safeActive === 'category'      && <CategoryDashboard />}
          {safeActive === 'kanban'        && <Analytics />}
          {safeActive === 'produtividade' && <Produtividade />}
          {safeActive === 'prod-upload'   && <ProdutividadeUpload onDone={() => setActive('produtividade')} />}
        </div>
      </div>
    </div>
  )
}
