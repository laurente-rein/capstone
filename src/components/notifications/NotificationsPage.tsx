import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'
import { useDb } from '../../hooks/useDb'
import { getNotifications, getUnreadCount } from '../../lib/selectors'
import { markAllNotificationsRead, markNotificationRead } from '../../lib/actions'
import { timeAgo } from '../../lib/utils'

export function NotificationsPage({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const notifications = useDb(() => getNotifications(userId))
  const unread = useDb(() => getUnreadCount(userId))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500">Stay up to date with your CampusTutor activity.</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead(userId)}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon={<Bell className="size-6" />} title="No notifications" description="You're all caught up." />
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id)
                  if (n.linkTo) navigate(n.linkTo)
                }}
                className={`flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                  <p className="text-xs text-neutral-500">{n.body}</p>
                </div>
                <span className="shrink-0 text-[11px] text-neutral-400">{timeAgo(n.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
