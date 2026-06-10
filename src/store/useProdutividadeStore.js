import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PRODUTIVIDADE } from '../data/seedProdutividade.js'

/**
 * Store da tela Produtividade.
 *
 * `rows` guarda as linhas CRUAS (objetos com chaves = nomes de coluna da
 * planilha, valores string). A normalização (parse de datas, limpeza de spend)
 * acontece na leitura, via normalizeRows() — assim a persistência em
 * localStorage permanece JSON puro (Date não serializa).
 *
 * Versionamento client-side: ao substituir a base, o snapshot anterior é
 * guardado em `previous` (com metadados), permitindo rollback. Não há backend —
 * o gating de admin é client-side (espelha o padrão do Supplier Risk Shield).
 */
const useProdutividadeStore = create(
  persist(
    (set, get) => ({
      rows: SEED_PRODUTIVIDADE,
      hasCustomData: false,
      // meta da base vigente: { uploadedAt, uploadedBy, rowCount, pedidos, compradores, dateRange }
      meta: null,
      // snapshot anterior p/ rollback: { rows, meta, hasCustomData }
      previous: null,

      /** Substitui a base vigente, versionando a anterior. */
      importRows: (rows, meta) => {
        const state = get()
        set({
          previous: { rows: state.rows, meta: state.meta, hasCustomData: state.hasCustomData },
          rows,
          meta: { ...meta, uploadedAt: new Date().toISOString() },
          hasCustomData: true,
        })
      },

      /** Reverte para o snapshot anterior (se houver). */
      rollback: () => {
        const { previous } = get()
        if (!previous) return false
        set({
          rows: previous.rows,
          meta: previous.meta,
          hasCustomData: previous.hasCustomData,
          previous: null,
        })
        return true
      },

      /** Restaura o seed de demonstração. */
      resetToSeed: () => set({
        previous: { rows: get().rows, meta: get().meta, hasCustomData: get().hasCustomData },
        rows: SEED_PRODUTIVIDADE,
        meta: null,
        hasCustomData: false,
      }),
    }),
    {
      name: 'produtividade-store-v1',
      // Não persiste o seed grande (5.913 linhas) no localStorage: só guarda
      // `rows` quando o admin importou uma base custom. Sem custom data, o seed
      // é re-parseado do CSV embutido a cada carga.
      partialize: s => ({
        hasCustomData: s.hasCustomData,
        meta: s.meta,
        previous: s.previous,
        ...(s.hasCustomData ? { rows: s.rows } : {}),
      }),
    }
  )
)

export default useProdutividadeStore
