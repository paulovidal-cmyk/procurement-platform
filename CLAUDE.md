# Stone Procurement Platform

Plataforma interna de procurement da Stone (Paulo Vidal, paulo.vidal@stone.com.br).
Hub integrado para: gestão de pedidos (Kanban), analytics, raio-X de preços (cost breakdowns) e gestão de risco de fornecedores.

**Repo:** `paulovidal-cmyk/procurement-platform`
**Deploy:** https://paulovidal-cmyk.github.io/procurement-platform/ (auto via Actions ao fazer push para `main`)

---

## Stack

- **React 18 + Vite** (build) — `npm run dev` / `npm run build`
- **Tailwind CSS** (estilos)
- **Zustand + persist** (state, localStorage)
- **Recharts** (gráficos: Line, Radar, etc.)
- **Lucide-react 0.441.0** (ícones — nem todos existem nesta versão; sempre verificar antes de importar nomes novos)
- **PapaParse** (parse CSV)
- **Inter** (tipografia, carregada do Google Fonts no `index.html`)

---

## Módulos atuais

| ID           | Página                        | Notas                                              |
|--------------|-------------------------------|----------------------------------------------------|
| `home`       | `Home.jsx`                    | Landing com hero saving + KPI strip + grid módulos |
| `kanban`     | `KanbanBoard.jsx`             | Fluxo de aprovação de pedidos                      |
| `analytics`  | `AnalyticsHub.jsx`            | Hub com submenu lateral (Categorias, etc.)         |
| `raiox`      | `RaioXPrecos.jsx`             | Hub: Criação de Pacotes / Gestão de Breakdowns     |
| `riskshield` | `SupplierRiskShield.jsx`      | Hub: Dashboard de Risco / Importar Dados           |
| `settings`   | `Settings.jsx`                | Admin only                                         |
| `help`       | `Help.jsx`                    |                                                    |

**Removido:** Leilão Eletrônico (apagado em 2026-05-06 por pedido do usuário).

---

## Design System

### Paleta — Stone (verde vibrante)

Consolidada após referência da Coinbase Dashboard + cores institucionais Stone.

| Token         | Hex          | Uso                                                |
|---------------|--------------|----------------------------------------------------|
| `--brand`     | `#00D26A`    | Verde Stone vibrante — CTAs, ativos, fills radar   |
| `--brand-hover` | `#00B85B`  | Hover do CTA                                       |
| `--brand-soft` | `#C2EAC9`   | Mint pastel — blocos de fundo amplos               |
| `--brand-tint` | `rgba(0,210,106,0.10)` | Active states sidebar/nav, hover sutil  |
| `--brand-dark` | `#003F1F`   | Verde profundo — ênfase forte                      |
| `--brand-deep` | `#0D3125`   | Verde-escuro institucional Stone                   |
| `--text` (ink) | `#0A0E0C`   | Texto principal (preto-quase)                      |
| `--text-muted` | `#5B6B66`   | Texto secundário                                   |
| `--text-subtle`| `#97A3A0`   | Texto terciário / labels uppercase                 |
| `--border` (line) | `rgba(15,23,23,0.08)` | Borda padrão                            |
| `--border-strong` | `rgba(15,23,23,0.14)` | Borda em hover/destaque                 |

**Cores semânticas de risco** (em `src/algorithms/risk.js`):
- ≥75 → verde `#10b981` ("Baixo")
- 50–74 → amarelo `#f59e0b` ("Médio")
- <50 → vermelho `#ef4444` ("Alto")
Helpers: `riskColor()`, `riskBg()`, `riskLabel()`

### Onde os tokens vivem

- `src/index.css` — CSS variables `:root { --brand: ... }` + reset Inter + scrollbar
- `tailwind.config.js` — classes `bg-brand`, `text-brand`, `text-ink`, `text-muted`, `text-subtle`, `border-line`, `border-line-strong`, `bg-brand-tint`, `bg-brand-soft`
- Tokens semânticos preferidos sobre cores inline; `style={{ color: '#10CB9A' }}` legado pode aparecer em páginas ainda não migradas

