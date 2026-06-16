import { describe, it, expect } from 'vitest'
import {
  parseDate, cleanSpend, normalizeRow, normalizeRows,
  deriveCompradores, isActive, activeHeadcount, avgMonthlyHeadcount,
  distinctPedidos, sumSpend, getYtdCutoff, periodWindow,
  computeYearKPIs, computeMonthlySeries, matchRow, matchComprador,
} from './produtividade.js'

const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d))

describe('parseDate', () => {
  it('parseia dd/mm/aaaa com dia primeiro', () => {
    expect(parseDate('05/03/2024')).toEqual(D(2024, 3, 5))
  })
  it('aceita dia/mês com 1 dígito', () => {
    expect(parseDate('5/3/2024')).toEqual(D(2024, 3, 5))
  })
  it('aceita ano com 2 dígitos', () => {
    expect(parseDate('5/3/24')).toEqual(D(2024, 3, 5))
  })
  it('retorna null para vazio/inválido', () => {
    expect(parseDate('')).toBeNull()
    expect(parseDate(null)).toBeNull()
    expect(parseDate('2024-03-05')).toBeNull()
    expect(parseDate('31/02/2024')).toBeNull() // dia inexistente
    expect(parseDate('15/13/2024')).toBeNull() // mês inválido
  })
})

describe('cleanSpend', () => {
  it('remove pontos de milhar e converte para inteiro', () => {
    expect(cleanSpend('199.989.730')).toBe(199989730)
  })
  it('aceita número já limpo', () => {
    expect(cleanSpend(1500)).toBe(1500)
    expect(cleanSpend(1500.9)).toBe(1500) // sem decimais
  })
  it('limpa prefixos e espaços', () => {
    expect(cleanSpend('R$ 1.234')).toBe(1234)
  })
  it('vazio/inválido vira 0', () => {
    expect(cleanSpend('')).toBe(0)
    expect(cleanSpend(null)).toBe(0)
    expect(cleanSpend('abc')).toBe(0)
  })
})

describe('normalizeRow', () => {
  it('mapeia colunas da planilha e deriva year/month da Data', () => {
    const r = normalizeRow({
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
      'Ano': '2099', // deve ser ignorado — year vem da Data
    })
    expect(r.year).toBe(2025)
    expect(r.month).toBe(5)
    expect(r.pedido).toBe('PO-1')
    expect(r.spend).toBe(1234567)
    expect(r.comprador).toBe('Ana Lima')
    expect(r.admissao).toEqual(D(2020, 1, 1))
    expect(r.saida).toBeNull()
  })
})

describe('distinctPedidos', () => {
  it('conta pedidos distintos, nunca linhas', () => {
    const rows = [
      { pedido: 'PO-1' }, { pedido: 'PO-1' }, // mesmo pedido, 2 itens
      { pedido: 'PO-2' }, { pedido: '' },
    ]
    expect(distinctPedidos(rows)).toBe(2)
    expect(rows.length).toBe(4) // confirma que linhas ≠ pedidos
  })
})

describe('sumSpend', () => {
  it('soma o spend de todas as linhas do recorte', () => {
    expect(sumSpend([{ spend: 100 }, { spend: 200 }, { spend: 0 }])).toBe(300)
  })
})

describe('isActive / activeHeadcount (admissão e saída)', () => {
  const start = D(2025, 1, 1)
  const end = D(2025, 12, 31)
  it('ativo: admitido antes do fim e sem saída', () => {
    expect(isActive({ admissao: D(2024, 6, 1), saida: null }, start, end)).toBe(true)
  })
  it('inativo: admitido depois do fim do período', () => {
    expect(isActive({ admissao: D(2026, 1, 1), saida: null }, start, end)).toBe(false)
  })
  it('inativo: saída antes do início do período', () => {
    expect(isActive({ admissao: D(2020, 1, 1), saida: D(2024, 12, 31) }, start, end)).toBe(false)
  })
  it('ativo: saída dentro do período', () => {
    expect(isActive({ admissao: D(2020, 1, 1), saida: D(2025, 6, 30) }, start, end)).toBe(true)
  })
  it('inativo: sem admissão', () => {
    expect(isActive({ admissao: null, saida: null }, start, end)).toBe(false)
  })
  it('headcount conta só os ativos no período', () => {
    const comps = [
      { admissao: D(2024, 1, 1), saida: null },        // ativo
      { admissao: D(2026, 1, 1), saida: null },        // admitido depois → fora
      { admissao: D(2020, 1, 1), saida: D(2024, 5, 1) }, // saiu antes → fora
      { admissao: D(2020, 1, 1), saida: D(2025, 3, 1) }, // saiu no período → conta
    ]
    expect(activeHeadcount(comps, start, end)).toBe(2)
  })
})

describe('avgMonthlyHeadcount (média mensal ponderada por entradas/saídas)', () => {
  it('full year: ativo o ano todo = 1; quem entra em out pesa 3/12', () => {
    const comps = [
      { admissao: D(2024, 1, 1), saida: null },   // ativo Jan..Dez → 12 meses
      { admissao: D(2024, 10, 1), saida: null },  // ativo Out..Dez → 3 meses
    ]
    // (12 + 3) / 12 = 1.25
    expect(avgMonthlyHeadcount(comps, 2024, 'fy', null)).toBeCloseTo(1.25, 5)
  })
  it('quando todos estão ativos o ano inteiro, média = contagem simples', () => {
    const comps = [
      { admissao: D(2020, 1, 1), saida: null },
      { admissao: D(2019, 6, 1), saida: null },
    ]
    expect(avgMonthlyHeadcount(comps, 2025, 'fy', null)).toBe(2)
  })
  it('YTD divide pelos meses até o corte', () => {
    const comps = [{ admissao: D(2020, 1, 1), saida: null }] // ativo sempre
    expect(avgMonthlyHeadcount(comps, 2025, 'ytd', { month: 5, day: 22 })).toBe(1)
  })
})

