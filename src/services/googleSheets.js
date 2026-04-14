/**
 * Google Sheets API v4 — leitura via API Key (browser-safe)
 *
 * Pré-requisitos:
 *  1. Crie um projeto no Google Cloud Console
 *  2. Habilite "Google Sheets API"
 *  3. Crie uma API Key (restrinja ao domínio do site e à Sheets API)
 *  4. Compartilhe a planilha com acesso de leitura para "Qualquer pessoa com o link"
 *     OU com o Service Account (neste caso use OAuth2 via backend)
 */

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

// Mapeamento dos cabeçalhos da planilha para as chaves internas
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

function normalizeKey(header) {
  return HEADER_MAP[header.trim()] || header.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseValue(raw) {
  if (raw === undefined || raw === null || raw === '') return ''
  const str = String(raw).trim()
  const num = parseFloat(str.replace(/\./g, '').replace(',', '.'))
  return !isNaN(num) && str.match(/^[\d.,]+$/) ? num : str
}

/**
 * @param {string} sheetId  — ID da planilha (parte da URL do Google Sheets)
 * @param {string} apiKey   — API Key do Google Cloud
 * @param {string} range    — Intervalo (ex: "Sheet1!A:I" ou "Dados!A1:I500")
 * @returns {Promise<Array>} — Array de objetos com os dados
 */
export async function fetchSheetData(sheetId, apiKey, range = 'Sheet1!A:I') {
  if (!sheetId?.trim() || !apiKey?.trim()) {
    throw new Error('Sheet ID e API Key são obrigatórios.')
  }

  const url = `${BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    let msg = `Erro HTTP ${res.status}`
    try {
      const json = await res.json()
      msg = json?.error?.message || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const json = await res.json()
  const [headers, ...rows] = json.values || []
  if (!headers || headers.length === 0) {
    throw new Error('Planilha vazia ou intervalo inválido.')
  }

  return rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => {
        obj[normalizeKey(h)] = parseValue(row[i])
      })
      return obj
    })
}
