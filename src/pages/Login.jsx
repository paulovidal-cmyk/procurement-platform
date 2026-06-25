import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ScanLine, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import logoUrl from '../assets/logo.png'

// Ferramentas exibidas na vitrine de login (sem Kanban e sem analytics de Kanban).
const TOOLS = [
  { icon: ScanLine,   label: 'Raio-X de Preços',     desc: 'Cost breakdowns e inflação por categoria' },
  { icon: ShieldCheck, label: 'Supplier Risk Shield', desc: 'Risco e saúde dos fornecedores' },
  { icon: TrendingUp,  label: 'Produtividade',        desc: 'Indicadores de pedidos por comprador' },
]

export function Login() {
  const login        = useAppStore(s => s.login)
  const claimAccount = useAppStore(s => s.claimAccount)
  const allUsers     = useAppStore(s => s.allUsers)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [status,   setStatus]   = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  const lc = email.trim().toLowerCase()
  const known = allUsers.find(u => u.email.toLowerCase() === lc)
  // Modo "criar senha": e-mail AUTORIZADO (na lista) ainda sem senha (1º acesso).
  const isFirstAccess = !!known && !known.passwordHash
  const pwdOk = password.length >= 6

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password.trim()) return

    if (isFirstAccess) {
      if (!pwdOk)              { setStatus('error'); setErrorMsg('A senha precisa ter ao menos 6 caracteres.'); return }
      if (password !== confirm) { setStatus('error'); setErrorMsg('As senhas não coincidem.'); return }
      setStatus('loading')
      const result = await claimAccount(email, password)
      if (result.success) setStatus('idle')
      else { setStatus('error'); setErrorMsg(result.error) }
      return
    }

    setStatus('loading')
    const result = await login(email, password)
    if (result.success) {
      setStatus('idle')
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* Left: Branding (vitrine Stone) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #E8FAEF 0%, #C2EAC9 55%, #9BE3B4 100%)' }}>

        {/* Blobs decorativos */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 420, height: 420, right: -120, top: -80, background: 'rgba(0,210,106,0.18)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 300, height: 300, left: -80, bottom: -60, background: 'rgba(0,184,91,0.14)' }} />

        {/* Topo: logo */}
        <div className="relative">
          <img src={logoUrl} alt="Resolve Compras" className="h-11 w-auto" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-3" style={{ color: 'rgba(13,49,37,0.55)' }}>
            CSC · Centro de Serviços Compartilhados
          </p>
        </div>

        {/* Centro: headline + frase de efeito */}
        <div className="relative max-w-md">
          <h1 className="text-[44px] font-black leading-[1.05] tracking-tight" style={{ color: '#0D3125' }}>
            Plataforma de<br />
            <span style={{ color: '#00B85B' }}>Suprimentos</span>
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: 'rgba(13,49,37,0.5)' }}>
            CSC · Stone co.
          </p>
          <p className="text-lg leading-relaxed mt-5" style={{ color: 'rgba(13,49,37,0.75)' }}>
            Tudo o que o comprador precisa em um só lugar — decida preços, escolha fornecedores e acompanhe a produtividade com dados, não no achismo.
          </p>
        </div>

        {/* Base: ferramentas dentro da plataforma */}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(13,49,37,0.45)' }}>
            O que tem dentro
          </p>
          <div className="space-y-2.5">
            {TOOLS.map(t => {
              const Icon = t.icon
              return (
                <div key={t.label} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(13,49,37,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#00D26A' }}>
                    <Icon size={17} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight" style={{ color: '#0D3125' }}>{t.label}</p>
                    <p className="text-xs leading-tight" style={{ color: 'rgba(13,49,37,0.55)' }}>{t.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#F6FBF8' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-line p-10">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center mb-8">
              <img src={logoUrl} alt="Resolve Compras" className="h-10 w-auto" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isFirstAccess ? 'Criar seu acesso' : 'Entrar na plataforma'}
            </h2>
            <p className="text-gray-500 text-sm mb-7">
              {isFirstAccess
                ? 'Primeiro acesso — defina sua senha pessoal'
                : 'Acesso restrito — apenas e-mails autorizados pelo administrador'}
            </p>

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
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  {isFirstAccess ? 'Crie sua senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder={isFirstAccess ? 'Mínimo 6 caracteres' : 'Sua senha'}
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
                {!isFirstAccess && (
                  <p className="text-xs text-gray-400 mt-1">
                    Acesso liberado pelo administrador. No 1º acesso você define a sua senha.
                  </p>
                )}
              </div>

              {/* Confirmar senha (apenas no 1º acesso) */}
              {isFirstAccess && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirmar senha</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setStatus('idle') }}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        confirm && confirm !== password
                          ? 'border-red-400 bg-red-50 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                      }`}
                    />
                  </div>
                </div>
              )}

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
                 style={{ backgroundColor:'#00D26A' }}
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isFirstAccess ? <ArrowRight size={15} /> : <Lock size={15} />}
                    {isFirstAccess ? 'Criar acesso e entrar' : 'Entrar na plataforma'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Acesso exclusivo para colaboradores <span className="font-medium">@stone.com.br</span>.
                Dúvidas? Fale com <span className="font-medium">paulo.vidal@stone.com.br</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
