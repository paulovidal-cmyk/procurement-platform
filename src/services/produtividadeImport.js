/**
 * Validação e preparação de planilha para a base de Produtividade.
 *
 * Não há backend — esta é a camada de validação client-side, executada antes de
 * gravar no store (useProdutividadeStore). Funções puras, testáveis.
 *
 * O passo arquivo → linhas (PapaParse p/ CSV, SheetJS p/ XLSX) vive no
 * componente de upload; aqui recebemos as linhas já lidas (array de objetos
 * com chaves = nomes de coluna da planilha).
 */
import { COLUMN_MAP, normalizeRows, deriveCompradores, distinctPedidos } from '../algorithms/produtividade.js'

/** Colunas exatas exigidas no arquivo (as que alimentam os cálculos). */
export const REQUIRED_COLS = [
  'Data', 'Pedido', 'Contrato/Spot', 'Tipo de Pedido',
  'Fornecedor', 'Categoria', 'Subcategoria', 'Spend',
  'Comprador', 'Cargo', 'data_admissao',
]
/** Colunas opcionais reconhecidas (não bloqueiam o upload se ausentes). */
export const OPTIONAL_COLS = ['Escopo de Compras', 'Filtro Logística', 'Tipo de Negociação', 'data_saida']

// 'comprador' e 'nome comprador' são a coluna de nome cru (varia entre versões da
// planilha); 'Comprador' (chave) é a usada nos cálculos. 'Ano' é derivado da Data.
const KNOWN_COLS = new Set([...Object.keys(COLUMN_MAP), 'Ano', 'comprador', 'nome comprador'])

/** Gating de role — client-side. Só admin pode atualizar a base. */
export function canManageProdutividade(user) {
  return user?.role === 'admin'
}

/** Confere presença/nomes das colunas. Retorna { ok, missing, unexpected }. */
export function validateColumns(headers) {
  const present = new Set(headers.map(h => String(h).trim()))
  const missing = REQUIRED_COLS.filter(c => !present.has(c))
  const unexpected = headers
    .map(h => String(h).trim())
    .filter(h => h && !KNOWN_COLS.has(h))
  return { ok: missing.length === 0, missing, unexpected }
}

/**
 * Valida e normaliza linhas cruas. Lança Error com mensagem clara em caso de
 * problema estrutural. Retorna { rows, normalized, summary, unexpected }.
 */
export function validateAndSummarize(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('Arquivo vazio ou sem linhas de dados reconheciveis.')
  }

  const headers = Object.keys(rawRows[0] ?? {})
  const { ok, missing, unexpected } = validateColumns(headers)
  if (!ok) {
    throw new Error(
      `Colunas obrigatorias ausentes: ${missing.join(', ')}.\n` +
      `O arquivo deve conter exatamente as colunas definidas no modelo.`
    )
  }

  // mantem so as linhas cruas com Pedido e Comprador preenchidos
  const hasField = (r, sheetCol) => String(r[sheetCol] ?? '').trim() !== ''
  const rows = rawRows.filter(r => hasField(r, 'Pedido') && hasField(r, 'Comprador'))

  const normalized = normalizeRows(rows)
  if (normalized.length === 0) {
    throw new Error('Nenhuma linha valida encontrada (verifique Data, Pedido e Comprador).')
  }

  // linhas com Data preenchida mas em formato invalido (nao entram no periodo)
  const dataInvalidas = rows.filter(r => hasField(r, 'Data')).length - normalized.filter(n => n.data).length

  const summary = buildSummary(normalized)
  if (dataInvalidas > 0) {
    summary.warnings = [`${dataInvalidas} linha(s) com data em formato inesperado serao desconsideradas no calculo de periodo.`]
  }

  return { rows, normalized, summary, unexpected }
}

/** Resumo/preview para confirmacao do admin. */
export function buildSummary(normalized) {
  const pedidos = distinctPedidos(normalized)
  const compradores = deriveCompradores(normalized).length
  let min = null, max = null
  for (const r of normalized) {
    if (!r.data) continue
    if (!min || r.data.getTime() < min.getTime()) min = r.data
    if (!max || r.data.getTime() > max.getTime()) max = r.data
  }
  const fmt = (d) => d
    ? `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    : '—'
  return {
    rowCount: normalized.length,
    pedidos,
    compradores,
    dateRange: { min: fmt(min), max: fmt(max) },
  }
}
