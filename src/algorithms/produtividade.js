/**
 * Motor de cálculo da tela "Produtividade" (Analytics).
 *
 * Regras críticas (replicadas do spec, parte 3):
 *  - Pedidos = contagem DISTINTA do campo `pedido` (nunca linhas).
 *  - Spend   = soma de `spend` de todas as linhas do recorte.
 *  - Headcount ativo no período [início, fim]: admissao <= fim E (saida vazia OU saida >= início).
 *  - Pedidos/comprador  = pedidos distintos ÷ headcount ativo.
 *  - Spend/comprador    = spend total      ÷ headcount ativo.
 *  - Filtros de Comprador e Cargo afetam TAMBÉM o denominador (headcount).
 *    Os demais filtros restringem apenas o numerador (pedidos e spend).
 *
 * Funções puras e sem dependências de UI — testadas em produtividade.test.js.
 */

export const YEARS = [2024, 2025, 2026]

/** Colunas exatas da planilha → campo interno. */
export const COLUMN_MAP = {
  'Data': 'data',
  'Escopo de Compras': 'escopoCompras',
  'Pedido': 'pedido',
  'Filtro Logística': 'filtroLog',
  'Contrato/Spot': 'contratoSpot',
  'Tipo de Negociação': 'tipoNeg',
  'Tipo de Pedido': 'tipoPedido',
  'Fornecedor': 'fornecedor',
  'Categoria': 'categoria',
  'Subcategoria': 'subcategoria',
  'Spend': 'spend',
  'Comprador': 'comprador',
  'Cargo': 'cargo',
  'data_admissao': 'admissao',
  'data_saida': 'saida',
}

/** Campos de filtro que restringem APENAS o numerador (pedidos/spend). */
export const NUMERATOR_FILTER_FIELDS = [
  'escopoCompras', 'filtroLog', 'contratoSpot', 'tipoNeg', 'tipoPedido',
  'fornecedor', 'categoria', 'subcategoria',
]
/** Campos de filtro que afetam numerador E denominador (headcount). */
export const HEADCOUNT_FILTER_FIELDS = ['comprador', 'cargo']
export const ALL_FILTER_FIELDS = [...NUMERATOR_FILTER_FIELDS, ...HEADCOUNT_FILTER_FIELDS]

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parseia data dd/mm/aaaa (dia primeiro; aceita dia/mês com 1 dígito).
 * Retorna um Date em UTC (meia-noite) ou null se vazio/inválido.
 */
export function parseDate(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  let [, d, mo, y] = m
  d = Number(d); mo = Number(mo); y = Number(y)
  if (y < 100) y += 2000
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const date = new Date(Date.UTC(y, mo - 1, d))
  // valida overflow (ex.: 31/02 vira 03/03)
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
  return date
}

/**
 * Limpa Spend: ponto é separador de milhar, sem decimais.
 * "199.989.730" → 199989730. Aceita número já limpo. Inválido → 0.
 */
export function cleanSpend(raw) {
  if (raw == null) return 0
  if (typeof raw === 'number') return Math.trunc(raw)
  const s = String(raw).trim().replace(/[^\d-]/g, '') // remove pontos, R$, espaços
  if (!s || s === '-') return 0
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? 0 : n
}

/**
 * Normaliza UMA linha crua (objeto com chaves = nomes de coluna da planilha)
 * para o formato interno. Datas viram Date|null; spend vira inteiro;
 * year/month derivados da Data (NÃO da coluna "Ano").
 */
export function normalizeRow(raw) {
  const get = (sheetCol) => {
    if (raw[sheetCol] != null) return raw[sheetCol]
    const internal = COLUMN_MAP[sheetCol]
    return internal != null ? raw[internal] : undefined
  }
  const str = (v) => (v == null ? '' : String(v).trim())

  const data = parseDate(get('Data'))
  return {
    data,
    year: data ? data.getUTCFullYear() : null,
    month: data ? data.getUTCMonth() + 1 : null,
    pedido: str(get('Pedido')),
    escopoCompras: str(get('Escopo de Compras')),
    filtroLog: str(get('Filtro Logística')),
    contratoSpot: str(get('Contrato/Spot')),
    tipoNeg: str(get('Tipo de Negociação')),
    tipoPedido: str(get('Tipo de Pedido')),
    fornecedor: str(get('Fornecedor')),
    categoria: str(get('Categoria')),
    subcategoria: str(get('Subcategoria')),
    spend: cleanSpend(get('Spend')),
    comprador: str(get('Comprador')),
    cargo: str(get('Cargo')),
    admissao: parseDate(get('data_admissao')),
    saida: parseDate(get('data_saida')),
  }
}

