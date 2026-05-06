import { Sidebar } from './components/layout/Sidebar.jsx'
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

export default function App() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const currentUser     = useAppStore(s => s.currentUser)
  const currentPage     = useAppStore(s => s.currentPage)

  if (!isAuthenticated) return <Login />

  const PageComponent = PAGES[currentPage] || Home

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <PageComponent />
      </main>
      <ProcurementForm />
      <ApprovalPanel />
      {currentUser?.mustChangePassword && <ChangePasswordModal />}
    </div>
  )
}
