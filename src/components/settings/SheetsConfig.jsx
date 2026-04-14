import { useState } from 'react'
import { Database, Key, Grid3x3, CheckCircle, XCircle, Loader2, ExternalLink, Eye, EyeOff, RefreshCw } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'

export function SheetsConfig() {
  const sheetsConfig   = useAppStore(s => s.sheetsConfig)
  const sheetsLoading  = useAppStore(s => s.sheetsLoading)
  const sheetsError    = useAppStore(s => s.sheetsError)
  const sheetsData     = useAppStore(s => s.sheetsData)
  const updateSheetsConfig = useAppStore(s => s.updateSheetsConfig)
  const loadSheetsData     = useAppStore(s => s.loadSheetsData)
  const resetToMockData    = useAppStore(s => s.resetToMockData)

  const [local, setLocal] = useState({ ...sheetsConfig })
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | { ok, msg }
  const [dirty, setDirty] = useState(false)

  const set = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }))
    setDirty(true)
    setTestResult(null)
  }

  const handleSave = () => {
    updateSheetsConfig(local)
    setDirty(false)
  }

  const handleTest = async () => {
    if (dirty) { updateSheetsConfig(local); setDirty(false) }
    const result = await loadSheetsData()
    setTestResult(result.success
      ? { ok: true,  msg: `Conexão estabelecida! ${result.count} linhas carregadas.` }
      : { ok: false, msg: result.error }
    )
  }

  const isConnected = sheetsConfig.sheetId && sheetsConfig.apiKey

  return (
    <div className="space-y-5">

      {/* Status card */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
        isConnected
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <Database size={16} className={isConnected ? 'text-emerald-600' : 'text-gray-400'} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isConnected ? 'text-emerald-800' : 'text-gray-600'}`}>
            {isConnected ? 'Planilha configurada' : 'Sem conexão ativa'}
          </p>
          <p className={`text-xs ${isConnected ? 'text-emerald-600' : 'text-gray-400'}`}>
            {isConnected
              ? `${sheetsData.length} registros · Range: ${sheetsConfig.range}`
              : 'Configure os campos abaixo para conectar ao Google Sheets'}
          </p>
        </div>
        {isConnected && (
          <button
            onClick={async () => { const r = await loadSheetsData(); setTestResult(r.success ? { ok:true, msg:`${r.count} linhas recarregadas.` } : { ok:false, msg:r.error }) }}
            disabled={sheetsLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <RefreshCw size={12} className={sheetsLoading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-1.5">
        <p className="font-semibold">Como configurar</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600">
          <li>Acesse o Google Cloud Console e crie/selecione um projeto</li>
          <li>Habilite a <strong>Google Sheets API</strong></li>
          <li>Crie uma <strong>API Key</strong> (restrinja ao domínio do site)</li>
          <li>Abra sua planilha → Compartilhar → <strong>"Qualquer pessoa com o link pode ver"</strong></li>
          <li>Copie o ID da planilha (parte da URL entre /d/ e /edit)</li>
        </ol>
        <p className="text-xs text-blue-500 mt-2">
          Colunas esperadas: Coordenação · Categoria · Subcategoria · Quadrante · Fornecedor · CNPJ · Tipo de Negociação · Quantidade de Pedidos · Spend
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">Credenciais de Acesso</h3>

        {/* Sheet ID */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
            <Database size={13} className="text-gray-400" />
            ID da Planilha
          </label>
          <input
            type="text"
            value={local.sheetId}
            onChange={e => set('sheetId', e.target.value)}
            placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Encontrado na URL: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
            <Key size={13} className="text-gray-400" />
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={local.apiKey}
              onChange={e => set('apiKey', e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono"
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
            <Grid3x3 size={13} className="text-gray-400" />
            Intervalo (Range)
          </label>
          <input
            type="text"
            value={local.range}
            onChange={e => set('range', e.target.value)}
            placeholder="Sheet1!A:I"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nome da aba e colunas. Ex: "Dados!A1:I500" ou "Sheet1!A:I"
          </p>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm border ${
            testResult.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {testResult.ok ? <CheckCircle size={15} className="flex-shrink-0 mt-0.5" /> : <XCircle size={15} className="flex-shrink-0 mt-0.5" />}
            <span>{testResult.msg}</span>
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
            disabled={!local.sheetId || !local.apiKey || sheetsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0D3125' }}
          >
            {sheetsLoading ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
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
