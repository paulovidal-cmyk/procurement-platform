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
  { id:'u5', name:'Paulo Vidal', email:'paulo.vidal@stone.com.br', role:'admin', avatar:'PV', passwordHash:'b0fe161a3c504561fa6d235bd57adf9a7b969ceb9f90b3660ac21199b35df996', mustChangePassword:false },

  // Autorizados — sem senha: definem no 1º acesso.
  { id:'u6',  name:'Milene Custodio Bueno',                 email:'milene.bueno@stone.com.br',      role:'comprador', avatar:'MB', passwordHash:null, mustChangePassword:false },
  { id:'u7',  name:'Carolina Beiler Reblin',                email:'carolina.reblin@stone.com.br',   role:'comprador', avatar:'CR', passwordHash:null, mustChangePassword:false },
  { id:'u8',  name:'Geovanna De Barros Kustovich',          email:'geovanna.barros@stone.com.br',   role:'comprador', avatar:'GK', passwordHash:null, mustChangePassword:false },
  { id:'u9',  name:'Kevelin Silva De Mello Narciso',        email:'kevelin.narciso@stone.com.br',   role:'comprador', avatar:'KN', passwordHash:null, mustChangePassword:false },
  { id:'u10', name:'Lais Marreiros De Sa Miranda',          email:'lmiranda@stone.com.br',          role:'comprador', avatar:'LM', passwordHash:null, mustChangePassword:false },
  { id:'u11', name:'Nathalia Francisco Xavier Lima',        email:'nathalia.xavier@stone.com.br',   role:'comprador', avatar:'NL', passwordHash:null, mustChangePassword:false },
  { id:'u12', name:'Raquel Mayumi Elias Nakano',            email:'raquel.nakano@stone.com.br',     role:'gestor',    avatar:'RN', passwordHash:null, mustChangePassword:false },
  { id:'u13', name:'Gabriel Duplanil Armas',                email:'gabriel.armas@stone.com.br',     role:'comprador', avatar:'GA', passwordHash:null, mustChangePassword:false },
  { id:'u14', name:'Karina Vanessa Marques',                email:'ka.marques@stone.com.br',        role:'comprador', avatar:'KM', passwordHash:null, mustChangePassword:false },
  { id:'u15', name:'Thiago Aparecido Pereira',              email:'thiago.apereira@stone.com.br',   role:'comprador', avatar:'TP', passwordHash:null, mustChangePassword:false },
  { id:'u16', name:'Neulliane Carla Dos Santos',            email:'neuliane.santos@stone.com.br',   role:'comprador', avatar:'NS', passwordHash:null, mustChangePassword:false },
  { id:'u17', name:'Sarah Nunes Dos Santos',                email:'sarah.nunes@stone.com.br',       role:'comprador', avatar:'SS', passwordHash:null, mustChangePassword:false },
  { id:'u18', name:'Priscila Aguiar Da Silva',              email:'priscila.aguiar@stone.com.br',   role:'comprador', avatar:'PS', passwordHash:null, mustChangePassword:false },
  { id:'u19', name:'Henrique Dos Santos Fernandes Silva',   email:'henrique.fernandes@stone.com.br', role:'comprador', avatar:'HS', passwordHash:null, mustChangePassword:false },
  { id:'u20', name:'Ana Carolina Lopes Schwambach Lira',    email:'ana.schwambach@stone.com.br',    role:'gestor',    avatar:'AL', passwordHash:null, mustChangePassword:false },
  { id:'u21', name:'Rubens Farias De Azevedo Mangabeira',   email:'rubens.mangabeira@stone.com.br', role:'gestor',    avatar:'RM', passwordHash:null, mustChangePassword:false },
  { id:'u22', name:'Marcia Cristina Da Luz Mihok De Araujo', email:'marcia.mihok@stone.com.br',     role:'comprador', avatar:'MA', passwordHash:null, mustChangePassword:false },
  { id:'u23', name:'Giovanna Rodrigues Lopes De Oliveira',  email:'giovanna.lopes@stone.com.br',    role:'comprador', avatar:'GO', passwordHash:null, mustChangePassword:false },
  { id:'u24', name:'Jessica Andriotti Bento',               email:'jessica.andriotti@stone.com.br', role:'comprador', avatar:'JB', passwordHash:null, mustChangePassword:false },
  { id:'u25', name:'Joseli Rodrigues Duarte',               email:'joseli.jesus@stone.com.br',      role:'gestor',    avatar:'JD', passwordHash:null, mustChangePassword:false },
  { id:'u26', name:'Thayna Giovanna Guidotti Correa',       email:'thayna.correa@stone.com.br',     role:'comprador', avatar:'TC', passwordHash:null, mustChangePassword:false },
  { id:'u27', name:'Catharina Magalhaes Teixeira',          email:'catharina.teixeira@stone.com.br', role:'comprador', avatar:'CT', passwordHash:null, mustChangePassword:false },
  { id:'u28', name:'Maria Julia Dos Santos Cruz',           email:'maria.jcruz@stone.com.br',       role:'comprador', avatar:'MC', passwordHash:null, mustChangePassword:false },
  { id:'u29', name:'Thais Lotti Bagdonas',                  email:'thais.bagdonas@stone.com.br',    role:'comprador', avatar:'TB', passwordHash:null, mustChangePassword:false },
  { id:'u30', name:'João Affonso Ferreira',                 email:'joao.affonso@stone.com.br',      role:'gestor',    avatar:'JF', passwordHash:null, mustChangePassword:false },
  { id:'u31', name:'Jose Mauricio Ferreira Netto',          email:'jose.netto@stone.com.br',        role:'gestor',    avatar:'JN', passwordHash:null, mustChangePassword:false },
]

// Alias retrocompat — o restante do código importa DEMO_USERS.
export const DEMO_USERS = SEED_USERS
