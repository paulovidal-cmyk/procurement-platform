import { Bell, X, CheckCheck, ExternalLink, CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'
import { formatDateTime } from '../../utils/formatters.js'

const TYPE_CONFIG = {
  approval_needed: { icon: Clock, color: '#F59E0B', bg: 'bg-amber-50', label: 'Aprovação' },
  approved: { icon: CheckCircle, color: '#10B981', bg: 'bg-emerald-50', label: 'Aprovado' },
  rejected: { icon: XCircle, color: '#EF4444', bg: 'bg-red-50', label: 'Rejeitado' },
  new_user: { icon: UserPlus, color: '#3B82F6', bg: 'bg-blue-50', label: 'Novo Usuário' },
}

export function NotificationBell() {
  const currentUser = useAppStore(s => s.currentUser)
  const notifications = useAppStore(s => s.notifications)
  const isOpen = useAppStore(s => s.uiState.isNotifOpen)
  const openNotif = useAppStore(s => s.openNotif)
  const closeNotif = useAppStore(s => s.closeNotif)
  const markNotificationRead = useAppStore(s => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore(s => s.markAllNotificationsRead)
  const openApprovalPanel = useAppStore(s => s.openApprovalPanel)

  // Filter notifications relevant to current user
  const myNotifs = notifications.filter(n => {
    if (n.targetUserId) return n.targetUserId === currentUser?.id
    if (n.targetRoles?.length) return n.targetRoles.includes(currentUser?.role)
    return false
  })

  const unreadCount = myNotifs.filter(n => !n.isRead).length

  const handleNotifClick = (notif) => {
    markNotificationRead(notif.id)
    if (notif.cardId) {
      openApprovalPanel(notif.cardId)
      closeNotif()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => isOpen ? closeNotif() : openNotif()}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-gray-50 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white"
            style={{ backgroundColor: '#EF4444' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={closeNotif} />

          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <CheckCheck size={12} />
                    Marcar todas
                  </button>
                )}
                <button onClick={closeNotif} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {myNotifs.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma notificação</p>
                </div>
              ) : (
                myNotifs.map(notif => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.approval_needed
                  const Icon = config.icon
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <Icon size={15} style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-900 ${!notif.isRead ? 'font-semibold' : ''}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                      </div>
                      {notif.cardId && (
                        <ExternalLink size={12} className="text-gray-300 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
