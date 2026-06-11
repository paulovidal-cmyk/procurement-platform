import { useState } from 'react'
import { PieChart, BarChart2, Gauge, Upload, MonitorPlay } from 'lucide-react'
import { CategoryDashboard } from './CategoryDashboard.jsx'
import { Analytics } from './Analytics.jsx'
import { Produtividade } from './Produtividade.jsx'
import { ProdutividadeUpload } from './ProdutividadeUpload.jsx'
import { DashboardExterno } from './DashboardExterno.jsx'
import { HubSidebar } from '../components/layout/HubSidebar.jsx'
import useAppStore from '../store/useAppStore.js'

const SUBNAV_ALL = [
  { id: 'category',      icon: PieChart,  label: 'Análise de Categoria', desc: 'Spend, Kraljic e fornecedores', adminOnly: false },
  { id: 'kanban',        icon: BarChart2, label: 'Analytics do Kanban',  desc: 'Fluxo de aprovações e saving',  adminOnly: false },
  { id: 'produtividade', icon: Gauge,     label: 'Produtividade',        desc: 'Pedidos e spend por comprador', adminOnly: false },
  { id: 'prod-upload',   icon: Upload,     label: 'Atualizar base',      desc: 'Importar planilha (admin)',     adminOnly: true  },
  { id: 'dashboard-ext', icon: MonitorPlay, label: 'Dashboard',          desc: 'Painel externo (admin)',        adminOnly: true  },
]

export function AnalyticsHub() {
  const currentUser = useAppStore(s => s.currentUser)
  const isAdmin     = currentUser?.role === 'admin'
  const SUBNAV      = SUBNAV_ALL.filter(item => !item.adminOnly || isAdmin)
  const [active, setActive] = useState('category')

  // Fallback: se cair numa view admin sem ser admin, volta para a default.
  const activeItem = SUBNAV_ALL.find(i => i.id === active)
  const safeActive = (activeItem?.adminOnly && !isAdmin) ? 'category' : active

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#e9f3f0' }}>

      <HubSidebar title="Analytics" items={SUBNAV} active={safeActive} onSelect={setActive} />

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
          {safeActive === 'dashboard-ext' && <DashboardExterno />}
        </div>
      </div>
    </div>
  )
}
