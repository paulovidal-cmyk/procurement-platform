import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'

// Regex patterns for extraction
const PATTERNS = {
  cnpj: /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/g,
  valor: /R\$\s*[\d.,]+(?:\.\d{3})*(?:,\d{2})?/gi,
  razaoSocial: /(?:raz[aã]o\s+social|empresa|contratad[ao])[:\s]+([A-ZÁÉÍÓÚÂÊÔÃÕÇÜ][A-ZÁÉÍÓÚÂÊÔÃÕÇÜa-záéíóúâêôãõçü\s.&-]{5,60})/i,
}

function parseCNPJ(text) {
  const matches = text.match(PATTERNS.cnpj)
  if (!matches) return null
  const raw = matches[0].replace(/[^\d]/g, '')
  if (raw.length === 14) {
    return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  return null
}

function parseValor(text) {
  const matches = text.match(PATTERNS.valor)
  if (!matches) return null
  // Take the largest numeric value found
  const values = matches.map(m => {
    const cleaned = m.replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  })
  return Math.max(...values)
}

function parseRazaoSocial(text) {
  const match = text.match(PATTERNS.razaoSocial)
  return match ? match[1].trim() : null
}

async function extractTextFromPDF(file) {
  // Read file as text (for text-based PDFs) using FileReader
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      // Try to extract text from PDF binary (basic approach without pdfjs)
      const binary = e.target.result
      // Extract printable ASCII sequences as a fallback
      const text = binary
        .split('')
        .map(c => c.charCodeAt(0))
        .map(c => (c >= 32 && c <= 126) || c === 10 || c === 13 ? String.fromCharCode(c) : ' ')
        .join('')
      resolve(text)
    }
    reader.readAsBinaryString(file)
  })
}

export function OcrUploader({ onParsed }) {
  const [status, setStatus] = useState('idle') // idle | parsing | done | error
  const [extracted, setExtracted] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file || !file.type.includes('pdf')) {
      setStatus('error')
      return
    }

    setStatus('parsing')
    try {
      const text = await extractTextFromPDF(file)
      const cnpj = parseCNPJ(text)
      const valor = parseValor(text)
      const razaoSocial = parseRazaoSocial(text)

      const result = { cnpj, valor, razaoSocial }
      setExtracted(result)
      setStatus('done')
      onParsed({
        cnpj: cnpj || undefined,
        razaoSocial: razaoSocial || undefined,
        valorFinal: valor || undefined,
        fornecedor: razaoSocial ? razaoSocial.split(' ').slice(0, 2).join(' ') : undefined,
      })
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {status === 'idle' && <Upload size={20} className="text-gray-400" />}
          {status === 'parsing' && <Loader size={20} className="text-blue-500 animate-spin" />}
          {status === 'done' && <CheckCircle size={20} className="text-emerald-500" />}
          {status === 'error' && <AlertCircle size={20} className="text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">
            {status === 'idle' && 'Upload de Proposta (OCR)'}
            {status === 'parsing' && 'Extraindo dados do PDF...'}
            {status === 'done' && 'Dados extraídos com sucesso!'}
            {status === 'error' && 'Erro ao processar o arquivo'}
          </p>
          {status === 'idle' && (
            <p className="text-xs text-gray-400">Faça upload de um PDF para preencher o formulário automaticamente</p>
          )}
          {status === 'done' && extracted && (
            <div className="mt-1 flex flex-wrap gap-2">
              {extracted.cnpj && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  CNPJ: {extracted.cnpj}
                </span>
              )}
              {extracted.razaoSocial && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Razão Social detectada
                </span>
              )}
              {extracted.valor && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Valor: R$ {extracted.valor.toLocaleString('pt-BR')}
                </span>
              )}
              {!extracted.cnpj && !extracted.razaoSocial && !extracted.valor && (
                <span className="text-xs text-gray-500">Nenhum campo identificado automaticamente</span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <FileText size={14} />
          Selecionar PDF
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
