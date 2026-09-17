import { MessagesPage } from '../../components/messages/MessagesPage'
import { useCurrentUser } from '../../hooks/useDb'

export function TutorMessagesPage() {
  const { userId } = useCurrentUser()
  if (!userId) return null
  return <MessagesPage userId={userId} />
}
