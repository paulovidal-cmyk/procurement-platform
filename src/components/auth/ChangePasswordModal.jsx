import { useState } from 'react'
import { Lock, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'

const RULES = [
  { test: p => p.length >= 8,       text: 'Mínimo 8 caracteres' },
  { test: p => /[A-Z]/.test(p),     text: 'Uma letra maiúscula' },
  { test: p => /[0-9]/.test(p),     text: 'Um número' },
]

export function ChangePasswordModal() {
  const currentUser    = useAppStore(s => s.currentUser)
  const changePassword = useAppStore(s => s.changePassword)

  const [newPwd, setNewPwd]       = useState('')
  const [confirmPwd, setConfirm]  = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const rulesOk = RULES.every(r => r.test(newPwd))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rulesOk)             { setError('A senha não atende os requisitos.'); return }
    if (newPwd !== confirmPwd) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      await changePassword(currentUser.id, newPwd)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#0D3125' }}>
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Criar nova senha</h2>
            <p className="text-sm text-gray-500">Primeiro acesso · obrigatório</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          Olá, <strong>{currentUser?.name}</strong>! Por segurança, crie uma senha pessoal antes de continuar.
          <br />
          <span className="text-xs text-amber-600 mt-0.5 block">
            Sua senha padrão atual é o seu e-mail.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nova senha */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nova Senha</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setError('') }}
                placeholder="Mínimo 8 caracteres"
                autoFocus
                className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmar */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirmar Senha</label>
            <div className="relative">
              <input
                type={showConf ? 'text' : 'password'}
                value={confirmPwd}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                placeholder="Repita a nova senha"
                className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  confirmPwd && confirmPwd !== newPwd
                    ? 'border-red-400 bg-red-50 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                }`}
              />
              <button type="button" onClick={() => setShowConf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Regras */}
          <div className="space-y-1.5 px-1">
            {RULES.map(r => {
              const ok = r.test(newPwd)
              return (
                <div key={r.text} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <Check size={12} className={ok ? 'opacity-100' : 'opacity-25'} />
                  {r.text}
                </div>
              )
            })}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !rulesOk || !confirmPwd}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0D3125' }}
          >
            {loading ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
