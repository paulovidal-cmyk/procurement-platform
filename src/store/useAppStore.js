import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateSaving } from '../algorithms/savingCalculator.js'
import { calculateVPL } from '../algorithms/vplCalculator.js'
import { routeCard } from '../algorithms/approvalRouter.js'
import { hashPassword } from '../algorithms/crypto.js'
import { fetchSheetData } from '../services/googleSheets.js'
import { DEMO_USERS } from '../constants/roles.js'
import { MOCK_SHEETS_DATA } from '../data/mockSheetsData.js'

const SCHEMA_VERSION = 3

let _idCounter = 0
function uuid() {
  return Date.now().toString(36) + (++_idCounter).toString(36) + Math.random().toString(36).slice(2, 5)
}
function tcpsId(n)  { return `TCPS-${String(n).padStart(4, '0')}` }
function notifId()  { return 'n-' + uuid() }

// ── Seed Notifications ────────────────────────────────────────────────────────
const SEED_NOTIFICATIONS = [
  { id:'notif-1', type:'approval_needed', title:'Aprovação necessária',
    message:'TCPS-0001 (TechSupply) aguarda sua aprovação na Coordenação.',
    cardId:'card-1', targetRoles:['coordenador','admin'], targetUserId:null,
    isRead:false, createdAt:new Date(Date.now()-5*86400000).toISOString() },
  { id:'notif-2', type:'approval_needed', title:'Aprovação necessária',
    message:'TCPS-0002 (LogisBrasil) aguarda sua aprovação pelo Gestor.',
    cardId:'card-2', targetRoles:['gestor','admin'], targetUserId:null,
    isRead:false, createdAt:new Date(Date.now()-2*86400000).toISOString() },
  { id:'notif-3', type:'approval_needed', title:'Aprovação necessária',
    message:'TCPS-0004 (GlobalParts) aguarda sua aprovação pela Diretoria.',
    cardId:'card-4', targetRoles:['diretor','admin'], targetUserId:null,
    isRead:false, createdAt:new Date(Date.now()-3*86400000).toISOString() },
  { id:'notif-4', type:'approved', title:'Card aprovado',
    message:'TCPS-0005 (FornecedorXYZ) foi aprovado por Bruno Costa.',
    cardId:'card-5', targetRoles:[], targetUserId:'u5',
    isRead:false, createdAt:new Date(Date.now()-3*86400000).toISOString() },
  { id:'notif-5', type:'rejected', title:'Card rejeitado',
    message:'TCPS-0006 (ServicosMais) foi rejeitado. Comentário: "Valor acima do histórico."',
    cardId:'card-6', targetRoles:[], targetUserId:'u5',
    isRead:false, createdAt:new Date(Date.now()-1*86400000).toISOString() },
]

