import { useState } from 'react'
import { ShoppingCart, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import { DEMO_USERS } from '../constants/roles.js'

export function Login() {
  const login = useAppStore(s => s.login)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [status,   setStatus]   = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password.trim()) return
    setStatus('loading')
    const result = await login(email, password)
    if (result.success) {
      setStatus('idle')
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  const handleQuickLogin = async (user) => {
    setEmail(user.email)
    setPassword(user.email) // default password = email
    setStatus('loading')
    const result = await login(user.email, user.email)
    if (!result.success) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('idle')
    }
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
            { label:'Saving YTD',  value:'R$ 176k',  sub:'+23% vs meta' },
            { label:'Processos',   value:'7',         sub:'em andamento' },
            { label:'Lead Time',   value:'4.2 dias',  sub:'média aprovação' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold" style={{ color:'#10CB9A' }}>{stat.value}</p>
              <p className="text-sm text-white font-medium mt-1">{stat.label}</p>
              <p className="text-xs text-white/50">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <ShoppingCart size={24} style={{ color:'#0D3125' }} />
              <span className="text-xl font-black" style={{ color:'#0D3125' }}>stone. Procurement</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Entrar na plataforma</h2>
            <p className="text-gray-500 text-sm mb-7">Acesso restrito — use seu e-mail e senha corporativos</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="seu.nome@stone.com.br"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setStatus('idle') }}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      status === 'error' ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setStatus('idle') }}
                    className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      status === 'error' ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Primeiro acesso? Sua senha padrão é o seu próprio e-mail.
                </p>
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!email.trim() || !password.trim() || status === 'loading'}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ backgroundColor:'#10CB9A' }}
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={15} />
                    Entrar na plataforma
                  </>
                )}
              </button>
            </form>

            {/* Demo quick login */}
            <div className="mt-6">
              <button
                onClick={() => setShowDemo(v => !v)}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                {showDemo ? '▲ Fechar acesso demo' : '▼ Acesso rápido (ambiente demo)'}
              </button>

              {showDemo && (
                <div className="mt-3 border border-dashed border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Usuários Demo · senha = e-mail
                    </p>
                  </div>
                  {DEMO_USERS.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor:'#0D3125' }}>
                          {user.avatar}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Acesso não autorizado? Contate o Admin em <span className="font-medium">paulo.vidal@stone.com.br</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
