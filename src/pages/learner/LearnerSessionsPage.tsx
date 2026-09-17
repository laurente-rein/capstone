import { SessionsBoard } from '../../components/sessions/SessionsBoard'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getBookingsForLearner } from '../../lib/selectors'

export function LearnerSessionsPage() {
  const { userId } = useCurrentUser()
  const bookings = useDb(() => (userId ? getBookingsForLearner(userId) : []))
  if (!userId) return null
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Sessions</h1>
        <p className="text-sm text-neutral-500">Track your booked tutoring sessions.</p>
      </div>
      <SessionsBoard bookings={bookings} viewerRole="learner" viewerId={userId} />
    </div>
  )
}
