import { NotificationsPage } from '../../components/notifications/NotificationsPage'
import { useCurrentUser } from '../../hooks/useDb'

export function LearnerNotificationsPage() {
  const { userId } = useCurrentUser()
  if (!userId) return null
  return <NotificationsPage userId={userId} />
}
