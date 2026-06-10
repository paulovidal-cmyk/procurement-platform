/**
 * Seed da tela Produtividade — base real de apoio (5.913 linhas).
 *
 * O CSV é importado como texto via `?raw` (Vite) e parseado uma única vez no
 * carregamento do módulo, produzindo linhas CRUAS (objetos com chaves = nomes
 * de coluna da planilha). A normalização (datas, spend) acontece na leitura,
 * em normalizeRows() — ver algorithms/produtividade.js.
 *
 * Paridade conferida contra os números do protótipo:
 *   2024 FY → 3.029 pedidos / R$ 2,97 bi
 *   2025 FY → 2.125 pedidos / R$ 1,57 bi
 *   2026 YTD (corte 22/05) → 647 pedidos / R$ 350 mi
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