export function normalizeRows(rawRows) {
  return rawRows.map(normalizeRow).filter(r => r.pedido && r.comprador)
}

// ─── Tabela de compradores (metadados consistentes) ─────────────────────────────

/**
 * Deriva a tabela de compradores a partir das linhas.
 * Cada Comprador tem uma admissão e no máximo uma saída (consistentes na base).
 * Usa a primeira ocorrência não-nula de admissão/saída/cargo.
 */
export function deriveCompradores(rows) {
  const map = new Map()
  for (const r of rows) {
    if (!r.comprador) continue
    if (!map.has(r.comprador)) {
      map.set(r.comprador, { comprador: r.comprador, admissao: r.admissao, saida: r.saida, cargo: r.cargo })
    } else {
      const c = map.get(r.comprador)
      if (!c.admissao && r.admissao) c.admissao = r.admissao
      if (!c.saida && r.saida) c.saida = r.saida
      if (!c.cargo && r.cargo) c.cargo = r.cargo
    }
  }
  return [...map.values()]
}

/** Comprador ativo no período [start, end] (todos Date em UTC). */
export function isActive(c, start, end) {
  if (!c.admissao) return false
  if (c.admissao.getTime() > end.getTime()) return false
  if (c.saida && c.saida.getTime() < start.getTime()) return false
  return true
}

export function activeHeadcount(compradores, start, end) {
  return compradores.filter(c => isActive(c, start, end)).length
}

/**
 * Headcount MÉDIO do período: média dos headcounts ativos mês a mês.
 * Reflete entradas/saídas ao longo do ano (quem entra/sai pesa proporcionalmente
 * aos meses em que esteve ativo). FY → divide por 12; YTD → pelos meses até o corte.
 * É o denominador de pedidos/comprador e spend/comprador.
 */
export function avgMonthlyHeadcount(compradores, year, mode, cutoff) {
  const maxMonth = mode === 'ytd' && cutoff ? cutoff.month : 12
  if (maxMonth <= 0) return 0
  let sum = 0
  for (let m = 1; m <= maxMonth; m++) {
    const { start, end } = monthWindow(year, m)
    sum += activeHeadcount(compradores, start, end)
  }
  return sum / maxMonth
}

// ─── Contagem base ──────────────────────────────────────────────────────────────

export function distinctPedidos(rows) {
  const set = new Set()
  for (const r of rows) if (r.pedido) set.add(r.pedido)
  return set.size
}

export function sumSpend(rows) {
  return rows.reduce((s, r) => s + (r.spend || 0), 0)
}

// ─── Filtros ────────────────────────────────────────────────────────────────────

/** filters: { campo: string[] }. Array vazio/ausente = sem restrição (todos). */
function fieldMatches(filters, field, value) {
  const sel = filters?.[field]
  if (!sel || sel.length === 0) return true
  return sel.includes(value)
}

/** Linha passa por TODOS os filtros (usado no numerador). */
export function matchRow(row, filters) {
  return ALL_FILTER_FIELDS.every(f => fieldMatches(filters, f, row[f]))
}

/** Comprador passa pelos filtros de Comprador/Cargo (usado no denominador). */
export function matchComprador(c, filters) {
  return fieldMatches(filters, 'comprador', c.comprador) &&
         fieldMatches(filters, 'cargo', c.cargo)
}

// ─── Janelas de período ─────────────────────────────────────────────────────────

/** Data mais recente da base → corte YTD (mês/dia). Null se base vazia. */
export function getYtdCutoff(rows) {
  let max = null
  for (const r of rows) {
    if (r.data && (!max || r.data.getTime() > max.getTime())) max = r.data
  }
  if (!max) return null
  return { month: max.getUTCMonth() + 1, day: max.getUTCDate(), date: max }
}

/** Janela [start, end] (Date UTC) de um ano para o modo escolhido. */
export function periodWindow(year, mode, cutoff) {
  const start = new Date(Date.UTC(year, 0, 1))
  if (mode === 'ytd' && cutoff) {
    return { start, end: new Date(Date.UTC(year, cutoff.month - 1, cutoff.day)) }
  }
  return { start, end: new Date(Date.UTC(year, 11, 31)) }
}

/** Janela [start, end] de UM mês de um ano (mês completo). */
export function monthWindow(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0)), // dia 0 do mês seguinte = último dia
  }
}

