import { useState } from 'react'
import { BarChart2, PlusSquare, LayoutGrid } from 'lucide-react'
import { CriacaoPacotes }        from './CriacaoPacotes.jsx'
import { GestaoCostBreakdowns }  from './GestaoCostBreakdowns.jsx'
import { HubSidebar }            from '../components/layout/HubSidebar.jsx'

const SUBNAV = [
  { id: 'criar',  icon: PlusSquare,  label: 'Criação de Pacotes',       desc: 'Monte cost breakdowns' },
  { id: 'gestao', icon: LayoutGrid,  label: 'Gestão de Breakdowns',     desc: 'Acompanhe e compare' },
]

export function RaioXPrecos() {
  const [active, setActive]     = useState('criar')
  const [editingPkg, setEditingPkg] = useState(null)

  const handleEdit = (pkg) => { setEditingPkg(pkg); setActive('criar') }
  const handleNew  = ()    => { setEditingPkg(null); setActive('criar') }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#e9f3f0' }}>

      <HubSidebar
        title="Raio-X de Preços"
        titleIcon={BarChart2}
        items={SUBNAV}
        active={active}
        onSelect={(id) => { setActive(id); if (id === 'criar') setEditingPkg(null) }}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {active === 'criar'
          ? <CriacaoPacotes initialPkg={editingPkg} onSaved={() => setActive('gestao')} />
          : <GestaoCostBreakdowns onNew={handleNew} onEdit={handleEdit} />
        }
      </div>
    </div>
  )
}
