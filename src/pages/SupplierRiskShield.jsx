import { useState } from 'react'
import { Shield, LayoutGrid, Upload } from 'lucide-react'
import { RiskDashboard } from './RiskDashboard.jsx'
import { RiskUpload }    from './RiskUpload.jsx'
import { HubSidebar }    from '../components/layout/HubSidebar.jsx'
import useAppStore from '../store/useAppStore.js'

const SUBNAV_ALL = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard de Risco', desc: 'Visão consolidada', adminOnly: false },
  { id: 'importar',  icon: Upload,     label: 'Importar Dados',     desc: 'CSV ou JSON local', adminOnly: true  },
]

export function SupplierRiskShield() {
  const currentUser = useAppStore(s => s.currentUser)
  const isAdmin     = currentUser?.role === 'admin'
  const SUBNAV      = SUBNAV_ALL.filter(item => !item.adminOnly || isAdmin)
  const [active, setActive] = useState('dashboard')

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#e9f3f0' }}>

      <HubSidebar title="Supplier Risk Shield" titleIcon={Shield} items={SUBNAV} active={active} onSelect={setActive} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {active === 'importar' && isAdmin
          ? <RiskUpload onDone={() => setActive('dashboard')} />
          : <RiskDashboard />
        }
      </div>
    </div>
  )
}