// ─── KPIs por ano ───────────────────────────────────────────────────────────────

/**
 * KPIs de um ano no recorte atual.
 * @returns { pedidos, headcount, pedidosPorComprador, spendPorComprador, spendTotal }
 */
export function computeYearKPIs(rows, compradores, year, mode, cutoff, filters = {}) {
  const { start, end } = periodWindow(year, mode, cutoff)

  // Numerador: linhas do ano dentro da janela, passando por TODOS os filtros.
  const num = rows.filter(r =>
    r.data &&
    r.data.getTime() >= start.getTime() &&
    r.data.getTime() <= end.getTime() &&
    matchRow(r, filters)
  )

  // Denominador: compradores filtrados por Comprador/Cargo. Headcount = média
  // mensal de ativos no período (pondera entradas/saídas ao longo do ano).
  const elegiveis = compradores.filter(c => matchComprador(c, filters))
  const headcount = avgMonthlyHeadcount(elegiveis, year, mode, cutoff)

  const pedidos = distinctPedidos(num)
  const spendTotal = sumSpend(num)

  return {
    year,
    pedidos,
    headcount,
    spendTotal,
    pedidosPorComprador: headcount ? pedidos / headcount : 0,
    spendPorComprador: headcount ? spendTotal / headcount : 0,
  }
}

// ─── Série mensal ─────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/**
 * Série mensal (Jan…Dez). Headcount recalculado mês a mês.
 * No modo YTD limita aos meses até o mês do corte.
 * @returns array [{ month, label, '2024': {...}, '2025': {...}, ... }]
 */
export function computeMonthlySeries(rows, compradores, mode, cutoff, filters = {}, years = YEARS) {
  const maxMonth = mode === 'ytd' && cutoff ? cutoff.month : 12
  const elegiveis = compradores.filter(c => matchComprador(c, filters))
  const out = []
  for (let m = 1; m <= maxMonth; m++) {
    const point = { month: m, label: MONTH_LABELS[m - 1] }
    for (const year of years) {
      const { start, end } = monthWindow(year, m)
      const num = rows.filter(r =>
        r.year === year && r.month === m && matchRow(r, filters)
      )
      const headcount = activeHeadcount(elegiveis, start, end)
      const pedidos = distinctPedidos(num)
      const spendTotal = sumSpend(num)
      point[year] = {
        pedidos,
        spendTotal,
        headcount,
        pedidosPorComprador: headcount ? pedidos / headcount : 0,
        spendPorComprador: headcount ? spendTotal / headcount : 0,
      }
    }
    out.push(point)
  }
  return out
}

// ─── Abertura por comprador ─────────────────────────────────────────────────────

/**
 * Pedidos e spend por comprador por ano, marcando quem teve saída no período.
 * @returns array [{ comprador, cargo, saida, saiuNoPeriodo, byYear: { 2024:{pedidos,spend}, ... } }]
 */
export function computeByComprador(rows, compradores, mode, cutoff, filters = {}, years = YEARS) {
  const elegiveis = compradores.filter(c => matchComprador(c, filters))
  const windows = Object.fromEntries(years.map(y => [y, periodWindow(y, mode, cutoff)]))

  return elegiveis.map(c => {
    const byYear = {}
    let saiuNoPeriodo = false
    for (const year of years) {
      const { start, end } = windows[year]
      const num = rows.filter(r =>
        r.comprador === c.comprador &&
        r.data &&
        r.data.getTime() >= start.getTime() &&
        r.data.getTime() <= end.getTime() &&
        matchRow(r, filters)
      )
      byYear[year] = { pedidos: distinctPedidos(num), spend: sumSpend(num) }
      if (c.saida && c.saida.getTime() >= start.getTime() && c.saida.getTime() <= end.getTime()) {
        saiuNoPeriodo = true
      }
    }
    return { comprador: c.comprador, cargo: c.cargo, saida: c.saida, saiuNoPeriodo, byYear }
  }).sort((a, b) => {
    const ly = years[years.length - 1]
    return (b.byYear[ly]?.pedidos || 0) - (a.byYear[ly]?.pedidos || 0)
  })
}

// ─── Abertura Spot vs Contrato ─────────────────────────────────────────────────

/**
 * Pedidos/comprador e Spend/comprador separados por Contrato vs Spot, por ano.
 * O headcount usado é o do recorte (compradores elegíveis ativos na janela).
 * @returns { groups: [{ key, byYear: { 2024: {pedidos, spend, headcount, pedidosPorComprador, spendPorComprador} } }] }
 */