// ── Seed Cards ────────────────────────────────────────────────────────────────
const SEED_CARDS = [
  { id:'card-1', cardId:'TCPS-0001', fornecedor:'TechSupply Ltda', cnpj:'11.222.333/0001-81',
    razaoSocial:'TechSupply Comercio e Servicos Ltda', categoria:'TI', tipoBaseline:'Histórico',
    valorBaseline:180000, valorFinal:142000, moeda:'BRL', prazoPagamento:'30',
    tipoSaving:'Hard', savingValue:38000, savingPercent:21.11, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'coordenacao',
    approvalLevel:'coordenacao', approvalLevelLabel:'Coordenação',
    isLocked:true, approvalHistory:[],
    vpl:{ cashFlows:[], discountRate:12, result:0 },
    justificativa:'Negociação de contrato anual com desconto por volume.',
    createdAt:new Date(Date.now()-5*86400000).toISOString(),
    updatedAt:new Date(Date.now()-5*86400000).toISOString() },

  { id:'card-2', cardId:'TCPS-0002', fornecedor:'LogisBrasil S.A.', cnpj:'22.333.444/0001-97',
    razaoSocial:'LogisBrasil Transportes S.A.', categoria:'Logística', tipoBaseline:'Orçamento',
    valorBaseline:75000, valorFinal:61500, moeda:'BRL', prazoPagamento:'28',
    tipoSaving:'Hard', savingValue:13500, savingPercent:18, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'gestor',
    approvalLevel:'gestor', approvalLevelLabel:'Gestor',
    isLocked:true,
    approvalHistory:[{ actor:'Bruno Costa', action:'aprovado', comment:'Proposta dentro do orçamento.', at:new Date(Date.now()-2*86400000).toISOString() }],
    vpl:{ cashFlows:[{id:'cf1',period:0,value:-61500},{id:'cf2',period:1,value:20000},{id:'cf3',period:2,value:25000},{id:'cf4',period:3,value:30000}], discountRate:12, result:0 },
    justificativa:'Contrato de logística com SLA melhorado e redução de custo por km.',
    createdAt:new Date(Date.now()-10*86400000).toISOString(),
    updatedAt:new Date(Date.now()-2*86400000).toISOString() },

  { id:'card-3', cardId:'TCPS-0003', fornecedor:'SoftMaker ME', cnpj:'33.444.555/0001-07',
    razaoSocial:'SoftMaker Desenvolvimento de Software ME', categoria:'TI', tipoBaseline:'MPE',
    valorBaseline:12000, valorFinal:9800, moeda:'BRL', prazoPagamento:'30',
    tipoSaving:'Avoidance', savingValue:2200, savingPercent:18.33, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'aguardando',
    approvalLevel:'coordenacao', approvalLevelLabel:'Coordenação',
    isLocked:false, approvalHistory:[],
    vpl:{ cashFlows:[], discountRate:12, result:0 },
    justificativa:'Fornecedor MPE qualificado, evita reajuste de tabela previsto.',
    createdAt:new Date(Date.now()-1*86400000).toISOString(),
    updatedAt:new Date(Date.now()-1*86400000).toISOString() },

  { id:'card-4', cardId:'TCPS-0004', fornecedor:'GlobalParts Inc', cnpj:'44.555.666/0001-13',
    razaoSocial:'GlobalParts Importacao e Comercio Ltda', categoria:'Materiais', tipoBaseline:'Histórico',
    valorBaseline:520000, valorFinal:398000, moeda:'BRL', prazoPagamento:'60',
    tipoSaving:'Hard', savingValue:122000, savingPercent:23.46, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'diretor',
    approvalLevel:'diretor', approvalLevelLabel:'Diretor',
    isLocked:true,
    approvalHistory:[
      { actor:'Bruno Costa', action:'aprovado', comment:'OK pela coordenação.', at:new Date(Date.now()-7*86400000).toISOString() },
      { actor:'Carla Melo', action:'aprovado', comment:'Aprovado pela gestão.', at:new Date(Date.now()-5*86400000).toISOString() },
    ],
    vpl:{ cashFlows:[{id:'cf5',period:0,value:-398000},{id:'cf6',period:1,value:100000},{id:'cf7',period:2,value:150000},{id:'cf8',period:3,value:200000},{id:'cf9',period:4,value:120000}], discountRate:15, result:0 },
    justificativa:'Renegociação contrato master com saving expressivo e melhoria de prazo de pagamento.',
    createdAt:new Date(Date.now()-15*86400000).toISOString(),
    updatedAt:new Date(Date.now()-3*86400000).toISOString() },

  { id:'card-5', cardId:'TCPS-0005', fornecedor:'FornecedorXYZ', cnpj:'55.666.777/0001-29',
    razaoSocial:'FornecedorXYZ Comercio Ltda', categoria:'Facilities', tipoBaseline:'Orçamento',
    valorBaseline:30000, valorFinal:27500, moeda:'BRL', prazoPagamento:'14',
    tipoSaving:'Hard', savingValue:2500, savingPercent:8.33, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'aprovado',
    approvalLevel:'coordenacao', approvalLevelLabel:'Coordenação',
    isLocked:true,
    approvalHistory:[{ actor:'Bruno Costa', action:'aprovado', comment:'Aprovado.', at:new Date(Date.now()-3*86400000).toISOString() }],
    vpl:{ cashFlows:[], discountRate:12, result:0 },
    justificativa:'Compra pontual de materiais de escritório.',
    createdAt:new Date(Date.now()-20*86400000).toISOString(),
    updatedAt:new Date(Date.now()-3*86400000).toISOString() },

  { id:'card-6', cardId:'TCPS-0006', fornecedor:'ServicosMais', cnpj:'66.777.888/0001-35',
    razaoSocial:'ServicosMais Prestacao de Servicos Ltda', categoria:'Facilities', tipoBaseline:'Histórico',
    valorBaseline:45000, valorFinal:48000, moeda:'BRL', prazoPagamento:'30',
    tipoSaving:'Hard', savingValue:-3000, savingPercent:-6.67, isNegative:true,
    comprador:'Ana Lima', compradorId:'u1', columnId:'cancelado',
    approvalLevel:'coordenacao', approvalLevelLabel:'Coordenação',
    isLocked:true,
    approvalHistory:[{ actor:'Bruno Costa', action:'rejeitado', comment:'Valor acima do histórico sem justificativa adequada.', at:new Date(Date.now()-1*86400000).toISOString() }],
    vpl:{ cashFlows:[], discountRate:12, result:0 },
    justificativa:'Renovação de contrato de limpeza.',
    createdAt:new Date(Date.now()-8*86400000).toISOString(),
    updatedAt:new Date(Date.now()-1*86400000).toISOString() },

  { id:'card-7', cardId:'TCPS-0007', fornecedor:'FastMicro', cnpj:'77.888.999/0001-41',
    razaoSocial:'FastMicro Tecnologia ME', categoria:'TI', tipoBaseline:'MPE',
    valorBaseline:3500, valorFinal:3200, moeda:'BRL', prazoPagamento:'7',
    tipoSaving:'Hard', savingValue:300, savingPercent:8.57, isNegative:false,
    comprador:'Ana Lima', compradorId:'u1', columnId:'aprovado',
    approvalLevel:'fast_track', approvalLevelLabel:'Fast Track',
    isLocked:true,
    approvalHistory:[{ actor:'Sistema', action:'aprovado', comment:'Fast Track automático (valor < R$ 5.000)', at:new Date(Date.now()-1*86400000).toISOString() }],
    vpl:{ cashFlows:[], discountRate:12, result:0 },
    justificativa:'Compra de cabo USB para laboratório.',
    createdAt:new Date(Date.now()-2*86400000).toISOString(),
    updatedAt:new Date(Date.now()-2*86400000).toISOString() },
]

