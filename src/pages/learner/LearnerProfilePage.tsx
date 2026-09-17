import { ProfilePage } from '../../components/profile/ProfilePage'
import { useCurrentUser } from '../../hooks/useDb'

export function LearnerProfilePage() {
  const { user } = useCurrentUser()
  if (!user) return null
  return <ProfilePage user={user} />
}