export function computeBySpotContrato(rows, compradores, mode, cutoff, filters = {}, years = YEARS) {
  const elegiveis = compradores.filter(c => matchComprador(c, filters))
  const keys = [...new Set(rows.map(r => r.contratoSpot).filter(Boolean))].sort()

  const groups = keys.map(key => {
    const byYear = {}
    for (const year of years) {
      const { start, end } = periodWindow(year, mode, cutoff)
      const num = rows.filter(r =>
        r.contratoSpot === key &&
        r.data &&
        r.data.getTime() >= start.getTime() &&
        r.data.getTime() <= end.getTime() &&
        matchRow(r, filters)
      )
      const headcount = avgMonthlyHeadcount(elegiveis, year, mode, cutoff)
      const pedidos = distinctPedidos(num)
      const spendTotal = sumSpend(num)
      byYear[year] = {
        pedidos, spendTotal, headcount,
        pedidosPorComprador: headcount ? pedidos / headcount : 0,
        spendPorComprador: headcount ? spendTotal / headcount : 0,
      }
    }
    return { key, byYear }
  })
  return { groups }
}

// ─── Abertura por Escopo de Compras ─────────────────────────────────────────────

/**
 * Pedidos e pedidos/comprador por Escopo de Compras (dentro/fora), por ano.
 * Headcount (denominador) é o do ano — o mesmo para todos os escopos. As chaves
 * vêm dos valores presentes após os filtros ativos. Usado no gráfico empilhado.
 * @returns { keys: string[], byYear: { [year]: { [escopo]: { pedidos, pedidosPorComprador } } } }
 */
export function computeByEscopo(rows, compradores, mode, cutoff, filters = {}, years = YEARS) {
  const elegiveis = compradores.filter(c => matchComprador(c, filters))
  const keys = [...new Set(rows.filter(r => matchRow(r, filters)).map(r => r.escopoCompras).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }))

  const byYear = {}
  for (const year of years) {
    const { start, end } = periodWindow(year, mode, cutoff)
    const headcount = avgMonthlyHeadcount(elegiveis, year, mode, cutoff)
    byYear[year] = {}
    for (const key of keys) {
      const num = rows.filter(r =>
        r.escopoCompras === key &&
        r.data &&
        r.data.getTime() >= start.getTime() &&
        r.data.getTime() <= end.getTime() &&
        matchRow(r, filters)
      )
      const pedidos = distinctPedidos(num)
      byYear[year][key] = { pedidos, pedidosPorComprador: headcount ? pedidos / headcount : 0 }
    }
  }
  return { keys, byYear }
}

// ─── Opções de filtro ──────────────────────────────────────────────────────────

/** Valores distintos por campo, para popular os dropdowns. */
export function buildFilterOptions(rows) {
  const opts = {}
  for (const f of ALL_FILTER_FIELDS) {
    opts[f] = [...new Set(rows.map(r => r[f]).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }))
  }
  return opts
}

// ─── Análise automática (bullets determinísticos) ───────────────────────────────

