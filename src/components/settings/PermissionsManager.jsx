import { EyeOff, Lock, Eye, RotateCcw, ShieldCheck } from 'lucide-react'
import { MODULES, ACCESS } from '../../constants/modules.js'
import { ROLES } from '../../constants/roles.js'
import useAppStore from '../../store/useAppStore.js'

const LEVELS = [
  { id: ACCESS.HIDDEN, label: 'Oculta',    icon: EyeOff, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  desc: 'A aba não aparece no menu' },
  { id: ACCESS.LOCKED, label: 'Bloqueada', icon: Lock,   color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', desc: 'A aba aparece, mas sem interação (barreira cinza)' },
  { id: ACCESS.FULL,   label: 'Normal',    icon: Eye,    color: '#10b981', bg: 'rgba(16,185,129,0.14)', desc: 'A aba aparece e permite interação' },
]

const EDITABLE_ROLES = Object.values(ROLES).filter(r => r.id !== 'admin')

function SegControl({ value, onChange, ariaPrefix }) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100" role="group">
      {LEVELS.map(lv => {
        const Icon = lv.icon
        const active = value === lv.id
        return (
          <button
            key={lv.id}
            onClick={() => onChange(lv.id)}
            title={`${lv.label} — ${lv.desc}`}
            aria-label={`${ariaPrefix}: ${lv.label}`}
            aria-pressed={active}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
            style={{
              background: active ? lv.bg : 'transparent',
              color: active ? lv.color : '#9aa3a0',
            }}
          >
            <Icon size={12} />
            <span className="hidden md:inline">{lv.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function PermissionsManager() {
  const modulePermissions    = useAppStore(s => s.modulePermissions)
  const setModulePermission  = useAppStore(s => s.setModulePermission)
  const resetModulePermissions = useAppStore(s => s.resetModulePermissions)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-800">Permissões de Acesso por Perfil</h3>
        </div>
        <button
          onClick={resetModulePermissions}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
        >
          <RotateCcw size={12} /> Restaurar padrão
        </button>
      </div>

      {/* Legenda */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-4">
        {LEVELS.map(lv => {
          const Icon = lv.icon
          return (
            <div key={lv.id} className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-md" style={{ background: lv.bg }}>
                <Icon size={12} style={{ color: lv.color }} />
              </span>
              <span className="text-xs font-medium text-gray-700">{lv.label}</span>
              <span className="text-[11px] text-gray-400">— {lv.desc}</span>
            </div>
          )
        })}
      </div>

      {/* Matriz: módulos (linhas) × perfis (colunas) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aba / Módulo</th>
              {EDITABLE_ROLES.map(r => (
                <th key={r.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(m => {
              const Icon = m.icon
              return (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{m.label}</span>
                    </div>
                  </td>
                  {EDITABLE_ROLES.map(r => (
                    <td key={r.id} className="px-4 py-3">
                      <SegControl
                        value={modulePermissions?.[r.id]?.[m.id] ?? ACCESS.FULL}
                        onChange={(lv) => setModulePermission(r.id, m.id, lv)}
                        ariaPrefix={`${m.label} para ${r.label}`}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-400">
          O perfil <b>Administrador</b> sempre tem acesso total a todas as abas e não pode ser bloqueado.
          As alterações valem imediatamente e ficam salvas no navegador.
        </p>
      </div>
    </div>
  )
}
