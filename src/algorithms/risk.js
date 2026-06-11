/**
 * Funções de processamento e cálculo do módulo Supplier Risk Shield
 */

/** Parse spend: "R$ 1.234.567,89" ou número puro → float */
export function parseSpend(raw) {
  if (raw === null || raw === undefined || raw === '') return 0
  const s = String(raw)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const v = parseFloat(s)
  return isNaN(v) ? 0 : v
}

/**
 * Parse numérico tolerante a formato misto:
 *  - com vírgula → pt-BR ("1.234.567,89"): ponto = milhar, vírgula = decimal
 *  - sem vírgula → US/plano ("2950125.20", "265000"): ponto = decimal
 */
export function parseNumber(raw) {
  if (raw === null || raw === undefined || raw === '') return 0
  if (typeof raw === 'number') return raw
  let s = String(raw).replace(/R\$\s?/g, '').trim()
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  s = s.replace(/[^\d.-]/g, '')
  const v = parseFloat(s)
  return isNaN(v) ? 0 : v
}

/** Parse nota — campo vazio ou ausente é tratado como 100 */
export function parseNota(raw) {
  if (raw === null || raw === undefined || raw === '') return 100
  const v = parseFloat(String(raw).replace(',', '.'))
  return isNaN(v) ? 100 : Math.min(100, Math.max(0, v))
}

/** Cor de risco baseada na nota (verde ≥75, amarelo 50-74, vermelho <50) */
export function riskColor(nota) {
  if (nota == null) return '#6b7280'
  if (nota >= 75) return '#10b981'
  if (nota >= 50) return '#f59e0b'
  return '#ef4444'
}

export function riskBg(nota) {
  if (nota == null) return 'rgba(107,114,128,0.1)'
  if (nota >= 75) return 'rgba(16,185,129,0.1)'
  if (nota >= 50) return 'rgba(245,158,11,0.1)'
  return 'rgba(239,68,68,0.08)'
}

export function riskLabel(nota) {
  if (nota == null) return '—'
  if (nota >= 75) return 'Baixo'
  if (nota >= 50) return 'Médio'
  return 'Alto'
}

/** Primeiro valor não-vazio entre várias chaves possíveis (aliases de coluna). */
function pick(row, ...keys) {
  for (const k of keys) {
    const v = row[k]
    if (v !== null && v !== undefined && String(v).trim() !== '') return v
  }
  return ''
}

/**
 * Transforma linha de CSV/JSON em objeto fornecedor normalizado.
 * Aceita tanto o schema antigo (nota_financeira, qtd_pedidos, evidencia_titulo…)
 * quanto o export do n8n (score_saude_financeira, quantidade_de_pedidos,
 * score_reputacao, score_dados_internos, evidencia_noticia…).
 */
export function processRow(row, idx) {
  const ng = parseNota(pick(row, 'nota_geral'))
  return {
    id: row.id || `imp-${idx}`,
    fornecedor:    String(pick(row, 'nome_fornecedor', 'fornecedor', 'Fornecedor', 'Nome Fornecedor')).trim(),
    cnpj:          String(pick(row, 'cnpj', 'CNPJ')).trim(),
    categoria:     String(pick(row, 'categoria', 'Categoria')).trim(),
    subcategoria:  String(pick(row, 'subcategoria', 'Subcategoria')).trim(),
    spend:       parseSpend(pick(row, 'spend', 'Spend')),
    qtd_pedidos: parseInt(String(pick(row, 'qtd_pedidos', 'pedidos', 'quantidade_de_pedidos') || '0').replace(/\D/g, ''), 10) || 0,
    nota_geral:       ng,
    nota_financeira:  parseNota(pick(row, 'nota_financeira',   'score_saude_financeira')),
    nota_inteligencia:parseNota(pick(row, 'nota_inteligencia', 'score_reputacao')),
    nota_risco:       parseNota(pick(row, 'nota_risco',        'score_dados_internos')),
    fin_situacao:  parseNota(pick(row, 'fin_situacao')),
    fin_maturidade:parseNota(pick(row, 'fin_maturidade')),
    fin_exposicao: parseNota(pick(row, 'fin_exposicao')),
    int_kraljic:   parseNota(pick(row, 'int_kraljic')),
    int_pedidos:   parseNota(pick(row, 'int_pedidos')),
    int_ticket:    parseNota(pick(row, 'int_ticket')),
    status_risco:  riskLabel(ng),
    evidencia_titulo:    String(pick(row, 'evidencia_titulo', 'evidencia_noticia')).trim(),
    link_noticia:        String(pick(row, 'link_noticia')).trim(),
    analise_ia_detalhada:String(pick(row, 'analise_ia_detalhada')).trim(),
    // ── Dados cadastrais / da empresa (export n8n) ──────────────────────────
    quadrante:              String(pick(row, 'quadrante', 'Quadrante')).trim(),
    situacao_cadastral:     String(pick(row, 'descricao_situacao_cadastral', 'situacao_cadastral')).trim(),
    capital_social:         parseNumber(pick(row, 'capital_social')),
    data_inicio_atividade:  String(pick(row, 'data_inicio_atividade')).trim(),
    cnae:                   String(pick(row, 'cnae_fiscal_descricao', 'cnae')).trim(),
    anos_atividade:         parseFloat(String(pick(row, 'anos_atividade')).replace(',', '.')) || null,
    ticket_medio:           parseNumber(pick(row, 'ticket_medio')),
    percentual_exposicao:   String(pick(row, 'percentual_exposicao')).trim(),
  }
}

/**
 * Calcula as médias globais do radar/totalizadores, PONDERADAS PELO SPEND.
 * Fornecedores de maior spend pesam mais na média da tela.
 * Recebe a lista já filtrada — então recalcula a cada mudança de filtro.
 * Se o spend total for zero (sem dados de spend), cai para média simples.
 */
export function calcGlobalRadar(suppliers) {
  if (!suppliers.length) return { financeiro: 0, inteligencia: 0, risco: 0, geral: 0 }
  const n = suppliers.length
  const totalSpend = suppliers.reduce((s, p) => s + (p.spend ?? 0), 0)
  const avg = (k) => {
    if (totalSpend > 0) {
      return suppliers.reduce((s, p) => s + (p[k] ?? 0) * (p.spend ?? 0), 0) / totalSpend
    }
    return suppliers.reduce((s, p) => s + (p[k] ?? 0), 0) / n
  }
  return {
    financeiro:   avg('nota_financeira'),
    inteligencia: avg('nota_inteligencia'),
    risco:        avg('nota_risco'),
    geral:        avg('nota_geral'),
  }
}

export function fmtSpend(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(v)
}
