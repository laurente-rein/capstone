import { useState } from 'react'
import { Heart, Star } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getSavedTutorIds, getServicesForTutor, getTutorProfile, getUser } from '../../lib/selectors'
import { formatCurrency } from '../../lib/utils'
import { SaveTutorButton } from '../../components/learner/SaveTutorButton'
import { TutorProfileDrawer } from '../../components/learner/TutorProfileDrawer'

export function SavedTutorsPage() {
  const { userId } = useCurrentUser()
  const savedIds = useDb(() => (userId ? getSavedTutorIds(userId) : []))
  const [activeTutor, setActiveTutor] = useState<string | null>(null)

  if (!userId) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Saved Tutors</h1>
        <p className="text-sm text-neutral-500">Tutors you've bookmarked for later.</p>
      </div>

      {savedIds.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Heart className="size-6" />}
            title="No saved tutors yet"
            description="Tap the heart icon on a tutor's profile or card to save them here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedIds.map((tutorId) => {
            const tutor = getUser(tutorId)
            const profile = getTutorProfile(tutorId)
            const services = getServicesForTutor(tutorId).filter((s) => s.status === 'ACTIVE')
            if (!tutor) return null
            return (
              <Card key={tutorId} className="relative flex flex-col p-4">
                <SaveTutorButton learnerId={userId} tutorId={tutorId} className="absolute right-3 top-3" />
                <div className="flex items-center gap-3">
                  <Avatar firstName={tutor.firstName} lastName={tutor.lastName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{tutor.firstName} {tutor.lastName}</p>
                    <div className="flex items-center gap-1 text-xs text-gold-600">
                      <Star className="size-3 fill-gold-500 text-gold-500" />
                      {profile?.averageRating.toFixed(1) ?? '0.0'}
                      <span className="text-neutral-400">({profile?.ratingCount ?? 0})</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {services.length > 0 ? services.map((s) => s.subject).join(', ') : 'No active services right now'}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  {services[0] ? (
                    <p className="text-sm font-bold text-brand-700">
                      {formatCurrency(Math.min(...services.map((s) => s.hourlyRate)))}
                      <span className="text-xs font-normal text-neutral-400">/hr</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setActiveTutor(tutorId)}>
                    View Profile
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TutorProfileDrawer tutorId={activeTutor} onClose={() => setActiveTutor(null)} learnerId={userId} />
    </div>
  )
}
