import { SessionsBoard } from '../../components/sessions/SessionsBoard'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getBookingsForTutor } from '../../lib/selectors'

export function TutorSessionsPage() {
  const { userId } = useCurrentUser()
  const bookings = useDb(() => (userId ? getBookingsForTutor(userId) : []))
  if (!userId) return null
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Sessions</h1>
        <p className="text-sm text-neutral-500">Manage the sessions learners have booked with you.</p>
      </div>
      <SessionsBoard bookings={bookings} viewerRole="tutor" viewerId={userId} />
    </div>
  )
}
