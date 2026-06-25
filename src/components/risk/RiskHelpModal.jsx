import { useEffect } from 'react'
import {
  X, Wallet, Database, Newspaper, Calculator, CheckCircle2,
  AlertTriangle, AlertCircle, Sparkles,
} from 'lucide-react'

/**
 * Pop-up "Como funciona?" do Supplier Risk Shield.
 * Explica, em linguagem simples, como a nota de cada fornecedor é calculada.
 * Fecha no X, ao clicar fora (backdrop) ou pressionando ESC.
 */

// Linha de critério: descrição curta + faixas de pontuação (pills).
function Criterio({ titulo, fonte, descricao, faixas }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-bold text-ink">{titulo}</p>
        {fonte && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-subtle flex-shrink-0">{fonte}</span>
        )}
      </div>
      {descricao && <p className="text-[11px] text-muted mt-0.5 leading-snug">{descricao}</p>}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {faixas.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: f.bg || 'rgba(15,23,23,0.05)', color: f.color || '#5B6B66' }}>
            {f.cond} <b className="font-black">{f.pts}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

// Cartão de um pilar, com cabeçalho colorido e badge de peso.
function Pilar({ icon: Icon, cor, titulo, peso, resumo, children }) {
  return (
    <section className="rounded-2xl border border-line overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: `${cor}14` }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cor }}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-ink leading-tight">{titulo}</p>
          {resumo && <p className="text-[10px] text-muted leading-tight">{resumo}</p>}
        </div>
        <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black text-white" style={{ background: cor }}>
          {peso}
        </span>
      </div>
      <div className="p-3 space-y-2 bg-white">{children}</div>
    </section>
  )
}

