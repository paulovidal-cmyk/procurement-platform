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

/** Transforma linha de CSV/JSON em objeto fornecedor normalizado */
export function processRow(row, idx) {
  const ng = parseNota(row.nota_geral)
  return {
    id: row.id || `imp-${idx}`,
    fornecedor:    String(row.fornecedor    || row.Fornecedor    || '').trim(),
    cnpj:          String(row.cnpj          || row.CNPJ          || '').trim(),
    categoria:     String(row.categoria     || row.Categoria     || '').trim(),
    subcategoria:  String(row.subcategoria  || row.Subcategoria  || '').trim(),
    spend:       parseSpend(row.spend || row.Spend || ''),
    qtd_pedidos: parseInt(String(row.qtd_pedidos || row.pedidos || '0').replace(/\D/g, ''), 10) || 0,
    nota_geral:       ng,
    nota_financeira:  parseNota(row.nota_financeira),
    nota_inteligencia:parseNota(row.nota_inteligencia),
    nota_risco:       parseNota(row.nota_risco),
    fin_situacao:  parseNota(row.fin_situacao),
    fin_maturidade:parseNota(row.fin_maturidade),
    fin_exposicao: parseNota(row.fin_exposicao),
    int_kraljic:   parseNota(row.int_kraljic),
    int_pedidos:   parseNota(row.int_pedidos),
    int_ticket:    parseNota(row.int_ticket),
    status_risco:  riskLabel(ng),
    evidencia_titulo:    String(row.evidencia_titulo    || '').trim(),
    link_noticia:        String(row.link_noticia        || '').trim(),
    analise_ia_detalhada:String(row.analise_ia_detalhada|| '').trim(),
  }
}

/** Calcula médias globais para o radar */
export function calcGlobalRadar(suppliers) {
  if (!suppliers.length) return { financeiro: 0, inteligencia: 0, risco: 0, geral: 0 }
  const n = suppliers.length
  const avg = k => suppliers.reduce((s, p) => s + (p[k] ?? 0), 0) / n
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
