import { TopBar } from './components/layout/TopBar.jsx'
import { KanbanBoard } from './components/kanban/KanbanBoard.jsx'
import { ProcurementForm } from './components/form/ProcurementForm.jsx'
import { ApprovalPanel } from './components/approval/ApprovalPanel.jsx'
import { ChangePasswordModal } from './components/auth/ChangePasswordModal.jsx'
import { Login } from './pages/Login.jsx'
import { Home } from './pages/Home.jsx'
import { AnalyticsHub } from './pages/AnalyticsHub.jsx'
import { RaioXPrecos } from './pages/RaioXPrecos.jsx'
import { SupplierRiskShield } from './pages/SupplierRiskShield.jsx'
import { Settings } from './pages/Settings.jsx'
import { Help } from './pages/Help.jsx'
import { LockedOverlay } from './components/layout/LockedOverlay.jsx'
import { Lock } from 'lucide-react'
import { accessLevel, ACCESS } from './constants/modules.js'
import useAppStore from './store/useAppStore.js'

const PAGES = {
  home:        Home,
  kanban:      KanbanBoard,
  analytics:   AnalyticsHub,
  raiox:       RaioXPrecos,
  riskshield:  SupplierRiskShield,
  settings:    Settings,
  help:        Help,
}

function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gray-100">
        <Lock size={22} className="text-subtle" />
      </div>
      <h2 className="text-base font-bold text-ink">Acesso não disponível</h2>
      <p className="text-sm text-muted mt-1 max-w-sm">
        Seu perfil não tem acesso a esta área. Selecione outra aba no menu ou fale com o administrador.
      </p>
    </div>
  )
}

export default function App() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const currentUser     = useAppStore(s => s.currentUser)
  const currentPage     = useAppStore(s => s.currentPage)
  const modulePermissions = useAppStore(s => s.modulePermissions)

  if (!isAuthenticated) return <Login />

  const PageComponent = PAGES[currentPage] || Home
  const isKanban = currentPage === 'kanban'
  const level = accessLevel(modulePermissions, currentUser?.role, currentPage)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <TopBar />
      <main className={`flex-1 overflow-hidden ${isKanban && level === ACCESS.FULL ? 'p-3' : ''}`}>
        {level === ACCESS.HIDDEN ? (
          <NoAccess />
        ) : level === ACCESS.LOCKED ? (
          <LockedOverlay>
            <div className={`h-full w-full ${isKanban ? 'p-3' : ''}`}>
              <PageComponent />
            </div>
          </LockedOverlay>
        ) : (
          <PageComponent />
        )}
      </main>
      <ProcurementForm />
      <ApprovalPanel />
      {currentUser?.mustChangePassword && <ChangePasswordModal />}
    </div>
  )
}
