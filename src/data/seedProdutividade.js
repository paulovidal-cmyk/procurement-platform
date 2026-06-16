/**
 * Seed da tela Produtividade — base real de apoio (5.913 linhas).
 *
 * O CSV é importado como texto via `?raw` (Vite) e parseado uma única vez no
 * carregamento do módulo, produzindo linhas CRUAS (objetos com chaves = nomes
 * de coluna da planilha). A normalização (datas, spend) acontece na leitura,
 * em normalizeRows() — ver algorithms/produtividade.js.
 *
 * Base nova (2026-06-12): 20.241 linhas, 21 compradores, coluna "Escopo de Compras".
 * Headcount = MÉDIA mensal de ativos (pondera entradas/saídas). Números FY:
 *   2024 → 10.042 pedidos / hc 14,1 / 713,0 ped·comp / R$ 6,35 bi
 *   2025 →  7.722 pedidos / hc 12,9 / 597,8 ped·comp / R$ 2,18 bi
 *   2026 →  2.326 pedidos / hc 13,3 / 175,6 ped·comp / R$ 0,45 bi (corte YTD 26/05)
 */
import Papa from 'papaparse'
import csvText from './produtividadeBase.csv?raw'

const parsed = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
  transformHeader: h => h.trim(),
})

export const SEED_PRODUTIVIDADE = parsed.data