SEED_CARDS.forEach(card => {
  if (card.vpl.cashFlows.length > 0) {
    const { vpl } = calculateVPL(card.vpl.cashFlows, card.vpl.discountRate)
    card.vpl.result = vpl
  }
})

// ── Seed Custom Fields ────────────────────────────────────────────────────────
const SEED_CUSTOM_FIELDS = [
  { id:'scf-1', label:'Prazo de Entrega',        key:'prazo_entrega',  type:'select',  options:['15 dias','30 dias','45 dias','60 dias','90 dias'], required:false, order:0 },
  { id:'scf-2', label:'Número do Pedido / RFQ',  key:'numero_rfq',     type:'text',    options:[], required:false, order:1 },
  { id:'scf-3', label:'Possui Cláusula de SLA?', key:'tem_sla',        type:'boolean', options:[], required:false, order:2 },
  { id:'scf-4', label:'Tipo de Contrato',         key:'tipo_contrato',  type:'select',  options:['Spot','Recorrente','Frame Agreement','Projeto'], required:false, order:3 },
]

// ── Store ─────────────────────────────────────────────────────────────────────
const useAppStore = create(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,

      // Auth
      isAuthenticated: false,
      currentUser: null,

      // Navigation
      currentPage: 'kanban',

      // Cards
      cards: SEED_CARDS,
      cardCounter: 8,

      // Notifications
      notifications: SEED_NOTIFICATIONS,

      // Users
      allUsers: DEMO_USERS.map(u => ({ ...u, passwordHash: null, mustChangePassword: u.role !== 'admin' })),
      pendingUsers: [],

      // Custom Fields
      customFields: SEED_CUSTOM_FIELDS,

      // Google Sheets
      sheetsConfig: { webAppUrl: '', sheetId: '', apiKey: '', range: 'Export!A:I' },
      sheetsData: MOCK_SHEETS_DATA,
      sheetsLoading: false,
      sheetsError: null,

      // Search
      searchQuery: '',

      // UI
      uiState: {
        isFormOpen: false,
        editingCardId: null,
        selectedCardId: null,
        isApprovalPanelOpen: false,
        approvingCardId: null,
        isNotifOpen: false,
      },

      // ── Auth ──────────────────────────────────────────────────────────────────
      login: async (email, password) => {
        const { allUsers } = get()
        const lc = email.toLowerCase().trim()
        const user = allUsers.find(u => u.email.toLowerCase() === lc)
        if (!user) {
          return { success: false, error: 'Usuário não encontrado. Contate o Administrador.' }
        }

        const inputHash    = await hashPassword(password)
        const expectedHash = user.passwordHash ?? await hashPassword(user.email)
        if (inputHash !== expectedHash) {
          return { success: false, error: 'Senha incorreta.' }
        }

        set({ isAuthenticated: true, currentUser: user, currentPage: 'kanban' })
        return { success: true }
      },

      logout: () => set({ isAuthenticated: false, currentUser: null, currentPage: 'kanban' }),

      changePassword: async (userId, newPassword) => {
        const hash = await hashPassword(newPassword)
        set(s => ({
          allUsers: s.allUsers.map(u =>
            u.id === userId ? { ...u, passwordHash: hash, mustChangePassword: false } : u
          ),
          currentUser: s.currentUser?.id === userId
            ? { ...s.currentUser, passwordHash: hash, mustChangePassword: false }
            : s.currentUser,
        }))
      },

      resetUserPassword: (userId) => {
        set(s => ({
          allUsers: s.allUsers.map(u =>
            u.id === userId ? { ...u, passwordHash: null, mustChangePassword: true } : u
          ),
        }))
      },

      addAllowedUser: (email, role, name) => {
        const { allUsers } = get()
        const lc = email.toLowerCase().trim()
        if (allUsers.find(u => u.email.toLowerCase() === lc)) return { error: 'E-mail já cadastrado.' }
        const newUser = {
          id: 'u-' + uuid(),
          email: lc,
          name: name || lc.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          role,
          avatar: lc.slice(0, 2).toUpperCase(),
          passwordHash: null,
          mustChangePassword: true,
        }
        set(s => ({ allUsers: [...s.allUsers, newUser] }))
        return { success: true }
      },

      // ── Navigation ────────────────────────────────────────────────────────────
      navigate: (page) => set({ currentPage: page }),

      // ── User Management ───────────────────────────────────────────────────────
      approveUser: (userId) => {
        const { pendingUsers } = get()
        const user = pendingUsers.find(u => u.id === userId)
        if (!user) return
        const newUser = { ...user, passwordHash: null, mustChangePassword: true }
        delete newUser.requestedAt
        set(s => ({
          allUsers: [...s.allUsers, newUser],
          pendingUsers: s.pendingUsers.filter(u => u.id !== userId),
        }))
      },

      rejectUser: (userId) => {
        set(s => ({ pendingUsers: s.pendingUsers.filter(u => u.id !== userId) }))
      },

      updateUserRole: (userId, newRole) => {
        set(s => ({
          allUsers: s.allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u),
          currentUser: s.currentUser?.id === userId ? { ...s.currentUser, role: newRole } : s.currentUser,
        }))
      },

      // ── Search ────────────────────────────────────────────────────────────────
      setSearch: (query) => set({ searchQuery: query }),

      // ── Notifications ─────────────────────────────────────────────────────────
      markNotificationRead: (id) =>
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) })),

      markAllNotificationsRead: () =>
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) })),

      openNotif:  () => set(s => ({ uiState: { ...s.uiState, isNotifOpen: true } })),
      closeNotif: () => set(s => ({ uiState: { ...s.uiState, isNotifOpen: false } })),

      // ── Form ──────────────────────────────────────────────────────────────────
      openForm:  (cardId = null) =>
        set(s => ({ uiState: { ...s.uiState, isFormOpen: true, editingCardId: cardId } })),
      closeForm: () =>
        set(s => ({ uiState: { ...s.uiState, isFormOpen: false, editingCardId: null } })),

      openApprovalPanel: (cardId) =>
        set(s => ({ uiState: { ...s.uiState, isApprovalPanelOpen: true, approvingCardId: cardId } })),
      closeApprovalPanel: () =>
        set(s => ({ uiState: { ...s.uiState, isApprovalPanelOpen: false, approvingCardId: null } })),

      // ── Cards ─────────────────────────────────────────────────────────────────
      createCard: (formData) => {
        const { currentUser, cardCounter } = get()
        const saving    = calculateSaving(formData.valorBaseline, formData.valorFinal, formData.tipoSaving)
        const route     = routeCard(formData.valorFinal, formData.moeda)
        const vplResult = calculateVPL(formData.vpl?.cashFlows || [], formData.vpl?.discountRate || 12)
        const isFastTrack = route.level === 'fast_track'
        const newCardId   = tcpsId(cardCounter)

        const card = {
          id: uuid(), cardId: newCardId, ...formData,
          savingValue: saving.savingValue, savingPercent: saving.savingPercent, isNegative: saving.isNegative,
          columnId: route.columnId, approvalLevel: route.level, approvalLevelLabel: route.label,
          isLocked: !isFastTrack,
          approvalHistory: isFastTrack
            ? [{ actor:'Sistema', action:'aprovado', comment:'Fast Track automático (valor < R$ 5.000)', at:new Date().toISOString() }]
            : [],
          vpl: { cashFlows: formData.vpl?.cashFlows || [], discountRate: formData.vpl?.discountRate || 12, result: vplResult.vpl },
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }

        const notifs = []
        if (!isFastTrack) {
          notifs.push({
            id: notifId(), type:'approval_needed', title:'Aprovação necessária',
            message:`${newCardId} (${formData.razaoSocial || formData.fornecedor}) aguarda aprovação na ${route.label}.`,
            cardId: card.id, targetRoles:[route.level,'admin'], targetUserId:null,
            isRead:false, createdAt:new Date().toISOString(),
          })
        }
        set(s => ({ cards:[card,...s.cards], cardCounter:s.cardCounter+1, notifications:[...notifs,...s.notifications] }))
        return card
      },

      updateCard: (id, formData) => {
        const saving    = calculateSaving(formData.valorBaseline, formData.valorFinal, formData.tipoSaving)
        const route     = routeCard(formData.valorFinal, formData.moeda)
        const vplResult = calculateVPL(formData.vpl?.cashFlows || [], formData.vpl?.discountRate || 12)
        set(s => ({
          cards: s.cards.map(c => c.id === id ? {
            ...c, ...formData,
            savingValue: saving.savingValue, savingPercent: saving.savingPercent, isNegative: saving.isNegative,
            columnId: route.columnId, approvalLevel: route.level, approvalLevelLabel: route.label,
            isLocked: route.level !== 'fast_track',
            vpl: { cashFlows: formData.vpl?.cashFlows || [], discountRate: formData.vpl?.discountRate || 12, result: vplResult.vpl },
            updatedAt: new Date().toISOString(),
          } : c),
        }))
      },

      approveCard: (id, comment) => {
        const { currentUser, cards } = get()
        const card = cards.find(c => c.id === id)
        if (!card) return
        set(s => ({
          cards: s.cards.map(c => c.id === id ? {
            ...c, columnId:'aprovado', isLocked:true,
            approvalHistory:[...c.approvalHistory,{ actor:currentUser.name, action:'aprovado', comment, at:new Date().toISOString() }],
            updatedAt:new Date().toISOString(),
          } : c),
          notifications:[{
            id:notifId(), type:'approved', title:'Card aprovado!',
            message:`${card.cardId} (${card.razaoSocial}) foi aprovado por ${currentUser.name}.`,
            cardId:id, targetRoles:[], targetUserId:card.compradorId,
            isRead:false, createdAt:new Date().toISOString(),
          }, ...s.notifications],
          uiState:{ ...s.uiState, isApprovalPanelOpen:false, approvingCardId:null },
        }))
      },

      rejectCard: (id, comment) => {
        const { currentUser, cards } = get()
        const card = cards.find(c => c.id === id)
        if (!card) return
        set(s => ({
          cards: s.cards.map(c => c.id === id ? {
            ...c, columnId:'cancelado', isLocked:true,
            approvalHistory:[...c.approvalHistory,{ actor:currentUser.name, action:'rejeitado', comment, at:new Date().toISOString() }],
            updatedAt:new Date().toISOString(),
          } : c),
          notifications:[{
            id:notifId(), type:'rejected', title:'Card rejeitado',
            message:`${card.cardId} (${card.razaoSocial}) foi rejeitado. Comentário: "${comment}"`,
            cardId:id, targetRoles:[], targetUserId:card.compradorId,
            isRead:false, createdAt:new Date().toISOString(),
          }, ...s.notifications],
          uiState:{ ...s.uiState, isApprovalPanelOpen:false, approvingCardId:null },
        }))
      },

      moveCard: (cardId, targetColumnId) =>
        set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, columnId:targetColumnId, updatedAt:new Date().toISOString() } : c) })),

      deleteCard: (id) =>
        set(s => ({ cards: s.cards.filter(c => c.id !== id) })),

      // ── Custom Fields CRUD ────────────────────────────────────────────────────
      addCustomField: (field) => {
        const { customFields } = get()
        const newField = { ...field, id:'cf-'+uuid(), order:customFields.length }
        set(s => ({ customFields:[...s.customFields, newField] }))
      },

      updateCustomField: (id, patch) =>
        set(s => ({ customFields: s.customFields.map(f => f.id === id ? { ...f, ...patch } : f) })),

      deleteCustomField: (id) =>
        set(s => ({ customFields: s.customFields.filter(f => f.id !== id).map((f,i) => ({ ...f, order:i })) })),

      reorderField: (id, direction) => {
        set(s => {
          const fields = [...s.customFields].sort((a,b) => a.order - b.order)
          const idx = fields.findIndex(f => f.id === id)
          if (idx < 0) return s
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= fields.length) return s
          const updated = fields.map((f,i) => {
            if (i === idx)     return { ...f, order: swapIdx }
            if (i === swapIdx) return { ...f, order: idx }
            return f
          })
          return { customFields: updated }
        })
      },

      // ── Google Sheets ─────────────────────────────────────────────────────────
      updateSheetsConfig: (config) =>
        set(s => ({ sheetsConfig: { ...s.sheetsConfig, ...config } })),

      loadSheetsData: async () => {
        const { sheetsConfig } = get()
        set({ sheetsLoading: true, sheetsError: null })
        try {
          const data = await fetchSheetData(sheetsConfig.webAppUrl)
          set({ sheetsData: data, sheetsLoading: false })
          return { success: true, count: data.length }
        } catch (err) {
          set({ sheetsLoading: false, sheetsError: err.message })
          return { success: false, error: err.message }
        }
      },

      resetToMockData: () =>
        set({ sheetsData: MOCK_SHEETS_DATA, sheetsError: null }),
    }),
    {
      name: 'procurement-store-v3',
      partialize: (state) => ({
        schemaVersion:   state.schemaVersion,
        isAuthenticated: state.isAuthenticated,
        currentUser:     state.currentUser,
        currentPage:     state.currentPage === 'login' ? 'kanban' : state.currentPage,
        cards:           state.cards,
        cardCounter:     state.cardCounter,
        notifications:   state.notifications,
        allUsers:        state.allUsers,
        pendingUsers:    state.pendingUsers,
        customFields:    state.customFields,
        sheetsConfig:    state.sheetsConfig,
        sheetsData:      state.sheetsData,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.schemaVersion !== SCHEMA_VERSION) {
          // Full reset on major version change
          state.cards         = SEED_CARDS
          state.cardCounter   = 8
          state.notifications = SEED_NOTIFICATIONS
          state.schemaVersion = SCHEMA_VERSION
        }
        // Graceful migrations
        if (!state.customFields)  state.customFields  = SEED_CUSTOM_FIELDS
        if (!state.sheetsConfig) state.sheetsConfig = { webAppUrl:'', sheetId:'', apiKey:'', range:'Export!A:I' }
        if (!state.sheetsConfig.webAppUrl) state.sheetsConfig.webAppUrl = ''
        if (!state.sheetsData)  state.sheetsData  = MOCK_SHEETS_DATA
        // Add password fields to users that don't have them
        if (state.allUsers) {
          state.allUsers = state.allUsers.map(u => ({
            ...u,
            passwordHash:       u.passwordHash       ?? null,
            mustChangePassword: u.mustChangePassword ?? (u.role !== 'admin'),
          }))
        }
        // Sync currentUser with allUsers (for updated fields)
        if (state.currentUser && state.allUsers) {
          const fresh = state.allUsers.find(u => u.id === state.currentUser.id)
          if (fresh) state.currentUser = fresh
        }
      },
    }
  )
)

export default useAppStore
