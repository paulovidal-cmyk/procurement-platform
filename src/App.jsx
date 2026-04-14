import { TopBar } from './components/layout/TopBar.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { KanbanBoard } from './components/kanban/KanbanBoard.jsx'
import { ProcurementForm } from './components/form/ProcurementForm.jsx'
import { ApprovalPanel } from './components/approval/ApprovalPanel.jsx'
import { ChangePasswordModal } from './components/auth/ChangePasswordModal.jsx'
import { Login } from './pages/Login.jsx'
import { Analytics } from './pages/Analytics.jsx'
import { Help } from './pages/Help.jsx'
import { Settings } from './pages/Settings.jsx'
import { CategoryDashboard } from './pages/CategoryDashboard.jsx'
import useAppStore from './store/useAppStore.js'

const PAGES = {
  kanban:    KanbanBoard,
  analytics: Analytics,
  category:  CategoryDashboard,
  help:      Help,
  settings:  Settings,
}

export default function App() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const currentUser     = useAppStore(s => s.currentUser)
  const currentPage     = useAppStore(s => s.currentPage)

  if (!isAuthenticated) return <Login />

  const PageComponent = PAGES[currentPage] || KanbanBoard
  const noTopPadding  = currentPage === 'kanban'
  const isCategory    = currentPage === 'category'

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isCategory ? '' : 'bg-slate-100'}`}
      style={isCategory ? { background: '#0D3125' } : undefined}>
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className={`flex-1 overflow-hidden ${noTopPadding ? 'p-3' : ''}`}>
          <PageComponent />
        </main>
      </div>
      <ProcurementForm />
      <ApprovalPanel />
      {currentUser?.mustChangePassword && <ChangePasswordModal />}
    </div>
  )
}
