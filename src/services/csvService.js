/**
 * Leitura do CSV público exportado pelo Google Sheets ("Publicar na Web")
 * Não requer autenticação — funciona diretamente no browser.
 */

export const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSq8ijByplqYurizD6YcaUKW2rwsov6MKlEjXcRtbrzwBa4wYIJ1-wNKwJ9ZLMtlqjMzoTtqo0tSgxe/pub?output=csv'

const HEADER_MAP = {
  'Coordenação':           'coordenacao',
  'Coordenacao':           'coordenacao',
  'Categoria':             'categoria',
  'Subcategoria':          'subcategoria',
  'Quadrante':             'quadrante',
  'Fornecedor':            'fornecedor',
  'CNPJ':                  'cnpj',
  'Tipo de Negociação':    'tipoNegociacao',
  'Tipo de Negociacao':    'tipoNegociacao',
  'Quantidade de Pedidos': 'qtdPedidos',
  'Spend':                 'spend',
}

function normalizeKey(h) {
  return HEADER_MAP[h.trim()] ?? h.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseValue(raw) {
  const s = String(raw ?? '').trim().replace(/^"|"$/g, '')
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  return !isNaN(n) && /^[\d.,]+$/.test(s) ? n : s
}

/** Parses one CSV line respecting quoted fields */
function parseLine(line) {
  const fields = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  fields.push(cur.trim())
  return fields
}

export async function fetchCsvData() {
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar o CSV`)

  const text = await res.text()
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV vazio ou sem dados')

  const headers = parseLine(lines[0]).map(normalizeKey)

  return lines.slice(1)
    .map(line => {
      const vals = parseLine(line)
      const obj = {}
      headers.forEach((h, i) => { obj[h] = parseValue(vals[i]) })
      return obj
    })
    .filter(row => headers.some(h => row[h] !== ''))
}
