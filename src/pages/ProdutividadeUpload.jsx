import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, RotateCcw, Table, Undo2, ShieldAlert } from 'lucide-react'
import Papa from 'papaparse'
import useProdutividadeStore from '../store/useProdutividadeStore.js'
import useAppStore from '../store/useAppStore.js'
import {
  validateAndSummarize, canManageProdutividade, REQUIRED_COLS, OPTIONAL_COLS,
} from '../services/produtividadeImport.js'
import { formatDateTime } from '../utils/formatters.js'

/** Lê um arquivo e devolve linhas cruas (array de objetos por coluna). */
async function readFileToRows(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: h => h.trim(),
    })
    if (result.errors.length > 0 && result.data.length === 0) {
      throw new Error(`Erro ao ler CSV: ${result.errors[0].message}`)
    }
    return result.data
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    // raw:false + dateNF garante datas como texto dd/mm/aaaa (compatível com normalizeRow)
    return XLSX.utils.sheet_to_json(ws, { defval: '', raw: false, dateNF: 'dd/mm/yyyy' })
  }
  throw new Error('Formato não suportado. Envie um arquivo .csv ou .xlsx.')
}

export function ProdutividadeUpload({ onDone }) {
  const currentUser   = useAppStore(s => s.currentUser)
  const importRows    = useProdutividadeStore(s => s.importRows)
  const rollback      = useProdutividadeStore(s => s.rollback)
  const resetToSeed   = useProdutividadeStore(s => s.resetToSeed)
  const hasCustomData = useProdutividadeStore(s => s.hasCustomData)
  const meta          = useProdutividadeStore(s => s.meta)
  const previous      = useProdutividadeStore(s => s.previous)
  const rows          = useProdutividadeStore(s => s.rows)

  const [status,  setStatus]  = useState(null) // null | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [isDrag,  setIsDrag]  = useState(false)
  const [preview, setPreview] = useState(null)  // { rows, summary, fileName }
  const inputRef = useRef()

  const isAdmin = canManageProdutividade(currentUser)

  // Defesa em profundidade: bloqueia o conteúdo mesmo se a navegação falhar.
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#e9f3f0' }}>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <ShieldAlert size={16} /> Acesso restrito ao administrador.
        </div>
      </div>
    )
  }

  const handleFile = async (file) => {
    if (!file) return
    setStatus(null); setPreview(null); setMessage('')
    try {
      const raw = await readFileToRows(file)
      const { rows: validRows, summary } = validateAndSummarize(raw)
      setPreview({ rows: validRows, summary, fileName: file.name })
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Erro inesperado ao processar o arquivo.')
    }
  }

  const confirmImport = () => {
    if (!preview) return
    importRows(preview.rows, {
      uploadedBy: currentUser?.name || currentUser?.email || 'admin',
      rowCount: preview.summary.rowCount,
      pedidos: preview.summary.pedidos,
      compradores: preview.summary.compradores,
      dateRange: preview.summary.dateRange,
      fileName: preview.fileName,
    })
    setPreview(null)
    setStatus('success')
    setMessage(`Base atualizada: ${preview.summary.rowCount} linhas, ${preview.summary.pedidos} pedidos.`)
    setTimeout(() => onDone?.(), 1400)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setIsDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRollback = () => {
    if (rollback()) {
      setStatus('success'); setPreview(null)
      setMessage('Base revertida para a versão anterior.')
    }
  }

  const handleReset = () => {
    resetToSeed()
    setStatus('success'); setPreview(null)
    setMessage('Base de demonstração restaurada.')
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="max-w-2xl mx-auto px-5 py-5 space-y-4">

        <div>
          <h2 className="text-lg font-black" style={{ color: '#0D3125' }}>Atualizar base de dados</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
            Restrito ao administrador. Envie um .csv ou .xlsx com as colunas do modelo.
            A nova base substitui a vigente; a anterior fica guardada para rollback.
          </p>
        </div>

        {status && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
            status === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {status === 'success'
              ? <CheckCircle size={15} className="flex-shrink-0" />
              : <AlertCircle  size={15} className="flex-shrink-0" />}
            <span className="whitespace-pre-line">{message}</span>
          </div>
        )}

        {/* Preview / confirmação */}
        {preview && (
          <div className="bg-white rounded-xl border-2 p-4 space-y-3" style={{ borderColor: '#00D26A' }}>
            <div className="flex items-center gap-2">
              <CheckCircle size={15} style={{ color: '#00D26A' }} />
              <p className="text-sm font-bold" style={{ color: '#0D3125' }}>
                Pré-visualização — confirme para substituir a base
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: 'Linhas', v: preview.summary.rowCount.toLocaleString('pt-BR') },
                { k: 'Pedidos', v: preview.summary.pedidos.toLocaleString('pt-BR') },
                { k: 'Compradores', v: preview.summary.compradores.toLocaleString('pt-BR') },
                { k: 'Período', v: `${preview.summary.dateRange.min} → ${preview.summary.dateRange.max}` },
              ].map(c => (
                <div key={c.k} className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">{c.k}</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: '#0D3125' }}>{c.v}</p>
                </div>
              ))}
            </div>
            {preview.summary.warnings?.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-600 flex items-center gap-1.5">
                <AlertCircle size={12} /> {w}
              </p>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={confirmImport}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: '#00D26A' }}>
                Confirmar e substituir
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Dropzone */}
        {!preview && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Selecionar planilha para upload"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
            className="rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-10 gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            style={{
              borderColor: isDrag ? '#00D26A' : 'rgba(13,49,37,0.15)',
              background: isDrag ? 'rgba(0,210,106,0.05)' : 'white',
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: isDrag ? 'rgba(0,210,106,0.12)' : 'rgba(13,49,37,0.06)' }}>
              <Upload size={22} style={{ color: isDrag ? '#00D26A' : 'rgba(13,49,37,0.3)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#0D3125' }}>
                {isDrag ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.4)' }}>Aceita .csv e .xlsx</p>
            </div>
            <input
              ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = '' }}
            />
          </div>
        )}

        {/* Base vigente + ações de versão */}
        <div className="bg-white rounded-xl border p-4 flex items-center justify-between"
          style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,210,106,0.1)' }}>
              <FileText size={15} style={{ color: '#00D26A' }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#0D3125' }}>
                {rows.length.toLocaleString('pt-BR')} linhas carregadas
                {hasCustomData ? ' (base importada)' : ' (demonstração)'}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(13,49,37,0.4)' }}>
                {meta?.uploadedAt
                  ? `Atualizada em ${formatDateTime(meta.uploadedAt)} por ${meta.uploadedBy}`
                  : 'Sem upload registrado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {previous && (
              <button onClick={handleRollback}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
                <Undo2 size={12} /> Reverter
              </button>
            )}
            {hasCustomData && (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(13,49,37,0.06)', color: '#0D3125' }}>
                <RotateCcw size={12} /> Restaurar demo
              </button>
            )}
          </div>
        </div>

        {/* Modelo de colunas */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <Table size={13} style={{ color: '#00D26A' }} />
            <p className="text-xs font-semibold" style={{ color: '#0D3125' }}>Colunas esperadas</p>
          </div>
          <div className="p-4 flex flex-wrap gap-1.5">
            {REQUIRED_COLS.map(c => (
              <span key={c} className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {c}
              </span>
            ))}
            {OPTIONAL_COLS.map(c => (
              <span key={c} className="text-[10px] font-mono px-2 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                {c} (opc.)
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
