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
  const isKanban = currentPage === 'kanban'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <TopBar />
      <main className={`flex-1 overflow-hidden ${isKanban ? 'p-3' : ''}`}>
        <PageComponent />
      </main>
      <ProcurementForm />
      <ApprovalPanel />
      {currentUser?.mustChangePassword && <ChangePasswordModal />}
    </div>
  )
}
