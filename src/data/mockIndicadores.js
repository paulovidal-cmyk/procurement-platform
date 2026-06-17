/**
 * Base de indicadores econômicos do Raio-X de Preços.
 *
 * Fonte: `baseIndicadores.csv` (colunas Data, Indicador, Valor — decimal vírgula),
 * importada como texto via `?raw` (Vite) e transformada uma única vez no load.
 *
 * O engine (algorithms/raiox.js) trabalha com **% mensal** por indicador, um valor
 * por mês (faz `(1 + valor/100)`). Por isso:
 *  - IPCA, IGP-M, INPC: já são % mensal — apenas deduplicamos para 1 valor/mês.
 *  - USD/BRL: vem como cotação DIÁRIA. Convertemos para variação % mês-a-mês da
 *    cotação de fim de mês (mesma modelagem do antigo "Dólar").
 *
 * Cobertura atual: jan/2025 → mai/2026 (USD/BRL até jun/2026).
 * Formato de saída: { data: 'DD/MM/YYYY', indicador: string, valor: number }
 */
import Papa from 'papaparse'
import csvText from './baseIndicadores.csv?raw'

// Indicadores tratados como % mensal direto (uma entrada por mês).
const MONTHLY_PCT = ['IPCA', 'IGP-M', 'INPC']
// Indicador de cotação diária → convertido para variação % mensal.
const RATE_DAILY = 'USD/BRL'

const parsed = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim(),
})

/** 'DD/MM/YYYY' → { y, m, d, t } (t = timestamp para ordenação). */
function parseBr(dateStr) {
  const [d, m, y] = String(dateStr).trim().split('/').map(Number)
  return { y, m, d, t: new Date(y, m - 1, d).getTime() }
}
const monthKey = (p) => `${p.y}-${String(p.m).padStart(2, '0')}`
const num = (v) => parseFloat(String(v).replace(/\./g, '').replace(',', '.')) // tira milhar, vírgula→ponto

// Linhas cruas tipadas
const raw = parsed.data
  .map(r => ({ ind: (r.Indicador || '').trim(), p: parseBr(r.Data), valor: num(r.Valor) }))
  .filter(r => r.ind && r.p.y && !Number.isNaN(r.valor))

const out = []

// ── % mensal (IPCA, IGP-M, INPC): dedup por mês, mantém a entrada mais recente ──
for (const ind of MONTHLY_PCT) {
  const byMonth = new Map() // 'YYYY-MM' → { p, valor }
  for (const r of raw) {
    if (r.ind !== ind) continue
    const k = monthKey(r.p)
    const cur = byMonth.get(k)
    if (!cur || r.p.t >= cur.p.t) byMonth.set(k, r)
  }
  for (const { p, valor } of byMonth.values()) {
    out.push({ data: `01/${String(p.m).padStart(2, '0')}/${p.y}`, indicador: ind, valor })
  }
}

// ── USD/BRL: cotação de fim de mês → variação % mês-a-mês ──
{
  const eom = new Map() // 'YYYY-MM' → { p, valor } (maior dia do mês)
  for (const r of raw) {
    if (r.ind !== RATE_DAILY) continue
    const k = monthKey(r.p)
    const cur = eom.get(k)
    if (!cur || r.p.t > cur.p.t) eom.set(k, r)
  }
  const months = [...eom.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  for (let i = 1; i < months.length; i++) {
    const [, prev] = months[i - 1]
    const [, cur]  = months[i]
    const variacao = prev.valor ? (cur.valor / prev.valor - 1) * 100 : 0
    out.push({
      data: `01/${String(cur.p.m).padStart(2, '0')}/${cur.p.y}`,
      indicador: RATE_DAILY,
      valor: Math.round(variacao * 100) / 100, // 2 casas
    })
  }
}

export const MOCK_INDICADORES = out

// Ordem dos indicadores nos dropdowns
export const INDICADOR_LABELS = ['IPCA', 'IGP-M', 'INPC', 'USD/BRL']
