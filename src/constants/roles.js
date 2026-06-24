export const ROLES = {
  comprador: {
    id: 'comprador',
    label: 'Comprador',
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canDrag: true,
    canAccessSettings: false,
    color: 'bg-sky-100 text-sky-700',
    badgeColor: '#0EA5E9',
  },
  gestor: {
    id: 'gestor',
    label: 'Gestor',
    canCreate: false,
    canEdit: false,
    canApprove: true,
    approveColumns: ['coordenacao', 'gestor', 'diretor'],
    canDrag: false,
    canAccessSettings: false,
    color: 'bg-violet-100 text-violet-700',
    badgeColor: '#8B5CF6',
  },
  // Visitante: somente leitura — por padrão TODAS as abas ficam bloqueadas
  // (ver defaultModulePermissions em useAppStore: visitante = HIDDEN em tudo).
  visitante: {
    id: 'visitante',
    label: 'Visitante',
    canCreate: false,
    canEdit: false,
    canApprove: false,
    canDrag: false,
    canAccessSettings: false,
    color: 'bg-gray-100 text-gray-600',
    badgeColor: '#9CA3AF',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    canCreate: true,
    canEdit: true,
    canApprove: true,
    approveColumns: ['coordenacao', 'gestor', 'diretor'],
    canDrag: true,
    canAccessSettings: true,
    color: 'bg-orange-100 text-orange-700',
    badgeColor: '#F97316',
  },
}

/**
 * Usuários-semente da plataforma.
 *
 * Login exige `passwordHash` definido — NÃO há mais fallback "senha = e-mail".
 * Só o admin (Paulo) tem senha definida no seed; os demais nascem SEM senha
 * (passwordHash:null) e, portanto, BLOQUEADOS até o admin definir uma senha
 * provisória em Configurações → Usuários. São dados de exemplo do Kanban.
 *
 * O hash do admin é SHA-256 (ver algorithms/crypto.js) da senha definida.
 */
export const SEED_USERS = [
  { id:'u1', name:'Ana Lima',    email:'ana.lima@stone.com.br',    role:'comprador',   avatar:'AL', passwordHash:null, mustChangePassword:true  },
  { id:'u2', name:'Bruno Costa', email:'bruno.costa@stone.com.br', role:'gestor',      avatar:'BC', passwordHash:null, mustChangePassword:true  },
  { id:'u3', name:'Carla Melo',  email:'carla.melo@stone.com.br',  role:'gestor',      avatar:'CM', passwordHash:null, mustChangePassword:true  },
  { id:'u4', name:'Diego Faria', email:'diego.faria@stone.com.br', role:'visitante',   avatar:'DF', passwordHash:null, mustChangePassword:true  },
  // Admin — senha "Pau331331+" (SHA-256). mustChangePassword:false → entra direto.
  { id:'u5', name:'Paulo Vidal', email:'paulo.vidal@stone.com.br', role:'admin',       avatar:'PV', passwordHash:'b0fe161a3c504561fa6d235bd57adf9a7b969ceb9f90b3660ac21199b35df996', mustChangePassword:false },
]

// Alias retrocompat — o restante do código importa DEMO_USERS.
export const DEMO_USERS = SEED_USERS
