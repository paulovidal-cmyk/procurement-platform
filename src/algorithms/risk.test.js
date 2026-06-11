import { describe, it, expect } from 'vitest'
import { calcGlobalRadar } from './risk.js'

describe('calcGlobalRadar — média ponderada pelo spend', () => {
  it('pondera a nota pelo spend (maior spend pesa mais)', () => {
    const suppliers = [
      { spend: 900, nota_geral: 90, nota_financeira: 90, nota_inteligencia: 90, nota_risco: 90 },
      { spend: 100, nota_geral: 10, nota_financeira: 10, nota_inteligencia: 10, nota_risco: 10 },
    ]
    const r = calcGlobalRadar(suppliers)
    // (90*900 + 10*100) / 1000 = 82, não 50 (média simples)
    expect(r.geral).toBeCloseTo(82, 5)
    expect(r.financeiro).toBeCloseTo(82, 5)
  })

  it('cai para média simples quando o spend total é zero', () => {
    const suppliers = [
      { spend: 0, nota_geral: 80, nota_financeira: 80, nota_inteligencia: 80, nota_risco: 80 },
      { spend: 0, nota_geral: 40, nota_financeira: 40, nota_inteligencia: 40, nota_risco: 40 },
    ]
    const r = calcGlobalRadar(suppliers)
    expect(r.geral).toBeCloseTo(60, 5) // (80+40)/2
  })

  it('lista vazia retorna zeros', () => {
    expect(calcGlobalRadar([])).toEqual({ financeiro: 0, inteligencia: 0, risco: 0, geral: 0 })
  })

  it('reflete o subconjunto filtrado (entra só o que é passado)', () => {
    const all = [
      { spend: 100, nota_geral: 100, nota_financeira: 100, nota_inteligencia: 100, nota_risco: 100 },
      { spend: 100, nota_geral: 0,   nota_financeira: 0,   nota_inteligencia: 0,   nota_risco: 0 },
    ]
    // simula filtro que deixa só o primeiro
    expect(calcGlobalRadar([all[0]]).geral).toBeCloseTo(100, 5)
  })
})
