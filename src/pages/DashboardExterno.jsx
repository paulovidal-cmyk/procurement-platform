import { ExternalLink, MonitorPlay, Info } from 'lucide-react'

/**
 * Dashboard externo (Artifact do Claude).
 *
 * O Claude envia `X-Frame-Options: SAMEORIGIN`, então o Artifact NÃO pode ser
 * embedado em iframe fora do domínio dele (ficaria em branco). Por isso a tela
 * é um card de acesso que abre o dashboard em nova aba.
 *
 * Obs.: o link claude.ai é privado (exige login). Para acesso de outros
 * usuários, publique o Artifact e troque pela URL claude.site/...
 */
const ARTIFACT_URL = 'https://claude.ai/artifacts/latest/019e658f-dd6f-72ca-ae8a-0f98f3af59fd'

export function DashboardExterno() {
  return (
    <div className="h-full flex items-center justify-center bg-white px-6" style={{ background: '#e9f3f0' }}>
      <div className="max-w-md w-full bg-white rounded-3xl border border-line p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-brand-tint">
          <MonitorPlay size={26} className="text-brand" />
        </div>
        <h2 className="text-lg font-black text-ink">Dashboard externo</h2>
        <p className="text-sm text-muted mt-1.5 leading-snug">
          Painel construído no Claude. Por restrição de segurança do Claude, ele não pode ser exibido
          dentro do site — abra em uma nova aba.
        </p>

        <a
          href={ARTIFACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 mt-5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
          style={{ background: '#00D26A' }}
        >
          <ExternalLink size={15} /> Abrir dashboard
        </a>

        <div className="flex items-start gap-2 mt-6 text-left bg-gray-50 border border-line rounded-xl p-3">
          <Info size={14} className="text-subtle flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted leading-snug">
            Este link é privado (exige login na conta Claude). Para que outros usuários acessem,
            publique o Artifact e use a URL <span className="font-mono">claude.site/...</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
