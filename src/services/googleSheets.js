/**
 * Google Sheets API v4 — leitura via API Key
 *
 * Pré-requisitos:
 *  1. Google Cloud Console → habilite "Google Sheets API"
 *  2. Crie uma API Key → restrinja ao domínio paulovidal-cmyk.github.io
 *  3. Planilha → Compartilhar → "Qualquer pessoa com o link pode ver"
 */

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

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
  const s = String(raw ?? '').trim()
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  return !isNaN(n) && /^[\d.,]+$/.test(s) ? n : s
}

/** Traduz o código HTTP + mensagem da API em erro legível em português */
function buildError(status, apiMessage, sheetId, apiKey) {
  const hasKey   = apiKey?.trim().length > 0
  const hasSheet = sheetId?.trim().length > 0

  if (!hasKey)   return 'API Key não informada. Preencha o campo "API Key" nas configurações.'
  if (!hasSheet) return 'Sheet ID não informado. Preencha o campo "ID da Planilha" nas configurações.'

  switch (status) {
    case 400:
      return `Parâmetro inválido (HTTP 400). Causas mais comuns:\n` +
             `• O "Intervalo (Range)" está incorreto — ex: use "Sheet1!A:I" ou "Dados!A1:I500"\n` +
             `• Verifique se o nome da aba corresponde exatamente ao nome na planilha.\n` +
             `Detalhe da API: ${apiMessage}`

    case 401:
      return `API Key inválida ou expirada (HTTP 401).\n` +
             `• Verifique se a chave foi copiada corretamente (sem espaços)\n` +
             `• Acesse Google Cloud Console → Credenciais e confirme que a chave está ativa\n` +
             `Detalhe: ${apiMessage}`

    case 403:
      return `Acesso negado (HTTP 403). Existem duas causas possíveis:\n\n` +
             `1. A planilha não está compartilhada publicamente:\n` +
             `   → Abra a planilha → Compartilhar → "Qualquer pessoa com o link pode ver"\n\n` +
             `2. A API Key tem restrição de domínio que bloqueia esta origem:\n` +
             `   → Google Cloud → Credenciais → edite a chave\n` +
             `   → Em "Restrições de aplicativo" adicione: paulovidal-cmyk.github.io/*\n` +
             `   → Ou mude para "Nenhuma restrição" para testar\n\n` +
             `Detalhe da API: ${apiMessage}`

    case 404:
      return `Planilha não encontrada (HTTP 404).\n` +
             `• O Sheet ID parece incorreto: "${sheetId}"\n` +
             `• Copie o ID da URL da planilha: docs.google.com/spreadsheets/d/[SHEET_ID]/edit\n` +
             `Detalhe: ${apiMessage}`

    case 429:
      return `Limite de requisições atingido (HTTP 429).\n` +
             `• Aguarde 1-2 minutos antes de tentar novamente\n` +
             `• A API Sheets tem cota de 300 req/min por projeto`

    case 500:
    case 503:
      return `Erro temporário nos servidores do Google (HTTP ${status}).\n` +
             `Tente novamente em alguns instantes.`

    default:
      return `Erro inesperado (HTTP ${status}).\n` +
             `• Verifique se a Google Sheets API está habilitada no Google Cloud Console\n` +
             `Detalhe: ${apiMessage}`
  }
}

export async function fetchSheetData(sheetId, apiKey, range = 'Sheet1!A:I') {
  if (!sheetId?.trim())
    throw new Error('Sheet ID não informado. Preencha o campo "ID da Planilha" nas configurações.')
  if (!apiKey?.trim())
    throw new Error('API Key não informada. Preencha o campo "API Key" nas configurações.')

  const url = `${BASE}/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

  let res
  try {
    res = await fetch(url)
  } catch (networkErr) {
    throw new Error(
      `Falha de rede — não foi possível conectar ao Google.\n` +
      `• Verifique sua conexão com a internet\n` +
      `• Erro técnico: ${networkErr.message}`
    )
  }

  if (!res.ok) {
    let apiMsg = `sem detalhes`
    try {
      const json = await res.json()
      apiMsg = json?.error?.message ?? apiMsg
    } catch { /* ignore */ }
    throw new Error(buildError(res.status, apiMsg, sheetId, apiKey))
  }

  const json = await res.json()
  const [headers, ...rows] = json.values ?? []

  if (!headers || headers.length === 0) {
    throw new Error(
      `A planilha está vazia ou o intervalo "${range}" não retornou dados.\n` +
      `• Confirme o nome da aba e o intervalo de colunas\n` +
      `• A primeira linha deve conter os cabeçalhos`
    )
  }

  const normalizedHeaders = headers.map(normalizeKey)
  const data = rows
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const obj = {}
      normalizedHeaders.forEach((h, i) => { obj[h] = parseValue(row[i]) })
      return obj
    })

  if (data.length === 0) {
    throw new Error(
      `Cabeçalhos encontrados (${headers.join(', ')}), mas nenhuma linha de dados.\n` +
      `• Verifique se há dados abaixo da linha de cabeçalho\n` +
      `• O intervalo atual é: "${range}"`
    )
  }

  return data
}
