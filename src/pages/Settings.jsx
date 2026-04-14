import { useState } from 'react'
import { Users, CheckCircle, XCircle, Shield, Clock, Mail, AlertTriangle,
         Sliders, Database, RotateCcw, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { ROLES } from '../constants/roles.js'
import useAppStore from '../store/useAppStore.js'
import { formatDateTime } from '../utils/formatters.js'
import { FieldManager } from '../components/settings/FieldManager.jsx'
import { SheetsConfig } from '../components/settings/SheetsConfig.jsx'

const ROLE_OPTIONS = Object.values(ROLES)

function AddUserForm({ onClose }) {
  const addAllowedUser = useAppStore(s => s.addAllowedUser)
  const [email, setEmail] = useState('')
  const [name,  setName]  = useState('')
  const [role,  setRole]  = useState('comprador')
  const [error, setError] = useState('')
  const [ok,    setOk]    = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('E-mail obrigatório.'); return }
    const result = addAllowedUser(email.trim(), role, name.trim())
    if (result?.error) { setError(result.error); return }
    setOk(true)
    setTimeout(onClose, 1200)
  }

  if (ok) return (
    <div className="flex items-center gap-2 text-emerald-700 text-sm py-2">
      <CheckCircle size={16} /> Usuário adicionado com sucesso!
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar Novo Usuário</p>
      <div className="grid grid-cols-2 gap-3">
        <input type="text" placeholder="Nome (opcional)" value={name}
          onChange={e => setName(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <input type="email" placeholder="email@stone.com.br *" value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          className={`px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${error ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'}`} />
      </div>
      <div className="flex items-center gap-3">
        <select value={role} onChange={e => setRole(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
          {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onClose}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          <button type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: '#0D3125' }}>
            <UserPlus size={13} /> Adicionar
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        A senha padrão será o próprio e-mail. O usuário precisará criar uma nova senha no primeiro acesso.
      </p>
    </form>
  )
}

export function Settings() {
  const currentUser    = useAppStore(s => s.currentUser)
  const allUsers       = useAppStore(s => s.allUsers)
  const pendingUsers   = useAppStore(s => s.pendingUsers)
  const approveUser    = useAppStore(s => s.approveUser)
  const rejectUser     = useAppStore(s => s.rejectUser)
  const updateUserRole = useAppStore(s => s.updateUserRole)
  const resetUserPassword = useAppStore(s => s.resetUserPassword)

  const [activeTab,   setActiveTab]   = useState('users')
  const [showAddUser, setShowAddUser] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(null) // userId

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield size={48} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Acesso Restrito</h2>
        <p className="text-gray-500 text-sm mt-2">Esta tela é exclusiva para Administradores.</p>
      </div>
    )
  }

  const TABS = [
    { id:'users',   label:'Usuários Ativos',       icon:Users,    count:allUsers.length },
    { id:'pending', label:'Aguardando',             icon:Clock,    count:pendingUsers.length },
    { id:'fields',  label:'Campos do Formulário',   icon:Sliders,  count:null },
    { id:'sheets',  label:'Conexão Sheets',         icon:Database, count:null },
  ]

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
        <p className="text-sm text-gray-500 mt-1">Administração de usuários, campos e integrações</p>
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
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
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

      {/* ── Usuários Ativos ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Usuários Ativos</h3>
            </div>
            <button onClick={() => setShowAddUser(v => !v)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all text-white"
              style={{ backgroundColor: '#0D3125' }}>
              <UserPlus size={13} />
              {showAddUser ? 'Cancelar' : 'Novo Usuário'}
            </button>
          </div>

          {showAddUser && (
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <AddUserForm onClose={() => setShowAddUser(false)} />
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Usuário','Email','Perfil','Senha','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => {
                const role = ROLES[user.role]
                const isSelf = user.id === currentUser.id
                return (
                  <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor:'#0D3125' }}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          {isSelf && <span className="text-xs text-orange-600 font-medium">Você</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.email || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.role}
                        disabled={isSelf}
                        onChange={e => updateUserRole(user.id, e.target.value)}
                      >
                        {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {resetConfirm === user.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-red-600">Confirma?</span>
                          <button onClick={() => { resetUserPassword(user.id); setResetConfirm(null) }}
                            className="text-xs text-red-600 font-semibold hover:text-red-800">Sim</button>
                          <button onClick={() => setResetConfirm(null)}
                            className="text-xs text-gray-500 hover:text-gray-700">Não</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResetConfirm(user.id)}
                          disabled={isSelf}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg transition-all disabled:opacity-30 disabled:cursor-default"
                        >
                          <RotateCcw size={11} /> Resetar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.mustChangePassword ? (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          1º acesso pendente
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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

      {/* ── Aguardando ── */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">Nenhum usuário pendente</p>
              <p className="text-sm text-gray-400 mt-1">Todas as solicitações foram processadas.</p>
            </div>
          ) : pendingUsers.map(user => (
            <div key={user.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Mail size={13} />{user.email}
                  </div>
                  {user.requestedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <Clock size={11} /> Solicitado em {formatDateTime(user.requestedAt)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="danger"  size="sm" onClick={() => rejectUser(user.id)}><XCircle size={14} />Rejeitar</Button>
                <Button variant="success" size="sm" onClick={() => approveUser(user.id)}><CheckCircle size={14} />Aprovar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Campos do Formulário ── */}
      {activeTab === 'fields' && <FieldManager />}

      {/* ── Conexão Sheets ── */}
      {activeTab === 'sheets' && <SheetsConfig />}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Autenticação Interna</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Senhas são armazenadas como hash SHA-256. A senha padrão de cada usuário é o próprio e-mail.
              No primeiro acesso, o sistema exige a criação de uma senha pessoal.
              Em produção, considere migrar para um backend com JWT e armazenamento seguro (PostgreSQL + bcrypt).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