function fmtBRL(v) {
  const abs = Math.abs(v)
  if (abs >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi`
  if (abs >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (abs >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}
function fmtNum(v, dec = 0) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function pctChange(curr, prev) {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

/**
 * Gera bullets determinísticos a partir do resumo da visão atual.
 * NÃO usa LLM — são regras sobre os dados.
 */
export function buildAnalysis({ perYear, byComprador, spotContrato, years = YEARS, mode }) {
  const bullets = []
  const present = years.filter(y => perYear[y] && perYear[y].headcount > 0)
  if (present.length < 1) {
    return ['Sem dados suficientes no recorte atual para gerar a leitura automática.']
  }
  const last = present[present.length - 1]
  const prev = present.length >= 2 ? present[present.length - 2] : null

  // 1. Variação de produtividade ano a ano (pedidos/comprador)
  if (prev) {
    const c = perYear[last].pedidosPorComprador
    const p = perYear[prev].pedidosPorComprador
    const ch = pctChange(c, p)
    if (ch != null) {
      const dir = ch >= 0 ? 'alta' : 'queda'
      bullets.push(
        `Produtividade ${dir} de ${fmtNum(Math.abs(ch), 1)}% em pedidos/comprador de ${prev} (${fmtNum(p, 1)}) para ${last} (${fmtNum(c, 1)}).`
      )
    }
  }

  // 2. Efeito de mudança de headcount
  if (prev) {
    const hc = perYear[last].headcount
    const hp = perYear[prev].headcount
    if (Math.abs(hc - hp) >= 0.05) {
      const diff = hc - hp
      const dir = diff > 0 ? 'aumento' : 'redução'
      bullets.push(
        `Headcount médio teve ${dir} de ${fmtNum(Math.abs(diff), 1)} comprador(es) (${fmtNum(hp, 1)} → ${fmtNum(hc, 1)}), o que ${diff > 0 ? 'dilui' : 'concentra'} o indicador por comprador.`
      )
    } else {
      bullets.push(`Headcount médio estável (${fmtNum(hc, 1)} compradores) entre ${prev} e ${last} — variação reflete volume, não time.`)
    }
  }

  // 3. Volume de pedidos ano a ano (esforço total)
  if (prev) {
    const volCh = pctChange(perYear[last].pedidos, perYear[prev].pedidos)
    if (volCh != null) {
      bullets.push(
        `Volume de pedidos ${volCh >= 0 ? 'subiu' : 'caiu'} ${fmtNum(Math.abs(volCh), 1)}% de ${prev} (${fmtNum(perYear[prev].pedidos)}) para ${last} (${fmtNum(perYear[last].pedidos)} pedidos distintos).`
      )
    }
  }

  // 4. Concentração no maior emissor e dependência dos 2 maiores
  if (byComprador?.length) {
    const ranked = [...byComprador].sort((a, b) => (b.byYear[last]?.pedidos || 0) - (a.byYear[last]?.pedidos || 0))
    const totalPed = perYear[last].pedidos || ranked.reduce((s, c) => s + (c.byYear[last]?.pedidos || 0), 0)
    if (totalPed > 0 && ranked[0]) {
      const top1 = ranked[0]
      const share1 = ((top1.byYear[last]?.pedidos || 0) / totalPed) * 100
      bullets.push(`Maior emissor em ${last}: ${top1.comprador} concentra ${fmtNum(share1, 1)}% dos pedidos.`)
      if (ranked[1]) {
        const share2 = (((ranked[0].byYear[last]?.pedidos || 0) + (ranked[1].byYear[last]?.pedidos || 0)) / totalPed) * 100
        if (share2 >= 50) {
          bullets.push(`⚠ Risco de dependência: os 2 maiores (${ranked[0].comprador} e ${ranked[1].comprador}) somam ${fmtNum(share2, 1)}% dos pedidos.`)
        }
      }
    }
  }

  // 5. Distribuição Spot vs Contrato
  if (spotContrato?.groups?.length) {
    const parts = spotContrato.groups.map(g => {
      const ped = g.byYear[last]?.pedidos || 0
      return { key: g.key, ped }
    })
    const tot = parts.reduce((s, p) => s + p.ped, 0)
    if (tot > 0) {
      const desc = parts.map(p => `${p.key} ${fmtNum((p.ped / tot) * 100, 0)}%`).join(' vs ')
      bullets.push(`Distribuição ${last}: ${desc} dos pedidos.`)
    }
  }

  // 6. Alerta de transições/saídas no período
  if (byComprador?.length) {
    const saidas = byComprador.filter(c => c.saiuNoPeriodo)
    if (saidas.length) {
      bullets.push(
        `⚠ ${saidas.length} comprador(es) com saída no período (${saidas.map(s => s.comprador).join(', ')}) — atenção ao impacto no headcount e na continuidade.`
      )
    }
  }

  return bullets
}

// ─── Orquestrador ───────────────────────────────────────────────────────────────

/**
 * Calcula tudo o que a tela consome a partir das linhas normalizadas.
 */
export function computeDashboard(rows, { mode = 'fy', filters = {}, years = YEARS } = {}) {
  const compradores = deriveCompradores(rows)
  const cutoff = getYtdCutoff(rows)

  const perYear = {}
  for (const y of years) {
    perYear[y] = computeYearKPIs(rows, compradores, y, mode, cutoff, filters)
  }
  const monthly = computeMonthlySeries(rows, compradores, mode, cutoff, filters, years)
  const byComprador = computeByComprador(rows, compradores, mode, cutoff, filters, years)
  const spotContrato = computeBySpotContrato(rows, compradores, mode, cutoff, filters, years)
  const byEscopo = computeByEscopo(rows, compradores, mode, cutoff, filters, years)
  const analysis = buildAnalysis({ perYear, byComprador, spotContrato, years, mode })

  return { cutoff, years, perYear, monthly, byComprador, spotContrato, byEscopo, analysis }
}
