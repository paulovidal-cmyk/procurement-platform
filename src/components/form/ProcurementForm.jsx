import { useState, useEffect } from 'react'
import { Building2, DollarSign, BarChart2, MessageSquare, Save, Loader, Lock, Eye,
         TrendingDown, Shield, AlertTriangle, Sliders } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { OcrUploader } from './OcrUploader.jsx'
import { VplBuilder } from './VplBuilder.jsx'
import { DynamicFields } from './DynamicFields.jsx'
import { maskCNPJ, validateCNPJ } from '../../algorithms/cnpjValidator.js'
import { calculateSaving } from '../../algorithms/savingCalculator.js'
import { routeCard } from '../../algorithms/approvalRouter.js'
import { formatCurrency } from '../../utils/formatters.js'
import { CATEGORIES } from '../../constants/categories.js'
import useAppStore from '../../store/useAppStore.js'

const BASELINE_TYPES = [
  { value: 'MPE',       desc: 'Micro/Pequeno Porte' },
  { value: 'Histórico', desc: 'Compras anteriores' },
  { value: 'Orçamento', desc: 'Cotação recebida' },
]
const PAYMENT_TERMS = ['7','14','21','28','30','45','60','90','120']

const EMPTY_FORM = {
  cnpj: '', fornecedor: '', razaoSocial: '',
  categoria: '', tipoBaseline: 'Histórico',
  valorBaseline: '', valorFinal: '',
  moeda: 'BRL', prazoPagamento: '30', tipoSaving: 'Hard',
  vpl: { cashFlows: [], discountRate: 12 },
  justificativa: '',
  dynamicFields: {},
}

function SectionHeader({ icon: Icon, title, locked }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon size={14} className="text-gray-500" />
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      {locked && (
        <span className="ml-auto flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Lock size={10} />Imutável
        </span>
      )}
    </div>
  )
}

function validateAll(data, isLocked, customFields = []) {
  const errors = {}
  if (!data.cnpj) errors.cnpj = 'Obrigatório'
  else if (!validateCNPJ(data.cnpj).valid) errors.cnpj = validateCNPJ(data.cnpj).error
  if (!data.razaoSocial?.trim()) errors.razaoSocial = 'Obrigatório'
  if (!data.categoria) errors.categoria = 'Selecione uma categoria'
  if (!data.tipoBaseline) errors.tipoBaseline = 'Selecione'
  if (!isLocked) {
    if (!data.valorBaseline || parseFloat(data.valorBaseline) <= 0) errors.valorBaseline = 'Obrigatório'
    if (!data.valorFinal || parseFloat(data.valorFinal) <= 0) errors.valorFinal = 'Obrigatório'
  }
  if (!data.justificativa?.trim() || data.justificativa.trim().length < 20)
    errors.justificativa = 'Mínimo 20 caracteres'
  // Validate required dynamic fields
  customFields.filter(f => f.required).forEach(f => {
    const val = data.dynamicFields?.[f.key]
    const isEmpty = val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0)
    if (isEmpty) errors[`dynamic_${f.key}`] = 'Obrigatório'
  })
  return errors
}

