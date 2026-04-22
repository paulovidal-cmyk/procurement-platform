/**
 * Engine financeiro do módulo Raio-X de Preços
 */

/** Converte 'DD/MM/YYYY' → Date (dia 1 do mês) */
export function parseIndicadorDate(str) {
  if (!str) return null
  const [d, m, y] = str.split('/')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

/** Converte 'YYYY-MM' (input[type=month]) → { year, month } */
export function parseMonthInput(str) {
  if (!str) return null
  const [y, m] = str.split('-')
  return { year: Number(y), month: Number(m) }
}

/** Retorna chave 'YYYY-MM' de um Date */
function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Constrói mapa { 'YYYY-MM': valor } para um indicador */
function buildMap(dados, indicador) {
  const map = {}
  dados
    .filter(d => d.indicador === indicador)
    .forEach(d => {
      const date = parseIndicadorDate(d.data)
      if (date) map[monthKey(date)] = Number(d.valor)
    })
  return map
}

/**
 * Calcula variação ponta-a-ponta encadeada:
 * Produto de (1 + vi/100) para todos os meses de ini até fim, inclusive.
 */
function pontaAPonta(map, iniStr, fimStr) {
  const ini = parseMonthInput(iniStr)
  const fim = parseMonthInput(fimStr)
  if (!ini || !fim) return null

  let accumulated = 1
  let found = 0
  let cur = new Date(ini.year, ini.month - 1, 1)
  const end = new Date(fim.year, fim.month - 1, 1)

  while (cur <= end) {
    const key = monthKey(cur)
    if (map[key] !== undefined) { accumulated *= (1 + map[key] / 100); found++ }
    cur.setMonth(cur.getMonth() + 1)
  }

  return found > 0 ? (accumulated - 1) * 100 : null
}

/**
 * Calcula média dos últimos 12 meses até (e incluindo) a data final.
 */
function mediaMovel12(map, fimStr) {
  const fim = parseMonthInput(fimStr)
  if (!fim) return null

  const endDate = new Date(fim.year, fim.month - 1, 1)
  const values = []

  for (let i = 0; i < 12; i++) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const key = monthKey(d)
    if (map[key] !== undefined) values.push(map[key])
  }

  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/**
 * Calcula a Variação Calculada (VC) de uma linha do breakdown.
 */
export function calcularVC(dados, indicador, dataInicial, dataFinal, tipo) {
  if (!indicador || !dataFinal) return null
  const map = buildMap(dados, indicador)
  if (tipo === 'media_movel') return mediaMovel12(map, dataFinal)
  return pontaAPonta(map, dataInicial, dataFinal)
}

/**
 * Calcula todos os valores derivados de uma lista de linhas.
 * Retorna { linhasCalc, totalPeso, variacaoBase, variacaoFinal }
 */
export function calcularBreakdown(linhas, dados, margem) {
  const linhasCalc = linhas.map(l => {
    const vc  = calcularVC(dados, l.indicador, l.dataInicial, l.dataFinal, l.tipoVariacao)
    const vl  = l.override !== '' && l.override !== null && !isNaN(parseFloat(l.override))
      ? parseFloat(l.override)
      : vc
    const peso = parseFloat(l.peso) || 0
    const vp  = vl !== null ? vl * (peso / 100) : null
    return { ...l, vc, vl, vp }
  })

  const totalPeso   = linhas.reduce((s, l) => s + (parseFloat(l.peso) || 0), 0)
  const variacaoBase = linhasCalc.reduce((s, l) => s + (l.vp ?? 0), 0)
  const m           = parseFloat(margem) || 0
  const variacaoFinal = (1 + variacaoBase / 100) * (1 + m / 100) - 1

  return { linhasCalc, totalPeso, variacaoBase, variacaoFinal: variacaoFinal * 100 }
}

/** Formata número como percentual com sinal */
export function fmtPct(v, decimals = 2) {
  if (v === null || v === undefined || isNaN(v)) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(decimals)}%`
}

/** Retorna series de dados para sparkline de um indicador (últimos N meses) */
export function getSparklineSeries(dados, indicador, n = 12) {
  return dados
    .filter(d => d.indicador === indicador)
    .map(d => ({ date: parseIndicadorDate(d.data), valor: d.valor }))
    .sort((a, b) => a.date - b.date)
    .slice(-n)
    .map((d, i) => ({ i, v: d.valor }))
}
