import { useState } from 'react'
import { Users, CheckCircle, XCircle, Shield, Clock, Mail, AlertTriangle, Sliders } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { ROLES, DEMO_USERS } from '../constants/roles.js'
import useAppStore from '../store/useAppStore.js'
import { formatDateTime } from '../utils/formatters.js'
import { FieldManager } from '../components/settings/FieldManager.jsx'

const ROLE_OPTIONS = Object.values(ROLES)

export function Settings() {
  const currentUser = useAppStore(s => s.currentUser)
  const allUsers = useAppStore(s => s.allUsers)
  const pendingUsers = useAppStore(s => s.pendingUsers)
  const approveUser = useAppStore(s => s.approveUser)
  const rejectUser = useAppStore(s => s.rejectUser)
  const updateUserRole = useAppStore(s => s.updateUserRole)

  const [activeTab, setActiveTab] = useState('users')

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield size={48} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Acesso Restrito</h2>
        <p className="text-gray-500 text-sm mt-2">Esta tela é exclusiva para Administradores.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
        <p className="text-sm text-gray-500 mt-1">Gerenciamento de usuários e acessos da plataforma</p>
      </div>

      {/* Admin badge */}
      <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <Shield size={18} className="text-orange-600" />
        <div>
          <p className="text-sm font-semibold text-orange-800">Você está como Administrador</p>
          <p className="text-xs text-orange-600">{currentUser.name} · {currentUser.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'users',  label: 'Usuários Ativos',       count: allUsers.length,    icon: Users },
          { id: 'pending', label: 'Aguardando Aprovação', count: pendingUsers.length, icon: Clock },
          { id: 'fields', label: 'Campos do Formulário',  count: null,               icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Usuários Ativos</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Usuário', 'Email', 'Perfil', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => {
                const role = ROLES[user.role]
                return (
                  <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: '#0D3125' }}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          {user.id === currentUser.id && (
                            <span className="text-xs text-orange-600 font-medium">Você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.role}
                        disabled={user.id === currentUser.id}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {user.id === currentUser.id ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-medium">
                          Ativo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">Nenhum usuário pendente</p>
              <p className="text-sm text-gray-400 mt-1">Todas as solicitações foram processadas.</p>
            </div>
          ) : (
            pendingUsers.map(user => (
              <div key={user.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                    {user.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Mail size={13} />
                      {user.email}
                    </div>
                    {user.requestedAt && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Clock size={11} />
                        Solicitado em {formatDateTime(user.requestedAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-gray-500">Perfil:</span>
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                      defaultValue="comprador"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => rejectUser(user.id)}>
                    <XCircle size={14} />
                    Rejeitar
                  </Button>
                  <Button variant="success" size="sm" onClick={() => approveUser(user.id)}>
                    <CheckCircle size={14} />
                    Aprovar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'fields' && <FieldManager />}

      {/* Info section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Sobre o SSO Google</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Em produção, a autenticação via Google é configurada no Google Cloud Console com o Client ID do domínio stone.com.br.
              No ambiente demo, o login é simulado com e-mails @stone.com.br. Usuários não cadastrados entram em fila de aprovação do Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
