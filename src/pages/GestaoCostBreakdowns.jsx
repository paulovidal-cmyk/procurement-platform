import { useState, useMemo } from 'react'
import { X, Plus, Edit2, Trash2, Package, ChevronRight,
         Building2, Flag, Activity, Layers, SlidersHorizontal, Info } from 'lucide-react'
import useRaioXStore from '../store/useRaioXStore.js'
import { calcularBreakdown, fmtPct, inflacaoReal } from '../algorithms/raiox.js'
import { CATEGORIAS } from '../data/categorias.js'

// ── helpers ─────────────────────────────────────────────────────────────────

const BADGE_COLOR = v =>
  v === null || v === undefined || isNaN(v) ? '#6b7280' :
  v < 0 ? '#10b981' : v > 0 ? '#ef4444' : '#6b7280'

const BADGE_BG = v =>
  v === null || v === undefined || isNaN(v) ? 'rgba(107,114,128,0.1)' :
  v < 0 ? 'rgba(16,185,129,0.12)' : v > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

/** Inflações congeladas na criação (com fallback p/ pacotes legados sem snapshot). */
function frozen(pkg, data) {
  if (pkg.inflacaoFinal != null) {
    return { original: pkg.inflacaoOriginal, ajustada: pkg.inflacaoAjustada, final: pkg.inflacaoFinal }
  }
  const r = calcularBreakdown(pkg.linhas, data, pkg.margem)
  return { original: r.variacaoOriginal, ajustada: r.variacaoBase, final: r.variacaoFinal }
}

// ── Quadro executivo: Inflação Stone + por categoria ──────────────────────────

function KpiStone({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl p-4 border" style={{
      borderColor: accent ? 'rgba(0,210,106,0.35)' : 'rgba(13,49,37,0.1)',
      background:  accent ? 'rgba(0,210,106,0.06)' : 'white',
    }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-500 mb-1">
        {Icon && <Icon size={12} style={{ color: accent ? '#00B85B' : '#0D3125' }} />} {label}
      </div>
      <p className="text-2xl font-black tabular-nums leading-none" style={{ color: BADGE_COLOR(value) }}>{fmtPct(value)}</p>
    </div>
  )
}

/** Variação relativa entre prevista e real (%). Null se faltar dado ou prevista ≈ 0. */
function variacaoRel(prev, real) {
  if (prev == null || real == null) return null
  if (Math.abs(prev) < 0.05) return null
  return (real - prev) / Math.abs(prev) * 100
}

/** Ícone "i" com tooltip (hover) explicando os tipos de inflação. */
function InfoInflacoes() {
  return (
    <span className="relative group inline-flex items-center">
      <Info size={13} className="text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 top-6 z-30 hidden group-hover:block w-72 p-3 rounded-xl bg-white border shadow-xl text-[11px] leading-snug text-gray-600"
        style={{ borderColor: 'rgba(13,49,37,0.12)' }}>
        <p className="mb-1.5"><b style={{ color: '#0D3125' }}>Original</b> — indicadores ponderados, <b>sem</b> override e <b>sem</b> margem/desafio.</p>
        <p className="mb-1.5"><b style={{ color: '#0D3125' }}>Prevista</b> — <b>com</b> override e margem/desafio. Congelada na criação do pacote.</p>
        <p><b style={{ color: '#0D3125' }}>Real</b> — recalculada com a base de indicadores <b>atual</b>, sem override e sem margem.</p>
      </div>
    </span>
  )
}

