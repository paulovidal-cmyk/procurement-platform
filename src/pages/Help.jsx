import { ArrowRight, ArrowDown, CheckCircle, XCircle, Zap, Users, FileText, ShieldCheck } from 'lucide-react'

function FlowNode({ icon: Icon, title, desc, color = '#0D3125', badge, isSmall }) {
  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${isSmall ? 'min-w-[120px]' : 'min-w-[160px]'}`}
      style={{ borderColor: color + '40' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: color + '15' }}>
        <Icon size={18} style={{ color }} />
      </div>
      {badge && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-1"
          style={{ backgroundColor: color + '15', color }}>
          {badge}
        </span>
      )}
      <p className={`font-semibold text-gray-900 ${isSmall ? 'text-xs' : 'text-sm'}`}>{title}</p>
      {desc && <p className="text-xs text-gray-500 mt-1 leading-snug">{desc}</p>}
    </div>
  )
}

function Arrow({ dir = 'right', label }) {
  return (
    <div className={`flex ${dir === 'down' ? 'flex-col' : ''} items-center gap-1 flex-shrink-0`}>
      {label && <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>}
      {dir === 'right'
        ? <ArrowRight size={20} className="text-gray-300" />
        : <ArrowDown size={20} className="text-gray-300" />
      }
    </div>
  )
}

const THRESHOLD_NODES = [
  { badge: 'Fast Track', label: '< R$ 5k', color: '#10B981', desc: 'Auto-aprovado imediatamente' },
  { badge: 'Coordenação', label: 'R$ 5k–50k', color: '#3B82F6', desc: 'Aprovação do Coordenador' },
  { badge: 'Gestor', label: 'R$ 50k–250k', color: '#8B5CF6', desc: 'Aprovação do Gestor' },
  { badge: 'Diretor', label: '> R$ 250k', color: '#EF4444', desc: 'Aprovação do Diretor' },
]

const FAQ = [
  {
    q: 'O que é Hard Saving vs. Cost Avoidance?',
    a: 'Hard Saving é a redução efetiva de custo comparada a um contrato ou pedido anterior (ex: renegociei de R$100k para R$80k). Cost Avoidance é evitar um custo futuro (ex: fornecedor reajustaria 15%, mas mantemos o preço atual).',
  },
  {
    q: 'Por que meu card ficou bloqueado para edição?',
    a: 'Quando um card entra em fluxo de aprovação (sai de "Aguardando Comprador"), os campos financeiros (Baseline, Valor Final, Saving) são travados automaticamente para garantir compliance. Isso evita que valores sejam alterados após o aprovador dar seu OK.',
  },
  {
    q: 'O que é o Tipo de Baseline?',
    a: 'O baseline é a referência de preço usada para calcular o saving. MPE = preço de mercado para micro/pequenas empresas. Histórico = compra anterior similar. Orçamento = cotação ou orçamento recebido.',
  },
  {
    q: 'Como funciona o Fast Track?',
    a: 'Processos com Valor Final abaixo de R$ 5.000 são aprovados automaticamente pelo sistema, sem necessidade de revisão manual. Isso agiliza o tail spend e libera o time para focar nas compras estratégicas.',
  },
  {
    q: 'O que é VPL e quando devo preencher?',
    a: 'VPL (Valor Presente Líquido) calcula o retorno financeiro de um investimento trazido a valor presente. Preencha quando a compra é um investimento de médio/longo prazo (equipamentos, contratos plurianuais). Insira os fluxos de caixa esperados por período e a taxa de desconto da empresa.',
  },
]

export function Help() {
  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Guia do Processo</h2>
        <p className="text-sm text-gray-500 mt-1">Entenda o fluxo completo de compras da plataforma</p>
      </div>

      {/* Main flow */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-6">Fluxo Geral de Procurement</h3>

        {/* Step 1-3 horizontal */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <FlowNode icon={Users} title="Comprador" desc="Cria o processo" badge="Início" color="#0D3125" />
          <Arrow label="Preenche formulário" />
          <FlowNode icon={FileText} title="Negociação" desc="3 steps no formulário" color="#0D3125" />
          <Arrow label="Envia para aprovação" />
          <FlowNode icon={ShieldCheck} title="Alçada Automática" desc="Sistema roteia por valor" color="#F59E0B" />
        </div>

        {/* Threshold fork */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm font-semibold text-gray-600 mb-4 text-center">Roteamento por alçada (baseado no Valor Final em BRL)</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {THRESHOLD_NODES.map(node => (
              <div key={node.badge} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-gray-500">{node.label}</span>
                <Arrow dir="down" />
                <div className="bg-white rounded-xl border-2 p-3 w-full text-center shadow-sm"
                  style={{ borderColor: node.color + '50' }}>
                  <span className="text-xs font-bold" style={{ color: node.color }}>{node.badge}</span>
                  <p className="text-xs text-gray-500 mt-1">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Aprovado</p>
                <p className="text-xs text-gray-500">Card vai para "Aprovado"</p>
                <p className="text-xs text-gray-400">Saving contabilizado</p>
              </div>
            </div>

            <div className="w-px h-12 bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">Cancelado</p>
                <p className="text-xs text-gray-500">Card vai para "Cancelado"</p>
                <p className="text-xs text-gray-400">Comprador pode revisar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roles guide */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Permissões por Perfil</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Criar</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Editar (em andamento)</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Aprovar</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Analytics</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Settings</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'Comprador', create: true, edit: 'Só em Aguardando', approve: false, analytics: true, settings: false, color: '#0EA5E9' },
                { role: 'Coordenador', create: false, edit: false, approve: '< R$ 50k', analytics: true, settings: false, color: '#3B82F6' },
                { role: 'Gestor', create: false, edit: false, approve: 'R$ 50k–250k', analytics: true, settings: false, color: '#8B5CF6' },
                { role: 'Diretor', create: false, edit: false, approve: '> R$ 250k', analytics: true, settings: false, color: '#EF4444' },
                { role: 'Admin', create: true, edit: 'Qualquer etapa', approve: 'Qualquer', analytics: true, settings: true, color: '#F97316' },
              ].map(row => (
                <tr key={row.role} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium" style={{ color: row.color }}>{row.role}</td>
                  {[row.create, row.edit, row.approve, row.analytics, row.settings].map((val, i) => (
                    <td key={i} className="py-3 text-center">
                      {val === true ? <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                       : val === false ? <XCircle size={16} className="text-gray-300 mx-auto" />
                       : <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{val}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Perguntas Frequentes</h3>
        {FAQ.map((item, i) => (
          <details key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
            <summary className="px-5 py-4 cursor-pointer font-medium text-gray-800 text-sm flex items-center justify-between select-none">
              {item.q}
              <ArrowDown size={14} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" />
            </summary>
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
