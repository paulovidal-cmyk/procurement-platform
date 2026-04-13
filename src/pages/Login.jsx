import { useState } from 'react'
import { ShoppingCart, Mail, AlertCircle, Clock, ChevronRight, Lock } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import { DEMO_USERS } from '../constants/roles.js'

export function Login() {
  const login = useAppStore(s => s.login)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error | pending
  const [errorMsg, setErrorMsg] = useState('')
  const [showQuickLogin, setShowQuickLogin] = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    // Simulate SSO delay
    await new Promise(r => setTimeout(r, 800))

    const result = login(email)
    if (result.success) {
      setStatus('idle')
    } else if (result.pending) {
      setStatus('pending')
      setErrorMsg(result.error || null)
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  const handleQuickLogin = (user) => {
    login(user.email)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0D3125 0%, #1a5c42 50%, #0D3125 100%)' }}>
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">stone.</p>
            <p className="text-xs text-white/60 uppercase tracking-widest">Procurement Platform</p>
          </div>
        </div>

        <div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            Governança de<br />
            <span style={{ color: '#10CB9A' }}>Compras</span><br />
            Inteligente
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Fluxo de aprovação estruturado, tracking de saving em tempo real e compliance garantido para cada processo de compra.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Saving YTD', value: 'R$ 176k', sub: '+23% vs meta' },
            { label: 'Processos', value: '7', sub: 'em andamento' },
            { label: 'Lead Time', value: '4.2 dias', sub: 'média aprovação' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold" style={{ color: '#10CB9A' }}>{stat.value}</p>
              <p className="text-sm text-white font-medium mt-1">{stat.label}</p>
              <p className="text-xs text-white/50">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <ShoppingCart size={24} style={{ color: '#0D3125' }} />
              <span className="text-xl font-black" style={{ color: '#0D3125' }}>stone. Procurement</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Entrar na plataforma</h2>
            <p className="text-gray-500 text-sm mb-8">Acesso restrito a colaboradores <strong>@stone.com.br</strong></p>

            {status === 'pending' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                  <Clock size={32} style={{ color: '#F59E0B' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aguardando aprovação</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Sua solicitação de acesso foi enviada ao Administrador. Você será notificado quando aprovado.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setEmail('') }}
                  className="text-sm font-medium"
                  style={{ color: '#0D3125' }}
                >
                  ← Tentar outro e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* SSO Google button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-gray-700"
                  onClick={() => setShowQuickLogin(prev => !prev)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google (@stone.com.br)
                </button>

                {/* Quick login for demo */}
                {showQuickLogin && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acesso rápido (Demo)</p>
                    </div>
                    {DEMO_USERS.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickLogin(user)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: '#0D3125' }}>
                            {user.avatar}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="seu.nome@stone.com.br"
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      status === 'error'
                        ? 'border-red-400 bg-red-50 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                    }`}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || status === 'loading'}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#10CB9A' }}
                >
                  {status === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} />
                      Entrar na plataforma
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Ao entrar, você concorda com as políticas internas de Procurement da Stone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
