import { useState, useMemo } from 'react'
import { Building2, Newspaper, X, Filter, ShieldCheck, TrendingUp, Package } from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — estrutura compatível com payload JSON do Google Sheets / n8n
// ─────────────────────────────────────────────────────────────────────────────
const mockData = [
  {
    fornecedor: 'Unimed',
    categoria: 'Saúde',
    subcategoria: 'Plano de Saúde',
    cnpj: '45.445.516/0001-33',
    spend: 3450000,
    pedidos: 4,
    saudeFinanceira: 8.1,
    reputacao: 7.5,
    riscoInterno: 6.8,
    notaGeral: 7.47,
    evidencia: 'Unimed investigada por reajuste acima do permitido pela ANS em 2024',
  },
  {
    fornecedor: 'Localiza Fleet',
    categoria: 'Mobilidade',
    subcategoria: 'Gestão de Frotas',
    cnpj: '16.670.085/0001-55',
    spend: 2100000,
    pedidos: 87,
    saudeFinanceira: 9.0,
    reputacao: 8.5,
    riscoInterno: 9.1,
    notaGeral: 8.87,
    evidencia: 'Localiza Fleet anuncia expansão da frota elétrica no plano estratégico 2025',
  },
  {
    fornecedor: 'Salesforce',
    categoria: 'Software',
    subcategoria: 'CRM',
    cnpj: '19.206.848/0001-50',
    spend: 1200000,
    pedidos: 12,
    saudeFinanceira: 9.2,
    reputacao: 8.8,
    riscoInterno: 8.5,
    notaGeral: 8.83,
    evidencia: 'Salesforce reporta crescimento de receita de 11% no Q4 FY2024',
  },
  {
    fornecedor: 'ILGJ Logística',
    categoria: 'Logística',
    subcategoria: 'Transporte',
    cnpj: '12.345.678/0001-90',
    spend: 850000,
    pedidos: 145,
    saudeFinanceira: 6.5,
    reputacao: 5.8,
    riscoInterno: 7.2,
    notaGeral: 6.5,
    evidencia: 'ILGJ Logística com histórico de atrasos recorrentes na região Sul do país',
  },
  {
    fornecedor: 'Brasoftware',
    categoria: 'Software',
    subcategoria: 'Licenças',
    cnpj: '00.585.012/0001-35',
    spend: 680000,
    pedidos: 28,
    saudeFinanceira: 7.8,
    reputacao: 8.2,
    riscoInterno: 7.5,
    notaGeral: 7.83,
    evidencia: 'Brasoftware expande portfólio com novas parcerias Microsoft e Adobe',
  },
  {
    fornecedor: 'IPNET',
    categoria: 'TI',
    subcategoria: 'Conectividade',
    cnpj: '07.450.604/0001-89',
    spend: 560000,
    pedidos: 18,
    saudeFinanceira: 8.5,
    reputacao: 8.0,
    riscoInterno: 8.3,
    notaGeral: 8.27,
    evidencia: 'IPNET obtém certificação ISO 27001 para serviços de conectividade corporativa',
  },
  {
    fornecedor: 'Salcomp',
    categoria: 'Hardware',
    subcategoria: 'Carregadores',
    cnpj: '05.090.249/0001-45',
    spend: 420000,
    pedidos: 320,
    saudeFinanceira: 7.2,
    reputacao: 6.8,
    riscoInterno: 7.0,
    notaGeral: 7.0,
    evidencia: 'Salcomp enfrenta restrições de semicondutores que impactam lead time de entrega',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtCurrencyCompact = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)

const scoreBadgeStyle = (s) => {
  if (s >= 8.5) return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
  if (s >= 7.0) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
  return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
}

const notaGeralBg = (s) => {
  if (s >= 8.5) return 'bg-emerald-500 shadow-emerald-200/60'
  if (s >= 7.0) return 'bg-amber-500 shadow-amber-200/60'
  return 'bg-rose-500 shadow-rose-200/60'
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SupplierRiskShield({ data = mockData }) {
  const [filters, setFilters] = useState({ categoria: '', subcategoria: '', fornecedor: '' })

  // ── Filter option lists (cascading) ──────────────────────────────────────
  const categorias = useMemo(
    () => [...new Set(data.map((d) => d.categoria))].sort(),
    [data],
  )

  const subcategorias = useMemo(
    () =>
      [...new Set(
        data
          .filter((d) => !filters.categoria || d.categoria === filters.categoria)
          .map((d) => d.subcategoria),
      )].sort(),
    [data, filters.categoria],
  )

  const fornecedores = useMemo(
    () =>
      [...new Set(
        data
          .filter(
            (d) =>
              (!filters.categoria    || d.categoria    === filters.categoria) &&
              (!filters.subcategoria || d.subcategoria === filters.subcategoria),
          )
          .map((d) => d.fornecedor),
      )].sort(),
    [data, filters.categoria, filters.subcategoria],
  )

  // ── Filtered + sorted by spend desc ─────────────────────────────────────
  const filtered = useMemo(
    () =>
      data
        .filter(
          (d) =>
            (!filters.categoria    || d.categoria    === filters.categoria) &&
            (!filters.subcategoria || d.subcategoria === filters.subcategoria) &&
            (!filters.fornecedor   || d.fornecedor   === filters.fornecedor),
        )
        .sort((a, b) => b.spend - a.spend),
    [data, filters],
  )

  // ── Radar averages (recalculated on every filter change) ─────────────────
  const radarData = useMemo(() => {
    if (!filtered.length)
      return [
        { subject: 'Saúde Financeira', value: 0 },
        { subject: 'Reputação',        value: 0 },
        { subject: 'Risco Interno',    value: 0 },
      ]
    const avg = (key) => filtered.reduce((s, d) => s + d[key], 0) / filtered.length
    return [
      { subject: 'Saúde Financeira', value: +avg('saudeFinanceira').toFixed(2) },
      { subject: 'Reputação',        value: +avg('reputacao').toFixed(2) },
      { subject: 'Risco Interno',    value: +avg('riscoInterno').toFixed(2) },
    ]
  }, [filtered])

  const notaMediaGeral = useMemo(
    () =>
      filtered.length
        ? +(filtered.reduce((s, d) => s + d.notaGeral, 0) / filtered.length).toFixed(1)
        : 0,
    [filtered],
  )

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const spendTotal   = useMemo(() => filtered.reduce((s, d) => s + d.spend,   0), [filtered])
  const pedidosTotal = useMemo(() => filtered.reduce((s, d) => s + d.pedidos, 0), [filtered])

  // ── Filter handlers ───────────────────────────────────────────────────────
  const setCategoria    = (v) => setFilters({ categoria: v, subcategoria: '', fornecedor: '' })
  const setSubcategoria = (v) => setFilters((p) => ({ ...p, subcategoria: v, fornecedor: '' }))
  const setFornecedor   = (v) => setFilters((p) => ({ ...p, fornecedor: v }))
  const clearFilters    = ()  => setFilters({ categoria: '', subcategoria: '', fornecedor: '' })

  const hasFilters = filters.categoria || filters.subcategoria || filters.fornecedor

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto" style={{ background: '#e9f3f0' }}>
      <div className="p-6 space-y-5">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: '#10CB9A' }}>
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none" style={{ color: '#0D3125' }}>
              Supplier Risk Shield
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#4a7a68' }}>
              Análise de risco e performance · Base de fornecedores
            </p>
          </div>
        </div>

        {/* ── Analytical Header — Grid 1:2 ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* LEFT — Radar Chart (1 col) ─────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Perfil de Risco Consolidado
            </p>

            {/* Radar wrapper — relative to anchor the floating bubble */}
            <div className="relative flex-1" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={radarData}
                  margin={{ top: 20, right: 44, bottom: 20, left: 44 }}
                >
                  <PolarGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: '#64748b',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tickCount={6}
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#10CB9A"
                    fill="#10CB9A"
                    fillOpacity={0.18}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10CB9A', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#0aaf85' }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Floating central score bubble */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg ${notaGeralBg(notaMediaGeral)}`}
                >
                  <span className="text-white font-extrabold text-xl leading-none tracking-tight">
                    {notaMediaGeral.toFixed(1)}
                  </span>
                  <span className="text-white/70 text-[9px] leading-none mt-0.5 font-semibold uppercase tracking-wider">
                    média
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Control Panel (2 cols) ───────────────────────────────── */}
          <div className="col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">

            {/* Panel top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={13} style={{ color: '#10CB9A' }} />
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Painel de Controle
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-500 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-all"
                >
                  <X size={12} />
                  Limpar Filtros
                </button>
              )}
            </div>

            {/* Filter selects */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label:       'Categoria',
                  value:       filters.categoria,
                  onChange:    setCategoria,
                  options:     categorias,
                  placeholder: 'Todas as Categorias',
                },
                {
                  label:       'Subcategoria',
                  value:       filters.subcategoria,
                  onChange:    setSubcategoria,
                  options:     subcategorias,
                  placeholder: 'Todas as Subcategorias',
                },
                {
                  label:       'Fornecedor',
                  value:       filters.fornecedor,
                  onChange:    setFornecedor,
                  options:     fornecedores,
                  placeholder: 'Todos os Fornecedores',
                },
              ].map(({ label, value, onChange, options, placeholder }) => (
                <div key={label}>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    {label}
                  </label>
                  <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none cursor-pointer"
                    style={{ '--tw-ring-color': 'rgba(16,203,154,0.4)' }}
                  >
                    <option value="">{placeholder}</option>
                    {options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3 mt-auto">
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Building2 size={11} className="text-slate-400" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Fornecedores
                  </p>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: '#0D3125' }}>{filtered.length}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp size={11} className="text-slate-400" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Spend Total
                  </p>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: '#0D3125' }}>{fmtCurrencyCompact(spendTotal)}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Package size={11} className="text-slate-400" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Total Pedidos
                  </p>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: '#0D3125' }}>
                  {pedidosTotal.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Suppliers Table ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Table header bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Performance da Base · Ordenado por Maior Spend
            </p>
            <span className="text-xs text-slate-400">
              {filtered.length} fornecedor{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  {[
                    { label: 'Fornecedor',  cls: 'text-left pl-6'   },
                    { label: 'Categoria',   cls: 'text-left'        },
                    { label: 'Saúde Fin.',  cls: 'text-center'      },
                    { label: 'Reputação',   cls: 'text-center'      },
                    { label: 'Risco Int.',  cls: 'text-center'      },
                    { label: 'Nota Geral',  cls: 'text-center'      },
                    { label: 'Spend',       cls: 'text-right'       },
                    { label: 'Pedidos',     cls: 'text-center'      },
                    { label: 'Evidência',   cls: 'text-left pr-6'   },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.cnpj}
                    className="border-t border-slate-50 hover:bg-emerald-50/20 transition-colors"
                  >
                    {/* Fornecedor */}
                    <td className="pl-6 pr-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 size={14} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#0D3125' }}>
                            {item.fornecedor}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.cnpj}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoria / Subcategoria */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-700">{item.categoria}</p>
                      <p className="text-[11px] text-slate-400">{item.subcategoria}</p>
                    </td>

                    {/* Score badges — Saúde, Reputação, Risco Interno */}
                    {[item.saudeFinanceira, item.reputacao, item.riscoInterno].map((score, j) => (
                      <td key={j} className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${scoreBadgeStyle(score)}`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </td>
                    ))}

                    {/* Nota Geral */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-extrabold text-white shadow-lg ${notaGeralBg(item.notaGeral)}`}
                      >
                        {item.notaGeral.toFixed(1)}
                      </span>
                    </td>

                    {/* Spend */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold" style={{ color: '#0D3125' }}>
                        {fmtCurrency(item.spend)}
                      </span>
                    </td>

                    {/* Pedidos */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-slate-600">
                        {item.pedidos.toLocaleString('pt-BR')}
                      </span>
                    </td>

                    {/* Evidência */}
                    <td className="px-4 py-4 pr-6 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Newspaper size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-500 leading-snug">{item.evidencia}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3">
                <Building2 size={36} className="text-slate-200" strokeWidth={1.5} />
                <p className="text-sm font-medium text-slate-400">Nenhum fornecedor encontrado</p>
                <p className="text-xs text-slate-300">
                  Ajuste ou limpe os filtros para ver resultados
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
