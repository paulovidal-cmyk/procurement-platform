/**
 * Busca dados via Google Apps Script Web App.
 * Não requer API Key — o script roda com as permissões do dono da planilha.
 *
 * Configuração:
 *  1. Acesse script.google.com → crie um projeto com o código doGet()
 *  2. Implantar → Nova implantação → Web App
 *     - Executar como: Eu
 *     - Quem pode acessar: Qualquer pessoa
 *  3. Cole a URL gerada nas Configurações → Conexão Sheets
 */

function buildError(status, url) {
  if (status === 401 || status === 403) {
    return (
      `Acesso negado (HTTP ${status}).\n` +
      `Verifique nas configurações do Web App:\n` +
      `• "Executar como: Eu"\n` +
      `• "Quem pode acessar: Qualquer pessoa"\n` +
      `Se acabou de implantar, aguarde 1-2 minutos e tente novamente.`
    )
  }
  if (status === 404) {
    return (
      `Web App não encontrado (HTTP 404).\n` +
      `• Verifique se a URL foi copiada corretamente\n` +
      `• A URL deve terminar em /exec, não em /dev`
    )
  }
  if (status === 429) {
    return `Limite de requisições atingido. Aguarde 1-2 minutos e tente novamente.`
  }
  return `Erro HTTP ${status} ao acessar o Web App.`
}

export async function fetchSheetData(webAppUrl) {
  if (!webAppUrl?.trim()) {
    throw new Error(
      'URL do Web App não configurada.\n' +
      'Cole a URL gerada no Google Apps Script → Implantar → Gerenciar implantações.'
    )
  }

  let res
  try {
    res = await fetch(webAppUrl)
  } catch (networkErr) {
    throw new Error(
      `Falha de rede — não foi possível conectar ao Web App.\n` +
      `• Verifique sua conexão com a internet\n` +
      `• Erro técnico: ${networkErr.message}`
    )
  }

  if (!res.ok) {
    throw new Error(buildError(res.status, webAppUrl))
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error(
      'Resposta inválida — o Web App não retornou JSON.\n' +
      'Verifique se o script foi salvo e implantado corretamente.'
    )
  }

  if (json.error) {
    throw new Error(`Erro no script: ${json.error}`)
  }

  if (!Array.isArray(json.data) || json.data.length === 0) {
    throw new Error(
      'O Web App retornou sem dados.\n' +
      '• Verifique se a aba "Export" existe na planilha\n' +
      '• Confirme que há dados abaixo do cabeçalho'
    )
  }

  return json.data
}