export function ProcurementForm() {
  const isFormOpen    = useAppStore(s => s.uiState.isFormOpen)
  const editingCardId = useAppStore(s => s.uiState.editingCardId)
  const cards         = useAppStore(s => s.cards)
  const closeForm     = useAppStore(s => s.closeForm)
  const createCard    = useAppStore(s => s.createCard)
  const updateCard    = useAppStore(s => s.updateCard)
  const currentUser   = useAppStore(s => s.currentUser)
  const customFields  = useAppStore(s => s.customFields)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [cnpjTouched, setCnpjTouched] = useState(false)

  const editingCard = editingCardId ? cards.find(c => c.id === editingCardId) : null
  const isAdmin = currentUser?.role === 'admin'

  // Financial fields are locked when card is in approval AND user is not admin
  const isLocked = editingCard ? (editingCard.isLocked && !isAdmin) : false

  // Is current user the owner (or admin)?
  const isOwnerOrAdmin = isAdmin || !editingCard || editingCard.compradorId === currentUser?.id
  const isReadOnly = !isOwnerOrAdmin || (editingCard && editingCard.isLocked && !isAdmin)

  useEffect(() => {
    if (isFormOpen) {
      setErrors({})
      setCnpjTouched(false)
      if (editingCard) {
        setForm({
          cnpj: editingCard.cnpj || '',
          fornecedor: editingCard.fornecedor || '',
          razaoSocial: editingCard.razaoSocial || '',
          categoria: editingCard.categoria || '',
          tipoBaseline: editingCard.tipoBaseline || 'Histórico',
          valorBaseline: editingCard.valorBaseline || '',
          valorFinal: editingCard.valorFinal || '',
          moeda: editingCard.moeda || 'BRL',
          prazoPagamento: editingCard.prazoPagamento || '30',
          tipoSaving: editingCard.tipoSaving || 'Hard',
          vpl: editingCard.vpl || { cashFlows: [], discountRate: 12 },
          justificativa: editingCard.justificativa || '',
          dynamicFields: editingCard.dynamicFields || {},
        })
      } else {
        setForm({ ...EMPTY_FORM })
      }
    }
  }, [isFormOpen, editingCardId])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleSubmit = async () => {
    if (isReadOnly) { closeForm(); return }
    const errs = validateAll(form, isLocked, customFields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        valorBaseline: isLocked ? (editingCard?.valorBaseline || 0) : parseFloat(form.valorBaseline),
        valorFinal:    isLocked ? (editingCard?.valorFinal    || 0) : parseFloat(form.valorFinal),
        comprador:     editingCard?.comprador  || currentUser.name,
        compradorId:   editingCard?.compradorId || currentUser.id,
      }
      if (editingCardId) updateCard(editingCardId, payload)
      else createCard(payload)
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const saving_ = calculateSaving(form.valorBaseline, form.valorFinal, form.tipoSaving)
  const route   = form.valorFinal ? routeCard(form.valorFinal, form.moeda) : null

  const title = editingCardId
    ? (isReadOnly ? `Visualizar ${editingCard?.cardId}` : `Editar ${editingCard?.cardId}`)
    : 'Novo Processo de Compra'

  return (
    <Modal isOpen={isFormOpen} onClose={closeForm} title={title} size="xl">
      {/* Scrollable body */}
      <div className="px-6 py-5 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>

        {/* Lock banner */}
        {isLocked && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <Lock size={15} className="flex-shrink-0" />
            <div>
              <p className="font-semibold">Card em fluxo de aprovação — campos financeiros bloqueados</p>
              <p className="text-xs text-amber-600 mt-0.5">Valores de Baseline e Saving travados para garantir compliance. Somente Admin pode alterar.</p>
            </div>
          </div>
        )}
        {isReadOnly && !isLocked && editingCard && (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <Eye size={15} className="flex-shrink-0" />
            <p>Este card pertence a <strong>{editingCard.comprador}</strong>. Você está no modo <strong>Somente Leitura</strong>.</p>
          </div>
        )}

        {/* ═══ SEÇÃO 1: FORNECEDOR ═══ */}
        <section>
          <SectionHeader icon={Building2} title="Dados do Fornecedor" />
          {!isReadOnly && !isLocked && (
            <div className="mb-4">
              <OcrUploader onParsed={(d) => {
                if (d.cnpj) set('cnpj', d.cnpj)
                if (d.razaoSocial) set('razaoSocial', d.razaoSocial)
                if (d.fornecedor) set('fornecedor', d.fornecedor)
              }} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="CNPJ *"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              maxLength={18}
              disabled={isReadOnly}
              onChange={(e) => set('cnpj', maskCNPJ(e.target.value))}
              onBlur={() => setCnpjTouched(true)}
              error={
                errors.cnpj ||
                (cnpjTouched && form.cnpj && !validateCNPJ(form.cnpj).valid
                  ? validateCNPJ(form.cnpj).error : null)
              }
              hint={cnpjTouched && form.cnpj && validateCNPJ(form.cnpj).valid ? '✓ CNPJ válido' : undefined}
            />
            <Input
              label="Nome Fantasia"
              placeholder="Ex: TechSupply"
              value={form.fornecedor}
              disabled={isReadOnly}
              onChange={(e) => set('fornecedor', e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Input
              label="Razão Social *"
              placeholder="Nome completo conforme CNPJ"
              value={form.razaoSocial}
              disabled={isReadOnly}
              onChange={(e) => set('razaoSocial', e.target.value)}
              error={errors.razaoSocial}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select
              label="Categoria *"
              value={form.categoria}
              disabled={isReadOnly}
              onChange={(e) => set('categoria', e.target.value)}
              error={errors.categoria}
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo de Baseline *</label>
              <div className="flex gap-2">
                {BASELINE_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && set('tipoBaseline', bt.value)}
                    className={`flex-1 py-2 px-2 rounded-xl border-2 text-center transition-all text-xs
                      ${form.tipoBaseline === bt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } ${isReadOnly ? 'opacity-60 cursor-default' : ''}`}
                  >
                    <p className="font-semibold">{bt.value}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{bt.desc}</p>
                  </button>
                ))}
              </div>
              {errors.tipoBaseline && <p className="text-xs text-red-600 mt-1">{errors.tipoBaseline}</p>}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO 2: FINANCEIRO ═══ */}
        <section>
          <SectionHeader icon={DollarSign} title="Dados Financeiros" locked={isLocked} />

          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Valor Baseline */}
            {isLocked ? (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor Baseline</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm">
                  <Lock size={11} className="text-gray-400" />
                  <span className="font-semibold text-gray-800">{formatCurrency(form.valorBaseline, form.moeda)}</span>
                </div>
              </div>
            ) : (
              <Input
                label="Valor Baseline *"
                type="number" placeholder="0,00" min="0" step="0.01"
                value={form.valorBaseline}
                disabled={isReadOnly}
                onChange={(e) => set('valorBaseline', e.target.value)}
                error={errors.valorBaseline}
                hint="Referência de preço"
              />
            )}

            {/* Valor Final */}
            {isLocked ? (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor Final</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm">
                  <Lock size={11} className="text-gray-400" />
                  <span className="font-semibold text-gray-800">{formatCurrency(form.valorFinal, form.moeda)}</span>
                </div>
              </div>
            ) : (
              <Input
                label="Valor Final *"
                type="number" placeholder="0,00" min="0" step="0.01"
                value={form.valorFinal}
                disabled={isReadOnly}
                onChange={(e) => set('valorFinal', e.target.value)}
                error={errors.valorFinal}
                hint="Valor negociado"
              />
            )}

            <Select
              label="Moeda"
              value={form.moeda}
              disabled={isReadOnly}
              onChange={(e) => set('moeda', e.target.value)}
            >
              <option value="BRL">BRL — Real</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select
              label="Prazo de Pagamento"
              value={form.prazoPagamento}
              disabled={isReadOnly}
              onChange={(e) => set('prazoPagamento', e.target.value)}
            >
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t} dias</option>)}
              <option value="A vista">À vista</option>
            </Select>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo de Saving *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isReadOnly || isLocked}
                  onClick={() => !isReadOnly && !isLocked && set('tipoSaving', 'Hard')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${form.tipoSaving === 'Hard' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                    ${(isReadOnly || isLocked) ? 'opacity-60 cursor-default' : ''}`}
                >
                  <TrendingDown size={14} />Hard
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || isLocked}
                  onClick={() => !isReadOnly && !isLocked && set('tipoSaving', 'Avoidance')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${form.tipoSaving === 'Avoidance' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                    ${(isReadOnly || isLocked) ? 'opacity-60 cursor-default' : ''}`}
                >
                  <Shield size={14} />Avoidance
                </button>
              </div>
            </div>
          </div>

          {/* Live saving preview */}
          {form.valorBaseline && form.valorFinal && (
            <div className={`rounded-xl px-4 py-3 border-2 ${saving_.isNegative ? 'border-orange-300 bg-orange-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {saving_.isNegative
                    ? <AlertTriangle size={15} className="text-orange-500" />
                    : <TrendingDown size={15} className="text-emerald-600" />
                  }
                  <span className={`text-sm font-semibold ${saving_.isNegative ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {saving_.isNegative ? 'Custo Acima do Baseline' : 'Preview do Saving'}
                  </span>
                </div>
                <div className="flex gap-6 ml-auto">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Saving ($)</p>
                    <p className={`text-sm font-bold ${saving_.isNegative ? 'text-orange-600' : 'text-emerald-700'}`}>
                      {formatCurrency(saving_.savingValue, form.moeda)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Saving (%)</p>
                    <p className={`text-sm font-bold ${saving_.isNegative ? 'text-orange-600' : 'text-emerald-700'}`}>
                      {saving_.savingPercent !== null ? `${saving_.savingPercent.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  {route && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Alçada</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${route.badge}`}>
                        {route.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══ SEÇÃO 3: VPL ═══ */}
        <section>
          <SectionHeader icon={BarChart2} title="Análise VPL (Opcional)" />
          <VplBuilder
            cashFlows={form.vpl?.cashFlows || []}
            discountRate={form.vpl?.discountRate || 12}
            moeda={form.moeda || 'BRL'}
            disabled={isReadOnly}
            onChange={(vplData) => set('vpl', vplData)}
          />
        </section>

        {/* ═══ SEÇÃO 4: CAMPOS ADICIONAIS ═══ */}
        {customFields && customFields.length > 0 && (
          <section>
            <SectionHeader icon={Sliders} title="Campos Adicionais" />
            <DynamicFields
              fields={customFields}
              values={form.dynamicFields || {}}
              disabled={isReadOnly}
              errors={errors}
              onChange={(key, value) => {
                setForm(prev => ({
                  ...prev,
                  dynamicFields: { ...prev.dynamicFields, [key]: value },
                }))
                if (errors[`dynamic_${key}`]) setErrors(prev => ({ ...prev, [`dynamic_${key}`]: null }))
              }}
            />
          </section>
        )}

        {/* ═══ SEÇÃO 5: JUSTIFICATIVA ═══ */}
        <section>
          <SectionHeader icon={MessageSquare} title="Justificativa da Compra" />
          <textarea
            rows={4}
            disabled={isReadOnly}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${errors.justificativa ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
              ${isReadOnly ? 'bg-gray-50 cursor-default' : 'bg-white'}`}
            placeholder="Descreva a necessidade, critérios de seleção do fornecedor e benefícios esperados..."
            value={form.justificativa}
            onChange={(e) => set('justificativa', e.target.value)}
          />
          {errors.justificativa && <p className="text-xs text-red-600 mt-1">{errors.justificativa}</p>}
          <p className="text-xs text-gray-400 mt-1">{(form.justificativa || '').length} caracteres</p>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <div className="text-xs text-gray-400">
          {editingCard && <span>ID: <span className="font-mono font-bold text-blue-600">{editingCard.cardId}</span></span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={closeForm}>
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0D3125' }}
            >
              {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
              {editingCardId ? 'Salvar Alterações' : 'Criar Processo'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
