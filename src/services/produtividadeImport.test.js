import { describe, it, expect } from 'vitest'
import {
  canManageProdutividade, validateColumns, validateAndSummarize, REQUIRED_COLS,
} from './produtividadeImport.js'

function fullRow(over = {}) {
  return {
    'Data': '12/05/2025',
    'Pedido': 'PO-1',
    'Filtro Logística': 'Logística',
    'Contrato/Spot': 'Spot',
    'Tipo de Negociação': 'RFQ',
    'Tipo de Pedido': 'STANDARD',
    'Fornecedor': 'ACME',
    'Categoria': 'TI',
    'Subcategoria': 'Cloud',
    'Spend': '1.234.567',
    'Comprador': 'Ana Lima',
    'Cargo': 'COMPRADOR',
    'data_admissao': '01/01/2020',
    'data_saida': '',
    ...over,
  }
}

describe('canManageProdutividade (gating de role)', () => {
  it('só admin pode gerenciar a base', () => {
    expect(canManageProdutividade({ role: 'admin' })).toBe(true)
  })
  it('demais perfis são rejeitados', () => {
    expect(canManageProdutividade({ role: 'comprador' })).toBe(false)
    expect(canManageProdutividade({ role: 'coordenador' })).toBe(false)
    expect(canManageProdutividade({ role: 'gestor' })).toBe(false)
    expect(canManageProdutividade({ role: 'diretor' })).toBe(false)
    expect(canManageProdutividade(null)).toBe(false)
    expect(canManageProdutividade(undefined)).toBe(false)
  })
})

describe('validateColumns', () => {
  it('aceita quando todas as obrigatórias estão presentes', () => {
    const r = validateColumns(REQUIRED_COLS)
    expect(r.ok).toBe(true)
    expect(r.missing).toEqual([])
  })
  it('reporta colunas obrigatórias ausentes', () => {
    const r = validateColumns(['Data', 'Pedido'])
    expect(r.ok).toBe(false)
    expect(r.missing).toContain('Spend')
    expect(r.missing).toContain('Comprador')
  })
  it('reporta colunas inesperadas (não bloqueia, mas avisa)', () => {
    const r = validateColumns([...REQUIRED_COLS, 'ColunaEstranha'])
    expect(r.ok).toBe(true)
    expect(r.unexpected).toContain('ColunaEstranha')
  })
})

describe('validateAndSummarize', () => {
  it('lança erro para arquivo vazio', () => {
    expect(() => validateAndSummarize([])).toThrow(/vazio/i)
  })

  it('lança erro listando colunas ausentes', () => {
    expect(() => validateAndSummarize([{ 'Data': '01/01/2025', 'Pedido': 'X' }]))
      .toThrow(/obrigatorias ausentes/i)
  })

  it('valida, normaliza e gera resumo correto', () => {
    const rows = [
      fullRow({ 'Pedido': 'PO-1', 'Spend': '100', 'Data': '01/01/2025' }),
      fullRow({ 'Pedido': 'PO-1', 'Spend': '50', 'Data': '02/01/2025' }), // mesmo pedido
      fullRow({ 'Pedido': 'PO-2', 'Comprador': 'Bruno', 'Spend': '300', 'Data': '22/05/2025' }),
    ]
    const { summary, normalized } = validateAndSummarize(rows)
    expect(normalized).toHaveLength(3)
    expect(summary.pedidos).toBe(2)        // PO-1, PO-2 (distintos)
    expect(summary.compradores).toBe(2)    // Ana, Bruno
    expect(summary.dateRange.min).toBe('01/01/2025')
    expect(summary.dateRange.max).toBe('22/05/2025')
  })

  it('descarta linhas sem Pedido ou Comprador', () => {
    const rows = [
      fullRow({ 'Pedido': 'PO-1' }),
      fullRow({ 'Pedido': '', 'Comprador': 'Ninguém' }), // sem pedido → fora
    ]
    const { normalized } = validateAndSummarize(rows)
    expect(normalized).toHaveLength(1)
  })

  it('avisa sobre datas em formato inválido', () => {
    const rows = [
      fullRow({ 'Pedido': 'PO-1', 'Data': '01/01/2025' }),
      fullRow({ 'Pedido': 'PO-2', 'Data': '2025-01-01' }), // formato errado
    ]
    const { summary } = validateAndSummarize(rows)
    expect(summary.warnings?.[0]).toMatch(/data em formato inesperado/i)
  })
})
