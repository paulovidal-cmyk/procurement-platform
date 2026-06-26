import { useState } from 'react'
import { BarChart2, Gauge, Upload } from 'lucide-react'
import { Analytics } from './Analytics.jsx'
import { Produtividade } from './Produtividade.jsx'
import { ProdutividadeUpload } from './ProdutividadeUpload.jsx'
import { HubSidebar } from '../components/layout/HubSidebar.jsx'
import useAppStore from '../store/useAppStore.js'

const SUBNAV_ALL = [
  { id: 'kanban',        icon: BarChart2, label: 'Analytics do Kanban',  desc: 'Fluxo de aprovações e saving',  adminOnly: false },
  { id: 'produtividade', icon: Gauge,     label: 'Produtividade',        desc: 'Pedidos e spend por comprador', adminOnly: false },
  { id: 'prod-upload',   icon: Upload,     label: 'Atualizar base',      desc: 'Importar planilha (admin)',     adminOnly: true  },
]

export function AnalyticsHub() {
  const currentUser = useAppStore(s => s.currentUser)
  const isAdmin     = currentUser?.role === 'admin'
  const SUBNAV      = SUBNAV_ALL.filter(item => !item.adminOnly || isAdmin)
  const [active, setActive] = useState('kanban')

  // Fallback: se cair numa view admin sem ser admin, volta para a default.
  const activeItem = SUBNAV_ALL.find(i => i.id === active)
  const safeActive = (activeItem?.adminOnly && !isAdmin) ? 'kanban' : active

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
          {safeActive === 'kanban'        && <Analytics />}
          {safeActive === 'produtividade' && <Produtividade />}
          {safeActive === 'prod-upload'   && <ProdutividadeUpload onDone={() => setActive('produtividade')} />}
        </div>
      </div>
    </div>
  )
}
