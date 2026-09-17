import { Star } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Avatar } from '../../components/ui/Avatar'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getRatingsGivenByLearner, getUser } from '../../lib/selectors'
import { formatDate } from '../../lib/utils'

export function MyReviewsPage() {
  const { userId } = useCurrentUser()
  const ratings = useDb(() => (userId ? getRatingsGivenByLearner(userId) : []))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Reviews</h1>
        <p className="text-sm text-neutral-500">Ratings and reviews you've submitted for completed sessions.</p>
      </div>

      <Card>
        {ratings.length === 0 ? (
          <EmptyState
            icon={<Star className="size-6" />}
            title="No reviews yet"
            description="Rate & Review becomes available from My Sessions once a booking is completed."
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {ratings.map((r) => {
              const tutor = getUser(r.tutorId)
              if (!tutor) return null
              return (
                <div key={r.id} className="flex gap-3 px-5 py-4">
                  <Avatar firstName={tutor.firstName} lastName={tutor.lastName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-800">{tutor.firstName} {tutor.lastName}</p>
                      <span className="flex shrink-0 items-center gap-0.5 text-gold-600">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-gold-500 text-gold-500" />
                        ))}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-600">{r.comment || <span className="text-neutral-400">No comment left.</span>}</p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Booking {r.bookingId} · {formatDate(r.createdAt.slice(0, 10))}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
