import { Lock } from 'lucide-react'

/**
 * Envolve uma página "bloqueada": o conteúdo aparece normalmente, mas uma
 * barreira cinza clara por cima captura todos os cliques, impedindo qualquer
 * interação (somente leitura). O TopBar fica fora da barreira, então o usuário
 * ainda consegue navegar para outra aba.
 */
export function LockedOverlay({ children }) {
  return (
    <div className="relative h-full w-full">
      {children}
      <div
        className="absolute inset-0 z-30 flex items-start justify-center cursor-not-allowed"
        style={{ background: 'rgba(148,163,184,0.18)' }}
        role="status"
        aria-label="Esta aba está em modo somente leitura"
      >
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-line shadow-sm text-xs font-semibold text-muted">
          <Lock size={13} className="text-subtle" />
          Visualização bloqueada — somente leitura
        </div>
      </div>
    </div>
  )
}
