import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_INDICADORES } from '../data/mockIndicadores.js'

let _id = 0
const uid = () => 'rx-' + Date.now().toString(36) + (++_id).toString(36)
const lid = () => 'rl-' + Date.now().toString(36) + (++_id).toString(36)

export const EMPTY_LINHA = () => ({
  id:           lid(),
  indicador:    'IPCA',
  peso:         '',
  tipoVariacao: 'ponta_a_ponta',
  dataInicial:  '2024-01',
  dataFinal:    '2024-12',
  override:     '',
})

export const EMPTY_PACOTE = () => ({
  subcategoria:      '',
  fornecedor:        '',
  linhas:            [EMPTY_LINHA()],
  margem:            '',
  precoFornecedor:   '',
})

const SEED_PACOTES = [
  {
    id: 'pkg-demo-1',
    subcategoria: 'Embalagens Plásticas',
    fornecedor:   'PackBrasil Ltda',
    linhas: [
      { id: 'l1', indicador: 'IPCA',    peso: 40, tipoVariacao: 'ponta_a_ponta', dataInicial: '2024-01', dataFinal: '2024-12', override: '' },
      { id: 'l2', indicador: 'IGP-M',   peso: 35, tipoVariacao: 'ponta_a_ponta', dataInicial: '2024-01', dataFinal: '2024-12', override: '' },
      { id: 'l3', indicador: 'Dólar',   peso: 25, tipoVariacao: 'media_movel',   dataInicial: '2024-01', dataFinal: '2024-12', override: '' },
    ],
    margem: -5,
    precoFornecedor: 12,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'pkg-demo-2',
    subcategoria: 'Serviços de TI',
    fornecedor:   'TechSupply Ltda',
    linhas: [
      { id: 'l4', indicador: 'IPCA',  peso: 60, tipoVariacao: 'media_movel',   dataInicial: '2024-01', dataFinal: '2024-12', override: '' },
      { id: 'l5', indicador: 'SELIC', peso: 40, tipoVariacao: 'ponta_a_ponta', dataInicial: '2024-01', dataFinal: '2024-12', override: '' },
    ],
    margem: 0,
    precoFornecedor: 8,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'pkg-demo-3',
    subcategoria: 'Matéria-Prima',
    fornecedor:   'RawMat Brasil',
    linhas: [
      { id: 'l6', indicador: 'IGP-M',  peso: 50, tipoVariacao: 'ponta_a_ponta', dataInicial: '2023-01', dataFinal: '2023-12', override: '' },
      { id: 'l7', indicador: 'Dólar',  peso: 30, tipoVariacao: 'ponta_a_ponta', dataInicial: '2023-01', dataFinal: '2023-12', override: '' },
      { id: 'l8', indicador: 'INPC',   peso: 20, tipoVariacao: 'media_movel',   dataInicial: '2023-01', dataFinal: '2023-12', override: '' },
    ],
    margem: -8,
    precoFornecedor: -2,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
]

const useRaioXStore = create(
  persist(
    (set, get) => ({
      indicadoresData: MOCK_INDICADORES,
      pacotes: SEED_PACOTES,

      savePacote: (pacote) => {
        const { pacotes } = get()
        const existing = pacotes.find(p => p.id === pacote.id)
        if (existing) {
          set({ pacotes: pacotes.map(p => p.id === pacote.id ? { ...pacote, updatedAt: new Date().toISOString() } : p) })
        } else {
          set({ pacotes: [{ ...pacote, id: uid(), createdAt: new Date().toISOString() }, ...pacotes] })
        }
      },

      deletePacote: (id) =>
        set(s => ({ pacotes: s.pacotes.filter(p => p.id !== id) })),

      updateIndicadoresData: (data) =>
        set({ indicadoresData: data }),
    }),
    {
      name: 'raiox-store-v1',
      partialize: s => ({ pacotes: s.pacotes }),
    }
  )
)

export default useRaioXStore
