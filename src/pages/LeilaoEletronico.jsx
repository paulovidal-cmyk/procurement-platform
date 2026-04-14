import { Gavel, Construction } from 'lucide-react'

export function LeilaoEletronico() {
  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#e9f3f0' }}>
      <div className="text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Gavel size={36} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <h2 className="text-2xl font-black mb-2" style={{ color: '#0D3125' }}>Leilão Eletrônico</h2>
          <p className="text-sm max-w-sm" style={{ color: '#4a7a68' }}>
            Módulo de leilão reverso em desenvolvimento. Em breve você poderá realizar cotações competitivas diretamente pela plataforma.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mx-auto w-fit"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Construction size={13} />
          Em desenvolvimento
        </div>
      </div>
    </div>
  )
}