const PTS = {
  hi:  { bg: 'rgba(16,185,129,0.14)', color: '#059669' },  // verde
  mid: { bg: 'rgba(245,158,11,0.16)', color: '#B45309' },  // amarelo
  lo:  { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626' },  // vermelho
}

export function RiskHelpModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,12,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-tint flex items-center justify-center">
              <Sparkles size={18} className="text-brand" />
            </div>
            <div>
              <h2 className="text-base font-black text-ink leading-tight">Como funciona a nota?</h2>
              <p className="text-[11px] text-muted">Entenda de onde vem a pontuação de cada fornecedor</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-subtle hover:text-ink hover:bg-gray-100 transition-all flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">

          {/* Intro */}
          <p className="text-[12px] text-muted leading-relaxed">
            Cada fornecedor recebe uma nota de <b className="text-ink">0 a 100</b>, formada por três pilares.
            Os dados são coletados automaticamente: parte por <b className="text-ink">APIs públicas</b> (consultadas pelo CNPJ)
            e parte de uma <b className="text-ink">planilha interna</b> da empresa.
          </p>

          {/* Pilar 1 — Saúde Financeira */}
          <Pilar icon={Wallet} cor="#00B85B" titulo="Saúde Financeira" peso="40%"
            resumo="Média simples dos critérios disponíveis (dados públicos por CNPJ)">
            <Criterio
              titulo="Situação na Receita Federal" fonte="API pública"
              descricao="A empresa está ativa perante o governo?"
              faixas={[
                { cond: 'Ativa', pts: '100', ...PTS.hi },
                { cond: 'Outros status', pts: '0', ...PTS.lo },
              ]} />
            <Criterio
              titulo="Maturidade da empresa" fonte="API pública"
              descricao="Há quantos anos o fornecedor opera."
              faixas={[
                { cond: '+10 anos', pts: '100', ...PTS.hi },
                { cond: '5–10 anos', pts: '80', ...PTS.hi },
                { cond: '2–5 anos', pts: '50', ...PTS.mid },
                { cond: '−2 anos', pts: '30', ...PTS.lo },
              ]} />
            <Criterio
              titulo="Exposição financeira" fonte="API + planilha"
              descricao="Quanto o nosso gasto representa do capital social do fornecedor. Quanto maior, maior a dependência e o risco."
              faixas={[
                { cond: 'até 10%', pts: '100', ...PTS.hi },
                { cond: '10–30%', pts: '70', ...PTS.mid },
                { cond: '30–50%', pts: '40', ...PTS.mid },
                { cond: '+50%', pts: '0', ...PTS.lo },
                { cond: '+300% (dado suspeito)', pts: '50', ...PTS.mid },
              ]} />
          </Pilar>

          {/* Pilar 2 — Dados Internos */}
          <Pilar icon={Database} cor="#0EA5E9" titulo="Dados Internos" peso="40%"
            resumo="Média ponderada: Kraljic 50% · Pedidos 25% · Ticket médio 25%">
            <Criterio
              titulo="Quadrante Kraljic · peso 50%" fonte="planilha"
              descricao="Importância estratégica do fornecedor para o negócio."
              faixas={[
                { cond: 'Estratégico', pts: '100', ...PTS.hi },
                { cond: 'Gargalo', pts: '80', ...PTS.hi },
                { cond: 'Alavancagem', pts: '60', ...PTS.mid },
                { cond: 'Outros', pts: '40', ...PTS.mid },
              ]} />
            <Criterio
              titulo="Volume de pedidos · peso 25%" fonte="planilha"
              descricao="Histórico de relacionamento com o fornecedor."
              faixas={[
                { cond: '+50', pts: '100', ...PTS.hi },
                { cond: '21–50', pts: '80', ...PTS.hi },
                { cond: '6–20', pts: '60', ...PTS.mid },
                { cond: 'até 5', pts: '40', ...PTS.mid },
              ]} />
            <Criterio
              titulo="Ticket médio por pedido · peso 25%" fonte="planilha"
              descricao="Spend total ÷ nº de pedidos — impacto médio de cada compra."
              faixas={[
                { cond: '+R$ 50 mil', pts: '100', ...PTS.hi },
                { cond: 'R$ 10–50 mil', pts: '80', ...PTS.hi },
                { cond: 'R$ 2–10 mil', pts: '60', ...PTS.mid },
                { cond: '−R$ 2 mil', pts: '40', ...PTS.mid },
              ]} />
          </Pilar>

          {/* Pilar 3 — Reputação */}
          <Pilar icon={Newspaper} cor="#8B5CF6" titulo="Reputação & Notícias" peso="20%"
            resumo="Busca na internet + análise por IA (Google Gemini)">
            <Criterio
              titulo="Notícias associadas ao CNPJ" fonte="Internet + IA"
              descricao="A IA pesquisa notícias recentes, resume o conteúdo e atribui uma nota conforme a gravidade."
              faixas={[
                { cond: 'Sem risco', pts: '100', ...PTS.hi },
                { cond: 'Risco encontrado', pts: '0–100', ...PTS.mid },
              ]} />
            <p className="text-[11px] text-muted leading-snug px-1">
              Em todos os casos fica registrado o <b>clipping de auditoria</b> (título, link e resumo da IA). Sem risco,
              o registro recebe “Nenhum risco relevante encontrado”.
            </p>
          </Pilar>

          {/* Nota final */}
          <section className="rounded-2xl border border-line bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator size={16} className="text-ink" />
              <p className="text-[13px] font-black text-ink">Nota final</p>
            </div>
            <div className="rounded-xl bg-white border border-line px-3 py-2 text-[12px] font-semibold text-ink text-center tabular-nums">
              Saúde Financeira × 0,40 &nbsp;+&nbsp; Dados Internos × 0,40 &nbsp;+&nbsp; Reputação × 0,20
            </div>
            <p className="text-[11px] text-muted mt-2 mb-2.5">O resultado é arredondado e classificado em três status:</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <CheckCircle2 size={15} className="mx-auto mb-0.5" style={{ color: '#10b981' }} />
                <p className="text-[12px] font-black" style={{ color: '#059669' }}>APROVADO</p>
                <p className="text-[10px] font-semibold text-muted tabular-nums">75–100</p>
              </div>
              <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(245,158,11,0.14)' }}>
                <AlertTriangle size={15} className="mx-auto mb-0.5" style={{ color: '#f59e0b' }} />
                <p className="text-[12px] font-black" style={{ color: '#B45309' }}>ATENÇÃO</p>
                <p className="text-[10px] font-semibold text-muted tabular-nums">50–74</p>
              </div>
              <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={15} className="mx-auto mb-0.5" style={{ color: '#ef4444' }} />
                <p className="text-[12px] font-black" style={{ color: '#DC2626' }}>CRÍTICO</p>
                <p className="text-[10px] font-semibold text-muted tabular-nums">0–49</p>
              </div>
            </div>
          </section>

          <p className="text-[10px] text-subtle leading-snug">
            Se algum dado não estiver disponível, o critério é ignorado e a média é calculada apenas com os
            critérios disponíveis.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
            style={{ background: '#00D26A' }}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
