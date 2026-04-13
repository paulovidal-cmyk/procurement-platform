import { TopBar } from './components/layout/TopBar.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { KanbanBoard } from './components/kanban/KanbanBoard.jsx'
import { ProcurementForm } from './components/form/ProcurementForm.jsx'
import { ApprovalPanel } from './components/approval/ApprovalPanel.jsx'
import { Login } from './pages/Login.jsx'
import { Analytics } from './pages/Analytics.jsx'
import { Help } from './pages/Help.jsx'
import { Settings } from './pages/Settings.jsx'
import useAppStore from './store/useAppStore.js'

const PAGES = {
  kanban: KanbanBoard,
  analytics: Analytics,
  help: Help,
  settings: Settings,
}

export default function App() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const currentPage = useAppStore(s => s.currentPage)

  if (!isAuthenticated) {
    return <Login />
  }

  const PageComponent = PAGES[currentPage] || KanbanBoard

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className={`flex-1 overflow-hidden ${currentPage === 'kanban' ? 'p-3' : ''}`}>
          <PageComponent />
        </main>
      </div>
      <ProcurementForm />
      <ApprovalPanel />
    </div>
  )
}