### Tipografia

- **Inter** com pesos 400/500/600/700/800/900
- `font-feature-settings: 'cv11','ss01','ss03'` aplicado globalmente
- `tabular-nums` em todos os números (KPIs, valores, scores)
- Big numbers: `text-[28px]` a `text-[42px]` `font-extrabold`/`font-black` `tracking-tight`

### Padrões visuais (estilo "Coinbase Dashboard")

- Fundo branco, **densidade alta**, executivo
- Cards: `rounded-2xl` ou `rounded-3xl` para hero, `border-line` (sem sombras pesadas)
- Botões primários: **pílula** `rounded-full`, `bg-brand text-white`
- Botões secundários: `rounded-full bg-gray-50` ou `rounded-xl bg-gray-50`
- Active states (nav): underline verde em vez de pill quando topbar; `bg-brand-tint text-brand` em sidebars
- Tabelas compactas: `text-xs` ou `text-[11px]`, `py-1.5` a `py-2`, headers `text-[9px]/10px uppercase tracking-wider`
- Badges/chips: `rounded-full px-2 py-0.5 text-[10-11px] font-bold`
- Avatares: `rounded-full` 28-32px com iniciais em `text-[10-11px] font-bold`

---

## Layout

### Shell global (`App.jsx`)

```
┌────────────────────────────────────────────────────┐
│ TopBar (h-14, branca, border-bottom)               │
│ [Logo] [Home Kanban Analytics Raio-X RiskShield] [🔔 ⚙ Avatar [+ Novo Processo]] │
├────────────────────────────────────────────────────┤
│ Main (flex-1, conteúdo da página atual)            │
│                                                    │
└────────────────────────────────────────────────────┘
```

- `TopBar` em `src/components/layout/TopBar.jsx` — branca, active item com underline `#00D26A`, CTA verde pílula
- `App.jsx` faz route por `currentPage` (Zustand) — sem React Router
- `KanbanBoard` recebe padding `p-3`; demais páginas controlam o próprio padding

### Padrão de hub (páginas com submenu lateral)

Quando uma página tem múltiplas sub-views, o submenu vai à **lateral esquerda** (não no topo).

Exemplos: `AnalyticsHub`, `RaioXPrecos`, `SupplierRiskShield`. Padrão:

```jsx
<div className="h-full flex">
  <aside className="w-56 border-r border-line bg-white">
    {SUBNAV.map(item => <NavBtn ... />)}
  </aside>
  <div className="flex-1 overflow-hidden">
    {active === 'a' ? <ViewA /> : <ViewB />}
  </div>
</div>
```

---

## State (Zustand stores)

| Store              | Arquivo                  | Persist key       | O que guarda                                      |
|--------------------|--------------------------|-------------------|---------------------------------------------------|
| `useAppStore`      | `store/useAppStore.js`   | (não persistido?) | currentPage, user, isAuthenticated, modals, notifs |
| `useRiskStore`     | `store/useRiskStore.js`  | `risk-store-v2`   | suppliers (15 seed) + hasCustomData               |
| `useRaioXStore`    | `store/useRaioXStore.js` | `raiox-store-v1`  | pacotes de cost breakdown                         |

**Atenção:** ao mudar shape de seed/store, **bumpar versão da key** (`v2 → v3`) para forçar reset do localStorage dos usuários — essa é a fonte mais comum de "tela vazia / colunas em branco".

---

## Convenções importantes

### Tabelas com drill-down

**Sempre inline (linha que expande), nunca drawer lateral.** Ver `RiskDashboard.jsx`:
```jsx
{rows.map(row => {
  const isOpen = expandedId === row.id
  return (
    <Fragment key={row.id}>
      <tr onClick={() => setExpandedId(isOpen ? null : row.id)} ...>...</tr>
      {isOpen && (
        <tr><td colSpan={N}><InlineDetail s={row} /></td></tr>
      )}
    </Fragment>
  )
})}
```