describe('deriveCompradores', () => {
  it('um registro por comprador com metadados consistentes', () => {
    const rows = normalizeRows([
      { 'Data': '01/02/2025', 'Pedido': 'A', 'Comprador': 'Ana', 'Spend': '10', 'data_admissao': '01/01/2020', 'data_saida': '' },
      { 'Data': '02/02/2025', 'Pedido': 'B', 'Comprador': 'Ana', 'Spend': '20', 'data_admissao': '01/01/2020', 'data_saida': '' },
      { 'Data': '01/02/2025', 'Pedido': 'C', 'Comprador': 'Bruno', 'Spend': '30', 'data_admissao': '01/06/2023', 'data_saida': '30/06/2025' },
    ])
    const comps = deriveCompradores(rows)
    expect(comps).toHaveLength(2)
    const bruno = comps.find(c => c.comprador === 'Bruno')
    expect(bruno.saida).toEqual(D(2025, 6, 30))
  })
})

describe('getYtdCutoff', () => {
  it('usa a data mais recente da base (mês/dia)', () => {
    const rows = normalizeRows([
      { 'Data': '10/01/2025', 'Pedido': 'A', 'Comprador': 'X' },
      { 'Data': '22/05/2026', 'Pedido': 'B', 'Comprador': 'X' },
      { 'Data': '01/03/2024', 'Pedido': 'C', 'Comprador': 'X' },
    ])
    expect(getYtdCutoff(rows)).toMatchObject({ month: 5, day: 22 })
  })
})

describe('periodWindow', () => {
  it('FY = 01/01 a 31/12', () => {
    expect(periodWindow(2025, 'fy')).toEqual({ start: D(2025, 1, 1), end: D(2025, 12, 31) })
  })
  it('YTD = 01/01 até o corte', () => {
    expect(periodWindow(2025, 'ytd', { month: 5, day: 22 }))
      .toEqual({ start: D(2025, 1, 1), end: D(2025, 5, 22) })
  })
})

describe('filtros — numerador vs denominador', () => {
  const rows = normalizeRows([
    { 'Data': '01/03/2025', 'Pedido': 'P1', 'Comprador': 'Ana', 'Cargo': 'COMPRADOR', 'Categoria': 'TI', 'Spend': '100', 'data_admissao': '01/01/2020' },
    { 'Data': '01/03/2025', 'Pedido': 'P2', 'Comprador': 'Bruno', 'Cargo': 'LÍDER', 'Categoria': 'Log', 'Spend': '200', 'data_admissao': '01/01/2020' },
  ])

  it('filtro de Categoria restringe só o numerador, não o headcount', () => {
    const k = computeYearKPIs(rows, deriveCompradores(rows), 2025, 'fy', null, { categoria: ['TI'] })
    expect(k.pedidos).toBe(1)       // só P1 (TI)
    expect(k.headcount).toBe(2)     // ambos compradores continuam no denominador
  })

  it('filtro de Cargo afeta numerador E denominador', () => {
    const k = computeYearKPIs(rows, deriveCompradores(rows), 2025, 'fy', null, { cargo: ['COMPRADOR'] })
    expect(k.pedidos).toBe(1)       // só Ana (COMPRADOR)
    expect(k.headcount).toBe(1)     // headcount cai para 1
  })
})

describe('computeYearKPIs', () => {
  it('pedidos/comprador e spend/comprador usam headcount ativo', () => {
    const rows = normalizeRows([
      { 'Data': '01/03/2025', 'Pedido': 'P1', 'Comprador': 'Ana', 'Spend': '100', 'data_admissao': '01/01/2020' },
      { 'Data': '02/03/2025', 'Pedido': 'P1', 'Comprador': 'Ana', 'Spend': '50', 'data_admissao': '01/01/2020' }, // mesmo pedido
      { 'Data': '03/03/2025', 'Pedido': 'P2', 'Comprador': 'Bruno', 'Spend': '300', 'data_admissao': '01/01/2020' },
    ])
    const k = computeYearKPIs(rows, deriveCompradores(rows), 2025, 'fy', null, {})
    expect(k.pedidos).toBe(2)               // P1, P2 (distintos)
    expect(k.spendTotal).toBe(450)          // soma de linhas
    expect(k.headcount).toBe(2)
    expect(k.pedidosPorComprador).toBe(1)   // 2 / 2
    expect(k.spendPorComprador).toBe(225)   // 450 / 2
  })

  it('headcount zero não quebra (divisão protegida)', () => {
    const rows = normalizeRows([
      { 'Data': '01/03/2025', 'Pedido': 'P1', 'Comprador': 'Ana', 'Spend': '100', 'data_admissao': '01/01/2099' },
    ])
    const k = computeYearKPIs(rows, deriveCompradores(rows), 2025, 'fy', null, {})
    expect(k.headcount).toBe(0)
    expect(k.pedidosPorComprador).toBe(0)
  })
})

describe('computeMonthlySeries', () => {
  it('YTD limita meses até o mês do corte', () => {
    const rows = normalizeRows([
      { 'Data': '15/02/2025', 'Pedido': 'P1', 'Comprador': 'Ana', 'Spend': '100', 'data_admissao': '01/01/2020' },
    ])
    const series = computeMonthlySeries(rows, deriveCompradores(rows), 'ytd', { month: 5, day: 22 }, {}, [2025])
    expect(series).toHaveLength(5) // Jan..Mai
    expect(series[1][2025].pedidos).toBe(1) // Fev tem P1
  })
})
