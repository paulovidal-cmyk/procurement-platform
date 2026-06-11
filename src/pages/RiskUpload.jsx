import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, RotateCcw, Table } from 'lucide-react'
import Papa from 'papaparse'
import useRiskStore from '../store/useRiskStore.js'
import { processRow } from '../algorithms/risk.js'

const SCHEMA_COLS = [
  { col: 'Nome Fornecedor',       req: true,  desc: 'Nome do fornecedor (fallback: coluna "Fornecedor")' },
  { col: 'CNPJ',                  req: false, desc: 'CNPJ' },
  { col: 'Categoria',             req: false, desc: 'Categoria de compras' },
  { col: 'Subcategoria',          req: false, desc: 'Subcategoria' },
  { col: 'Quantidade de Pedidos', req: false, desc: 'Nº de pedidos (inteiro)' },
  { col: 'Spend',                 req: false, desc: 'Spend em R$ (aceita "1.234.567,89" ou número)' },
  { col: 'nota_geral',            req: false, desc: 'Nota geral 0–100 (vazio = 100)' },
  { col: 'score_saude_financeira',req: false, desc: 'Nota da dimensão Saúde (0–100)' },
  { col: 'score_reputacao',       req: false, desc: 'Nota da dimensão Reputação (0–100)' },
  { col: 'score_dados_internos',  req: false, desc: 'Nota da dimensão Interna (0–100)' },
  { col: 'fin_situacao',          req: false, desc: 'Sub-nota situação financeira' },
  { col: 'fin_maturidade',        req: false, desc: 'Sub-nota maturidade financeira' },
  { col: 'fin_exposicao',         req: false, desc: 'Sub-nota exposição financeira' },
  { col: 'int_kraljic',           req: false, desc: 'Sub-nota Kraljic' },
  { col: 'int_pedidos',           req: false, desc: 'Sub-nota pedidos' },
  { col: 'int_ticket',            req: false, desc: 'Sub-nota ticket médio' },
  { col: 'evidencia_noticia',     req: false, desc: 'Título da notícia/evidência' },
  { col: 'link_noticia',          req: false, desc: 'URL da notícia' },
  { col: 'analise_ia_detalhada',  req: false, desc: 'Texto de análise detalhada' },
]

export function RiskUpload({ onDone }) {
  const importSuppliers = useRiskStore(s => s.importSuppliers)
  const resetToSeed     = useRiskStore(s => s.resetToSeed)
  const hasCustomData   = useRiskStore(s => s.hasCustomData)
  const suppliers       = useRiskStore(s => s.suppliers)

  const [status,  setStatus]  = useState(null) // null | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [isDrag,  setIsDrag]  = useState(false)
  const inputRef = useRef()

  const processFile = async (file) => {
    if (!file) return
    setStatus(null)
    try {
      const text = await file.text()
      let rows = []

      if (file.name.toLowerCase().endsWith('.json')) {
        const data = JSON.parse(text)
        rows = Array.isArray(data) ? data : (data.data ?? data.suppliers ?? [])
      } else {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
        })
        if (result.errors.length > 0 && result.data.length === 0) {
          throw new Error(`Erro ao parsear CSV: ${result.errors[0].message}`)
        }
        rows = result.data
      }

      if (!rows.length) throw new Error('Arquivo vazio ou sem linhas de dados reconhecíveis.')

      const processed = rows.map((row, i) => processRow(row, i))
        .filter(s => s.fornecedor) // ignora linhas sem nome

      if (!processed.length) throw new Error('Nenhum fornecedor válido encontrado. Verifique se a coluna "fornecedor" está presente.')

      // Dedupe: colapsa fornecedores repetidos (chave = CNPJ ou, na falta, o nome)
      const seen = new Set()
      const deduped = processed.filter(s => {
        const digits = s.cnpj ? s.cnpj.replace(/\D/g, '') : ''
        const key = digits || s.fornecedor.trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      const removed = processed.length - deduped.length

      importSuppliers(deduped)
      setStatus('success')
      setMessage(
        `${deduped.length} fornecedores importados com sucesso.` +
        (removed > 0 ? ` (${removed} duplicata${removed !== 1 ? 's' : ''} removida${removed !== 1 ? 's' : ''})` : '')
      )
      setTimeout(() => onDone?.(), 1200)
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Erro inesperado ao processar o arquivo.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleReset = () => {
    resetToSeed()
    setStatus('success')
    setMessage('Dados de demonstração restaurados com sucesso.')
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="max-w-2xl mx-auto px-5 py-5 space-y-4">

        {/* Header */}
        <div>
          <h2 className="text-lg font-black" style={{ color: '#0D3125' }}>Importar Dados</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
            Carregue um CSV ou JSON exportado do Google Sheets. Os dados ficam apenas no navegador.
          </p>
        </div>

        {/* Status banner */}
        {status && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
            status === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {status === 'success'
              ? <CheckCircle size={15} className="flex-shrink-0" />
              : <AlertCircle  size={15} className="flex-shrink-0" />
            }
            <span>{message}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
          onDragLeave={() => setIsDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-10 gap-3"
          style={{
            borderColor: isDrag ? '#00D26A' : 'rgba(13,49,37,0.15)',
            background: isDrag ? 'rgba(0,210,106,0.05)' : 'white',
          }}
        >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: isDrag ? 'rgba(0,210,106,0.12)' : 'rgba(13,49,37,0.06)' }}>
            <Upload size={22} style={{ color: isDrag ? '#00D26A' : 'rgba(13,49,37,0.3)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#0D3125' }}>
              {isDrag ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.4)' }}>
              Aceita .csv e .json
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={e => { const f = e.target.files[0]; if (f) processFile(f) }}
          />
        </div>

        {/* Current data info */}
        <div className="bg-white rounded-xl border p-4 flex items-center justify-between"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,210,106,0.1)' }}>
              <FileText size={15} style={{ color: '#00D26A' }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#0D3125' }}>
                {suppliers.length} fornecedores carregados
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(13,49,37,0.4)' }}>
                {hasCustomData ? 'Dados importados' : 'Dados de demonstração'}
              </p>
            </div>
          </div>
          {hasCustomData && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(13,49,37,0.06)', color: '#0D3125' }}
            >
              <RotateCcw size={12} /> Restaurar demo
            </button>
          )}
        </div>

        {/* Schema reference */}
        <div className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <Table size={13} style={{ color: '#00D26A' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#0D3125' }}>
                Estrutura esperada das colunas
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(13,49,37,0.4)' }}>
                Compatível com o export do n8n. Nomes antigos (nota_financeira, qtd_pedidos, evidencia_titulo) também são aceitos; colunas extras são ignoradas.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Coluna</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Obrigatório</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {SCHEMA_COLS.map(row => (
                  <tr key={row.col} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-1.5 font-mono text-[10px]" style={{ color: '#0D3125' }}>
                      {row.col}
                    </td>
                    <td className="px-3 py-1.5">
                      {row.req
                        ? <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Sim</span>
                        : <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400">Não</span>
                      }
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