function ResumoExecutivo({ rows, selectedCat, onSelectCat }) {
  const stoneFinal = avg(rows.map(r => r.final))
  const stoneReal  = avg(rows.map(r => r.real))
  const delta = (stoneReal ?? 0) - (stoneFinal ?? 0)

  // Apenas categorias COM pacotes (oculta as vazias).
  const byCat = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const cat = r.pkg.categoria || 'Sem categoria'
      if (!map.has(cat)) map.set(cat, { finals: [], reals: [] })
      map.get(cat).finals.push(r.final)
      map.get(cat).reals.push(r.real)
    }
    return [...map.entries()]
      .map(([categoria, d]) => ({ categoria, final: avg(d.finals), real: avg(d.reals), count: d.finals.length }))
      .sort((a, b) => (b.final ?? 0) - (a.final ?? 0))
  }, [rows])

  const COLS = 'grid grid-cols-[1fr_52px_52px_60px] gap-x-2 items-center'

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6" style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={16} style={{ color: '#00B85B' }} />
        <h3 className="text-sm font-bold" style={{ color: '#0D3125' }}>Inflação Stone</h3>
        <InfoInflacoes />
        <span className="text-[11px] text-gray-400">média de {rows.length} cost breakdown{rows.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* KPIs globais — empilhados à esquerda */}
        <div className="space-y-3">
          <KpiStone icon={Flag} label="Prevista" value={stoneFinal} accent />
          <KpiStone icon={Activity} label="Real" value={stoneReal} />
          <KpiStone label="Δ Real − Prevista" value={delta} />
        </div>

        {/* Por categoria — lista filtrável à direita */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Inflação por categoria</p>
            {selectedCat && (
              <button onClick={() => onSelectCat(null)} className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900">
                limpar filtro
              </button>
            )}
          </div>
          {byCat.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-gray-300 text-xs">sem dados</div>
          ) : (
            <>
              <div className={`${COLS} px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400 border-b`}
                style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
                <span>Categoria</span>
                <span className="text-right">Prev.</span>
                <span className="text-right">Real</span>
                <span className="text-right">Var.</span>
              </div>
              {byCat.map(c => {
                const v = variacaoRel(c.final, c.real)
                const isActive = selectedCat === c.categoria
                return (
                  <button key={c.categoria} onClick={() => onSelectCat(isActive ? null : c.categoria)}
                    className={`${COLS} w-full px-2 py-[5px] text-xs border-b last:border-0 rounded-md transition-colors ${isActive ? '' : 'hover:bg-gray-50'}`}
                    style={{ borderColor: 'rgba(13,49,37,0.05)', background: isActive ? 'rgba(0,210,106,0.1)' : 'transparent' }}>
                    <span className="truncate font-medium text-left" style={{ color: '#0D3125' }} title={c.categoria}>{c.categoria}</span>
                    <span className="text-right tabular-nums" style={{ color: c.final != null ? BADGE_COLOR(c.final) : '#9ca3af' }}>
                      {c.final != null ? fmtPct(c.final, 1) : '—'}
                    </span>
                    <span className="text-right tabular-nums" style={{ color: c.real != null ? BADGE_COLOR(c.real) : '#9ca3af' }}>
                      {c.real != null ? fmtPct(c.real, 1) : '—'}
                    </span>
                    <span className="text-right tabular-nums font-bold" style={{ color: v != null ? BADGE_COLOR(v) : '#9ca3af' }}>
                      {v != null ? fmtPct(v, 1) : '—'}
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Package Card (foco: Final vs Real) ────────────────────────────────────────

function PacoteCard({ pkg, final, real, onDetails, onEdit, onDelete }) {
  const delta = (real ?? 0) - (final ?? 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md"
      style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black truncate" style={{ color: '#0D3125' }}>
              {pkg.subcategoria || 'Sem nome'}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
              {pkg.fornecedor || 'Fornecedor não informado'}
            </p>
          </div>
          {pkg.categoria && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(13,49,37,0.06)', color: '#0D3125' }}>
              {pkg.categoria}
            </span>
          )}
        </div>
      </div>

      {/* Final vs Real */}
      <div className="px-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border" style={{ borderColor: 'rgba(0,210,106,0.3)', background: 'rgba(0,210,106,0.05)' }}>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">
            <Flag size={10} style={{ color: '#00B85B' }} /> Prevista
          </div>
          <p className="text-xl font-black tabular-nums" style={{ color: BADGE_COLOR(final) }}>{fmtPct(final)}</p>
        </div>
        <div className="rounded-xl p-3 border" style={{ borderColor: 'rgba(13,49,37,0.1)' }}>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">
            <Activity size={10} style={{ color: '#0D3125' }} /> Real
          </div>
          <p className="text-xl font-black tabular-nums" style={{ color: BADGE_COLOR(real) }}>{fmtPct(real)}</p>
        </div>
      </div>

      {/* Δ */}
      <div className="px-5 pt-2.5">
        <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ background: BADGE_BG(delta) }}>
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Δ Real − Prevista</span>
          <span className="text-xs font-black tabular-nums" style={{ color: BADGE_COLOR(delta) }}>
            {fmtPct(delta)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
        <p className="text-[10px] text-gray-400">
          {pkg.updatedAt ? `Atualizado ${fmtDate(pkg.updatedAt)}` : `Criado ${fmtDate(pkg.createdAt)}`}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(pkg.id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all" title="Excluir">
            <Trash2 size={12} />
          </button>
          <button onClick={() => onEdit(pkg)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Editar">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDetails(pkg)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(13,49,37,0.06)', color: '#0D3125' }}>
            Detalhes <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function Drawer({ pkg, indicadoresData, onClose, onEdit }) {
  if (!pkg) return null

  const { linhasCalc, totalPeso, variacaoBase } =
    calcularBreakdown(pkg.linhas, indicadoresData, pkg.margem)
  const f = frozen(pkg, indicadoresData)
  const real = inflacaoReal(pkg.linhas, indicadoresData)
  const deltaFinalReal = real - f.final

  const FROZEN_CARDS = [
    { label: 'Original', value: f.original, icon: Layers,            desc: 'sem override/margem' },
    { label: 'Ajustada', value: f.ajustada, icon: SlidersHorizontal, desc: 'com override' },
    { label: 'Prevista', value: f.final,    icon: Flag,              desc: 'override + margem' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid rgba(13,49,37,0.1)' }}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(13,49,37,0.08)' }}>
          <div className="min-w-0 flex-1">
            <p className="font-black text-base truncate" style={{ color: '#0D3125' }}>{pkg.subcategoria || 'Sem nome'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.45)' }}>
              {[pkg.categoria, pkg.fornecedor].filter(Boolean).join(' · ') || 'Fornecedor não informado'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button onClick={() => onEdit(pkg)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,210,106,0.12)', color: '#0D9488' }}>
              <Edit2 size={12} /> Editar
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Final vs Real (destaque) */}
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Prevista (congelada) vs Real (atual)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3 text-center border" style={{ borderColor: 'rgba(0,210,106,0.35)', background: 'rgba(0,210,106,0.06)' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Prevista</p>
                <p className="text-xl font-black tabular-nums" style={{ color: BADGE_COLOR(f.final) }}>{fmtPct(f.final)}</p>
              </div>
              <div className="rounded-xl p-3 text-center bg-gray-50">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Real</p>
                <p className="text-xl font-black tabular-nums" style={{ color: BADGE_COLOR(real) }}>{fmtPct(real)}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: BADGE_BG(deltaFinalReal) }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Δ</p>
                <p className="text-xl font-black tabular-nums" style={{ color: BADGE_COLOR(deltaFinalReal) }}>
                  {fmtPct(deltaFinalReal)}
                </p>
              </div>
            </div>
          </div>

          {/* Inflações congeladas */}
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b" style={{ borderColor: 'rgba(13,49,37,0.06)' }}>
            {FROZEN_CARDS.map(c => {
              const Icon = c.icon
              return (
                <div key={c.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                    <Icon size={11} /> {c.label}
                  </div>
                  <p className="text-base font-black tabular-nums" style={{ color: BADGE_COLOR(c.value) }}>{fmtPct(c.value)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{c.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Composição (base atual) */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Composição · base atual</p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs min-w-[420px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Indicador', 'Tipo', 'Peso', 'VC', 'VL', 'VP'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasCalc.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2 font-semibold" style={{ color: '#0D3125' }}>{l.indicador}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: l.tipoVariacao === 'ponta_a_ponta' ? 'rgba(0,210,106,0.1)' : 'rgba(96,165,250,0.1)',
                            color: l.tipoVariacao === 'ponta_a_ponta' ? '#0D9488' : '#3B82F6',
                          }}>
                          {l.tipoVariacao === 'ponta_a_ponta' ? 'PaP' : 'MM12'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700 font-semibold">{l.peso}%</td>
                      <td className="px-3 py-2 font-semibold" style={{ color: BADGE_COLOR(l.vc) }}>{fmtPct(l.vc)}</td>
                      <td className="px-3 py-2 font-semibold" style={{ color: BADGE_COLOR(l.vl) }}>
                        {fmtPct(l.vl)}
                        {l.override !== '' && l.override !== null && (
                          <span className="text-[9px] text-blue-400 ml-1">ovr</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-bold" style={{ color: BADGE_COLOR(l.vp) }}>{fmtPct(l.vp)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                    <td className="px-3 py-2 font-bold text-gray-700">{totalPeso}%</td>
                    <td colSpan={2} />
                    <td className="px-3 py-2 font-black" style={{ color: BADGE_COLOR(variacaoBase) }}>{fmtPct(variacaoBase)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              A composição reflete a base de indicadores <b>atual</b>. As inflações Original/Ajustada/Prevista acima ficaram congeladas na criação do pacote.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function GestaoCostBreakdowns({ onNew, onEdit }) {
  const indicadoresData = useRaioXStore(s => s.indicadoresData)
  const pacotes         = useRaioXStore(s => s.pacotes)
  const deletePacote    = useRaioXStore(s => s.deletePacote)

  const [selected, setSelected] = useState(null)
  const [catFiltro, setCatFiltro] = useState(null)

  const rows = useMemo(() => pacotes.map(pkg => {
    const f = frozen(pkg, indicadoresData)
    const real = inflacaoReal(pkg.linhas, indicadoresData)
    return { pkg, final: f.final, real }
  }), [pacotes, indicadoresData])

  const filteredRows = catFiltro
    ? rows.filter(r => (r.pkg.categoria || 'Sem categoria') === catFiltro)
    : rows

  const handleDelete = (id) => {
    if (selected?.id === id) setSelected(null)
    deletePacote(id)
  }

  const handleEdit = (pkg) => {
    setSelected(null)
    onEdit(pkg)
  }

  return (
    <div className="h-full overflow-y-auto relative" style={{ background: '#e9f3f0' }}>
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black" style={{ color: '#0D3125' }}>Gestão de Breakdowns</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,49,37,0.4)' }}>
              {pacotes.length} pacote{pacotes.length !== 1 ? 's' : ''} · comparação Inflação Prevista vs Real
            </p>
          </div>
          <button onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#0D3125' }}>
            <Plus size={14} /> Novo Pacote
          </button>
        </div>

        {/* Empty state */}
        {pacotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,49,37,0.06)' }}>
              <Package size={28} style={{ color: 'rgba(13,49,37,0.25)' }} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0D3125' }}>Nenhum pacote cadastrado</p>
            <p className="text-xs mb-5" style={{ color: 'rgba(13,49,37,0.45)' }}>Crie seu primeiro cost breakdown para começar.</p>
            <button onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#00D26A' }}>
              <Plus size={14} /> Criar Primeiro Pacote
            </button>
          </div>
        )}

        {/* Quadro executivo + breakdowns */}
        {pacotes.length > 0 && (
          <>
            <ResumoExecutivo rows={rows} selectedCat={catFiltro} onSelectCat={setCatFiltro} />

            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold" style={{ color: '#0D3125' }}>Breakdowns cadastrados</h3>
              {catFiltro && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,210,106,0.12)', color: '#0D9488' }}>
                  {catFiltro}
                  <button onClick={() => setCatFiltro(null)} className="hover:opacity-70" title="Remover filtro">
                    <X size={11} />
                  </button>
                </span>
              )}
              <span className="text-xs text-gray-400">
                {filteredRows.length} de {rows.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRows.map(({ pkg, final, real }) => (
                <PacoteCard
                  key={pkg.id}
                  pkg={pkg}
                  final={final}
                  real={real}
                  onDetails={setSelected}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        pkg={selected}
        indicadoresData={indicadoresData}
        onClose={() => setSelected(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
