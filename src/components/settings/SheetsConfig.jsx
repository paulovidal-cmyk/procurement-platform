import { useState } from 'react'
import { Database, Link, CheckCircle, XCircle, Loader, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'

export function SheetsConfig() {
  const sheetsConfig       = useAppStore(s => s.sheetsConfig)
  const sheetsLoading      = useAppStore(s => s.sheetsLoading)
  const sheetsError        = useAppStore(s => s.sheetsError)
  const sheetsData         = useAppStore(s => s.sheetsData)
  const updateSheetsConfig = useAppStore(s => s.updateSheetsConfig)
  const loadSheetsData     = useAppStore(s => s.loadSheetsData)
  const resetToMockData    = useAppStore(s => s.resetToMockData)

  const [url,        setUrl]        = useState(sheetsConfig.webAppUrl || '')
  const [testResult, setTestResult] = useState(null)
  const [dirty,      setDirty]      = useState(false)
  const [copied,     setCopied]     = useState(false)

  const handleUrlChange = (v) => { setUrl(v); setDirty(true); setTestResult(null) }

  const handleSave = () => { updateSheetsConfig({ webAppUrl: url }); setDirty(false) }

  const handleTest = async () => {
    if (dirty) { updateSheetsConfig({ webAppUrl: url }); setDirty(false) }
    const result = await loadSheetsData()
    setTestResult(result.success
      ? { ok: true,  msg: `Conexão estabelecida! ${result.count} linhas carregadas.` }
      : { ok: false, msg: result.error }
    )
  }

  const isConnected = !!sheetsConfig.webAppUrl

  const SCRIPT_CODE = `const SPREADSHEET_ID = '1g__ANYBFMtXc84Rc9BJ4L7LUvouflAG5tP3Ia-h1_e0'
const SHEET_NAME = 'Export'
const HEADER_MAP = {
  'Coordenação':'coordenacao','Coordenacao':'coordenacao','Categoria':'categoria',
  'Subcategoria':'subcategoria','Quadrante':'quadrante','Fornecedor':'fornecedor',
  'CNPJ':'cnpj','Tipo de Negociação':'tipoNegociacao','Tipo de Negociacao':'tipoNegociacao',
  'Quantidade de Pedidos':'qtdPedidos','Spend':'spend',
}
function normalizeKey(h){return HEADER_MAP[h.trim()]||h.trim().toLowerCase().replace(/\\s+/g,'_')}
function parseValue(raw){
  if(raw===''||raw===null||raw===undefined)return ''
  const s=String(raw).trim()
  const n=parseFloat(s.replace(/\\./g,'').replace(',','.'))
  return !isNaN(n)&&/^[\\d.,]+$/.test(s)?n:s
}
function doGet(e){
  try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID)
    const sheet=ss.getSheetByName(SHEET_NAME)
    if(!sheet)return ContentService.createTextOutput(JSON.stringify({error:'Aba "Export" não encontrada.'})).setMimeType(ContentService.MimeType.JSON)
    const values=sheet.getDataRange().getValues()
    if(values.length<2)return ContentService.createTextOutput(JSON.stringify({error:'Planilha sem dados.'})).setMimeType(ContentService.MimeType.JSON)
    const headers=values[0].map(normalizeKey)
    const rows=values.slice(1).filter(row=>row.some(cell=>cell!=='')).map(row=>{const obj={};headers.forEach((h,i)=>{obj[h]=parseValue(row[i])});return obj})
    return ContentService.createTextOutput(JSON.stringify({data:rows,count:rows.length})).setMimeType(ContentService.MimeType.JSON)
  }catch(err){return ContentService.createTextOutput(JSON.stringify({error:err.message})).setMimeType(ContentService.MimeType.JSON)}
}`

  const handleCopy = () => {
    navigator.clipboard.writeText(SCRIPT_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">

      {/* Status */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
        isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <Database size={16} className={isConnected ? 'text-emerald-600' : 'text-gray-400'} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isConnected ? 'text-emerald-800' : 'text-gray-600'}`}>
            {isConnected ? 'Web App configurado' : 'Sem conexão ativa'}
          </p>
          <p className={`text-xs ${isConnected ? 'text-emerald-600' : 'text-gray-400'}`}>
            {isConnected
              ? `${sheetsData.length} registros carregados`
              : 'Configure o Web App abaixo para conectar ao Google Sheets'}
          </p>
        </div>
        {isConnected && (
          <button
            onClick={async () => {
              const r = await loadSheetsData()
              setTestResult(r.success
                ? { ok: true,  msg: `${r.count} linhas recarregadas.` }
                : { ok: false, msg: r.error }
              )
            }}
            disabled={sheetsLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <RefreshCw size={12} className={sheetsLoading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        )}
      </div>

      {/* Step-by-step instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-blue-800">Como conectar via Google Apps Script</p>
        <ol className="space-y-2 text-xs text-blue-700">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
            <span>Acesse <a href="https://script.google.com" target="_blank" rel="noreferrer" className="font-semibold underline">script.google.com</a> e crie um <strong>Novo projeto</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
            <span>Apague o código existente, cole o script abaixo e salve (<strong>Ctrl+S</strong>)</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
            <span>Clique em <strong>Implantar → Nova implantação</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
            <span>Tipo: <strong>Web App</strong> · Executar como: <strong>Eu</strong> · Acesso: <strong>Qualquer pessoa</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">5</span>
            <span>Copie a <strong>URL do Web App</strong> gerada e cole no campo abaixo</span>
          </li>
        </ol>
      </div>

      {/* Script code block */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
          <span className="text-xs font-mono text-gray-400">Google Apps Script · doGet.gs</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{ background: copied ? 'rgba(16,203,154,0.2)' : 'rgba(255,255,255,0.08)', color: copied ? '#10CB9A' : '#9ca3af' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <pre className="px-4 py-3 text-xs text-gray-300 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all max-h-40">
          {SCRIPT_CODE}
        </pre>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">URL do Web App</h3>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
            <Link size={13} className="text-gray-400" />
            URL gerada pelo Apps Script
          </label>
          <input
            type="url"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://script.google.com/macros/s/XXXXX/exec"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            A URL deve terminar em <code className="bg-gray-100 px-1 rounded">/exec</code>
          </p>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm border ${
            testResult.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {testResult.ok
              ? <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
              : <XCircle size={15} className="flex-shrink-0 mt-0.5" />
            }
            <span className="whitespace-pre-line text-xs leading-relaxed">{testResult.msg}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {dirty && (
            <button onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Salvar
            </button>
          )}
          <button
            onClick={handleTest}
            disabled={!url.trim() || sheetsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0D3125' }}
          >
            {sheetsLoading ? <Loader size={13} className="animate-spin" /> : <Database size={13} />}
            {sheetsLoading ? 'Testando…' : 'Testar Conexão'}
          </button>
          <button onClick={resetToMockData}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Usar dados demo
          </button>
        </div>
      </div>
    </div>
  )
}
