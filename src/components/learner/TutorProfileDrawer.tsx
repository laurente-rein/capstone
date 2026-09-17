import { useState } from 'react'
import { Star, Video, MapPin, Layers } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { useDb } from '../../hooks/useDb'
import { getRatingsForTutor, getServicesForTutor, getTutorProfile, getUser } from '../../lib/selectors'
import { formatCurrency, timeAgo } from '../../lib/utils'
import { BookingFlowModal } from './BookingFlowModal'
import type { Service } from '../../types'

export function TutorProfileDrawer({
  tutorId,
  onClose,
  learnerId,
}: {
  tutorId: string | null
  onClose: () => void
  learnerId: string
}) {
  const tutor = useDb(() => (tutorId ? getUser(tutorId) : undefined))
  const profile = useDb(() => (tutorId ? getTutorProfile(tutorId) : undefined))
  const services = useDb(() => (tutorId ? getServicesForTutor(tutorId).filter((s) => s.status === 'ACTIVE') : []))
  const ratings = useDb(() => (tutorId ? getRatingsForTutor(tutorId) : []))
  const [bookingService, setBookingService] = useState<Service | null>(null)

  return (
    <>
      <Drawer open={!!tutorId} onClose={onClose} title="Tutor Profile">
        {tutor && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar firstName={tutor.firstName} lastName={tutor.lastName} size="lg" />
              <div>
                <p className="text-base font-semibold text-neutral-900">{tutor.firstName} {tutor.lastName}</p>
                <p className="text-xs text-neutral-500">{tutor.program}</p>
                <div className="mt-1 flex items-center gap-1 text-sm text-gold-600">
                  <Star className="size-3.5 fill-gold-500 text-gold-500" />
                  <span className="font-medium">{profile?.averageRating.toFixed(1) ?? '0.0'}</span>
                  <span className="text-xs text-neutral-400">({profile?.ratingCount ?? 0} reviews)</span>
                </div>
              </div>
            </div>

            {profile?.bio && <p className="text-sm text-neutral-600">{profile.bio}</p>}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Services</p>
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                        <p className="text-xs text-neutral-500">{s.level}</p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold text-brand-700">{formatCurrency(s.hourlyRate)}/hr</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.topics.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                        {s.sessionType === 'ONLINE' && <Video className="size-3" />}
                        {s.sessionType === 'IN_PERSON' && <MapPin className="size-3" />}
                        {s.sessionType === 'BOTH' && <Layers className="size-3" />}
                        {s.sessionType === 'BOTH' ? 'Online or In-Person' : s.sessionType === 'ONLINE' ? 'Online' : 'In-Person'}
                      </span>
                      <Button size="sm" onClick={() => setBookingService(s)}>
                        Book
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Reviews</p>
              {ratings.length === 0 ? (
                <p className="text-sm text-neutral-400">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {ratings.slice(0, 5).map((r) => {
                    const learner = getUser(r.learnerId)
                    return (
                      <div key={r.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-700">{learner?.firstName} {learner?.lastName?.[0]}.</span>
                          <span className="flex items-center gap-0.5 text-gold-600">
                            {Array.from({ length: r.stars }).map((_, i) => (
                              <Star key={i} className="size-3 fill-gold-500 text-gold-500" />
                            ))}
                          </span>
                        </div>
                        <p className="text-neutral-500">{r.comment}</p>
                        <p className="text-[11px] text-neutral-300">{timeAgo(r.createdAt)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {tutor && bookingService && (
        <BookingFlowModal open tutor={tutor} service={bookingService} learnerId={learnerId} onClose={() => setBookingService(null)} />
      )}
    </>
  )
}
