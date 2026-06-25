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
 * Lista de ACESSO AUTORIZADO da plataforma (allowlist).
 *
 * Sem backend, esta lista (no código + deploy) é a única "portaria" que vale em
 * qualquer navegador. SÓ e-mails aqui presentes conseguem entrar. Cada pessoa
 * define a própria senha no 1º acesso (passwordHash:null → tela "criar senha").
 * NÃO há auto-cadastro: e-mail fora da lista é bloqueado.
 *
 * Para liberar alguém: adicionar uma linha aqui e publicar (deploy).
 * Hashes são SHA-256 (ver algorithms/crypto.js).
 */
export const SEED_USERS = [
  // Admin — senha "Pau331331+" (SHA-256). mustChangePassword:false → entra direto.
  { id:'u5', name:'Paulo Vidal',  email:'paulo.vidal@stone.com.br',  role:'admin',     avatar:'PV', passwordHash:'b0fe161a3c504561fa6d235bd57adf9a7b969ceb9f90b3660ac21199b35df996', mustChangePassword:false },
  // Autorizados — sem senha: definem no 1º acesso.
  { id:'u6', name:'Joseli Jesus', email:'joseli.jesus@stone.com.br', role:'comprador', avatar:'JJ', passwordHash:null, mustChangePassword:false },
]

// Alias retrocompat — o restante do código importa DEMO_USERS.
export const DEMO_USERS = SEED_USERS
