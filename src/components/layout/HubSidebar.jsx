import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'

/**
 * Sidebar compartilhada dos hubs (Analytics, Risk Shield, Raio-X).
 *
 * Tem um botão de "gaveta" para recolher/expandir. Recolhida, fica magrinha e
 * mostra só os ícones (com tooltip no hover). O estado é global e persistido
 * (sidebarCollapsed no useAppStore), então vale para todas as telas.
 *
 * Props:
 *  - title:     rótulo da seção (ex.: "Analytics")
 *  - titleIcon: ícone lucide opcional ao lado do título
 *  - items:     [{ id, icon, label, desc }]
 *  - active:    id do item ativo
 *  - onSelect:  (id) => void
 */
export function HubSidebar({ title, titleIcon: TitleIcon, items, active, onSelect }) {
  const collapsed     = useAppStore(s => s.sidebarCollapsed)
  const toggleSidebar = useAppStore(s => s.toggleSidebar)

  return (
    <aside
      className={`flex-shrink-0 flex flex-col py-5 border-r border-line bg-white transition-[width] duration-200 ${
        collapsed ? 'w-16 px-2' : 'w-56 px-3'
      }`}
    >
      {/* Header + botão de gaveta */}
      <div className={`flex items-center mb-4 h-6 ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {TitleIcon && <TitleIcon size={15} className="text-brand flex-shrink-0" />}
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle truncate">{title}</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-subtle hover:text-ink hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Itens */}
      <nav className="flex flex-col gap-1">
        {items.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full rounded-xl transition-all border ${
                collapsed ? 'flex justify-center py-2.5' : 'text-left px-3 py-2.5'
              } ${isActive ? 'bg-brand-tint border-brand/20' : 'border-transparent hover:bg-gray-50'}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand" />
              )}
              {collapsed ? (
                <Icon size={18} className={isActive ? 'text-brand' : 'text-subtle'} />
              ) : (
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isActive ? 'text-brand' : 'text-subtle'} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-ink' : 'text-muted'}`}>
                      {item.label}
                    </p>
                    {item.desc && (
                      <p className="text-[10px] mt-0.5 leading-tight text-subtle truncate">{item.desc}</p>
                    )}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