`<Fragment>` (importado do react) com `key`, NÃO `<>` que não aceita key.

### Tabelas sortáveis

Helper `sTH(label, col, classes)` (função, NÃO componente — caso contrário desmonta a thead):
- Strings → `localeCompare('pt-BR', { sensitivity: 'base' })`
- Números → diferença aritmética
- Ícones: `ArrowUpDown` (idle), `ArrowUp`/`ArrowDown` (ativo)

### Notícias / links externos em seed

Sempre **URLs completas e plausíveis** (ex: `https://exame.com/negocios/empresa-faz-x/`), nunca domínios genéricos (`https://exame.com`). Usuário pediu isso explicitamente.

### Filtros

Padrão "cascata": Categoria → Subcategoria → Fornecedor. Resetar filhos ao mudar pai.

### Layout do Risk Dashboard cockpit

Hero é o coração da página: radar grande à esquerda (~280px) com score gigante no núcleo (gradient + box-shadow colorido). À direita: título grande "Risco {Status}" + 3 barras de progresso (Saúde / Reputação / Interna) + KPI strip.

---

## Workflow de deploy

1. `npm run build` localmente para validar (warning de chunk size é ok, ignorar)
2. **Stagear seletivamente** — `git add` arquivos específicos. **NÃO usar `git add -A`**: o repo não tem `.gitignore`, então isso pega `node_modules/` e `dist/`
3. Commit no formato:
   ```
   feat(escopo): título curto

   - bullet
   - bullet

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
4. `git push origin main` → dispara `.github/workflows/deploy.yml` → Pages publica em ~2 min
5. Avisar Paulo do URL e lembrar de hard refresh (`Ctrl+Shift+R`)

---

## Como Paulo trabalha (estilo de comunicação)

- Português brasileiro, conciso
- Frases típicas:
  - "testa localmente e me manda o link do deploy" → significa: build + commit + push + URL do GH Pages
  - "deixe mais moderno/compacto/executivo" → reduzir paddings, aumentar contraste tipográfico, fundo branco, números grandes
  - "use as cores da empresa" → verde Stone vibrante (`#00D26A`), nunca o teal anterior
- Geralmente envia screenshots como referência visual — abrir e analisar paleta/layout antes de codar
- Espera **uma página por vez** ao redesenhar grandes mudanças visuais — começar por uma, confirmar, depois replicar nas outras

### Não fazer

- Não usar drawer lateral para detalhes — sempre drill-down inline
- Não inventar URLs genéricas em seed data
- Não criar páginas/módulos novos sem pedido explícito
- Não deixar `#10CB9A` (teal antigo) — sempre migrar para `#00D26A` (Stone vibrante)
- Não rodar `npm run dev` esperando que o Claude Code teste no navegador (não tem como ver UI) — apenas validar com `npm run build`

---

## Estado atual do redesign (2026-05-06)

✅ **Foundation pronta:** tokens, Inter, paleta nova, TopBar moderna
✅ **Home:** hero card saving + sparkline + KPI strip + grid módulos
✅ **Risk Shield Dashboard:** cockpit completo com hero score + drill-down inline

⏳ **Pendentes (próxima onda de redesign):**
- Analytics (`AnalyticsHub.jsx` + sub-views como `CategoryAnalytics.jsx`)
- Raio-X de Preços (`RaioXPrecos.jsx`, `GestaoCostBreakdowns.jsx`, criação de pacotes)
- Kanban (`KanbanBoard.jsx` — provavelmente o mais complexo)
- Settings, Help, Login
- Componentes compartilhados ainda no estilo antigo: `ProcurementForm` (modal), `ApprovalPanel`, `ChangePasswordModal`, `NotificationBell` (parcialmente migrado)

Ao redesenhar próximas páginas, seguir Risk Shield e Home como referência: fundo branco, Inter, `text-ink/muted/subtle`, `border-line`, `bg-brand-tint` para active, pílulas para CTAs, números bold grandes, density alta.
