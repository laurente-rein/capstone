import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, GraduationCap, Search, Sparkles } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getBookingsForLearner, getTutorApplication, getUser, fullName } from '../../lib/selectors'
import { formatDate, formatTime } from '../../lib/utils'

export function LearnerDashboard() {
  const navigate = useNavigate()
  const { user, userId } = useCurrentUser()
  const bookings = useDb(() => (userId ? getBookingsForLearner(userId) : []))
  const application = useDb(() => (userId ? getTutorApplication(userId) : undefined))

  if (!user) return null

  const upcoming = bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
  const completed = bookings.filter((b) => b.bookingStatus === 'COMPLETED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-sm text-neutral-500">Here's what's happening with your tutoring journey.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<CalendarDays className="size-5" />} value={upcoming.length} label="Upcoming Sessions" tone="brand" onClick={() => navigate('/learner/sessions')} />
        <StatCard icon={<CheckCircle2 className="size-5" />} value={completed.length} label="Completed Sessions" tone="success" onClick={() => navigate('/learner/sessions')} />
        <StatCard
          icon={<GraduationCap className="size-5" />}
          value={user.roles.includes('tutor') ? 'Tutor' : application ? application.status.replace(/_/g, ' ') : 'Not Applied'}
          label="Tutor Status"
          tone="gold"
          onClick={() => navigate('/learner/apply-tutor')}
        />
        <StatCard icon={<Sparkles className="size-5" />} value={bookings.length} label="Total Sessions Booked" tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming Sessions"
            action={
              <button onClick={() => navigate('/learner/sessions')} className="text-xs font-medium text-brand-600 hover:underline">
                View all
              </button>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-6" />}
              title="No upcoming sessions"
              description="Find a tutor and book your first session."
              action={
                <Button size="sm" icon={<Search className="size-3.5" />} onClick={() => navigate('/learner/find-tutor')}>
                  Find a Tutor
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-neutral-100">
              {upcoming.slice(0, 5).map((b) => (
                <BookingRow key={b.id} tutorId={b.tutorId} serviceId={b.serviceId} date={b.date} startTime={b.startTime} endTime={b.endTime} bookingStatus={b.bookingStatus} paymentStatus={b.paymentStatus} navigate={navigate} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody className="space-y-2">
            <Button fullWidth variant="secondary" icon={<Search className="size-4" />} onClick={() => navigate('/learner/find-tutor')}>
              Find a Tutor
            </Button>
            <Button fullWidth variant="outline" icon={<CalendarDays className="size-4" />} onClick={() => navigate('/learner/sessions')}>
              View My Sessions
            </Button>
            {!user.roles.includes('tutor') && (
              <Button fullWidth variant="outline" icon={<GraduationCap className="size-4" />} onClick={() => navigate('/learner/apply-tutor')}>
                Apply as Tutor
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function BookingRow({
  tutorId,
  serviceId,
  date,
  startTime,
  endTime,
  bookingStatus,
  paymentStatus,
  navigate,
}: {
  tutorId: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  bookingStatus: string
  paymentStatus: string
  navigate: (p: string) => void
}) {
  const tutor = useDb(() => getUser(tutorId))
  const service = useDb((db) => db.services.find((s) => s.id === serviceId))
  return (
    <button onClick={() => navigate('/learner/sessions')} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-neutral-50">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-800">{service?.title ?? 'Service'} with {fullName(tutor)}</p>
        <p className="text-xs text-neutral-500">
          {formatDate(date)} · {formatTime(startTime)}–{formatTime(endTime)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <StatusBadge status={bookingStatus} />
        <StatusBadge status={paymentStatus} />
      </div>
    </button>
  )
}
