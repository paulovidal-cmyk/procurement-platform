import { useState } from 'react'
import { BarChart2, PlusSquare, LayoutGrid } from 'lucide-react'
import { CriacaoPacotes }        from './CriacaoPacotes.jsx'
import { GestaoCostBreakdowns }  from './GestaoCostBreakdowns.jsx'

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

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5 px-3 border-r bg-white"
        style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
        <div className="flex items-center gap-2 px-2 mb-4">
          <BarChart2 size={15} style={{ color: '#10CB9A' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(13,49,37,0.35)' }}>
            Raio-X de Preços
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {SUBNAV.map(item => {
            const Icon     = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); if (item.id === 'criar') setEditingPkg(null) }}
                className="relative w-full text-left px-3 py-3 rounded-xl transition-all"
                style={{
                  background: isActive ? 'rgba(16,203,154,0.12)' : 'transparent',
                  border:     isActive ? '1px solid rgba(16,203,154,0.2)' : '1px solid transparent',
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
        {active === 'criar'
          ? <CriacaoPacotes initialPkg={editingPkg} onSaved={() => setActive('gestao')} />
          : <GestaoCostBreakdowns onNew={handleNew} onEdit={handleEdit} />
        }
      </div>
    </div>
  )
}
