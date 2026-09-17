import { useNavigate } from 'react-router-dom'
import { Briefcase, CalendarClock, CalendarDays, CheckCircle2, Lock, Star, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import {
  computeTutorEarnings,
  getBookableAvailability,
  getBookingsForTutor,
  getServicesForTutor,
  getTutorProfile,
  hasConfirmedClassSchedule,
  fullName,
  getUser,
} from '../../lib/selectors'
import { formatCurrency, formatDate, formatTime, todayStr } from '../../lib/utils'

export function TutorDashboard() {
  const navigate = useNavigate()
  const { user, userId } = useCurrentUser()
  const bookings = useDb(() => (userId ? getBookingsForTutor(userId) : []))
  const services = useDb(() => (userId ? getServicesForTutor(userId) : []))
  const profile = useDb(() => (userId ? getTutorProfile(userId) : undefined))
  const hasSchedule = useDb(() => (userId ? hasConfirmedClassSchedule(userId) : false))
  const availableSlots = useDb(() => (userId ? getBookableAvailability(userId) : []))
  const earnings = useDb(() => (userId ? computeTutorEarnings(userId) : { tutorShare: 0 }))

  if (!user || !userId) return null

  const upcoming = bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
  const completed = bookings.filter((b) => b.bookingStatus === 'COMPLETED')
  const today = todayStr()
  const thisWeekSlots = availableSlots.filter((s) => s.date >= today)
  const nextSlot = [...thisWeekSlots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-sm text-neutral-500">Here's a concise overview of your tutoring activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={<Briefcase className="size-5" />} value={services.filter((s) => s.status === 'ACTIVE').length} label="Active Services" sublabel="This semester" tone="brand" onClick={() => navigate('/tutor/services')} />
        <StatCard icon={<CalendarDays className="size-5" />} value={upcoming.length} label="Upcoming Sessions" sublabel="This week" tone="gold" onClick={() => navigate('/tutor/sessions')} />
        <StatCard icon={<CheckCircle2 className="size-5" />} value={completed.length} label="Completed Sessions" sublabel="This semester" tone="success" onClick={() => navigate('/tutor/sessions')} />
        <StatCard icon={<Star className="size-5" />} value={profile?.averageRating.toFixed(1) ?? '0.0'} label="Average Rating" sublabel="View reviews" tone="info" />
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(earnings.tutorShare)} label="Tutor Earnings" sublabel="90% tutor share" tone="brand" onClick={() => navigate('/tutor/earnings')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming Sessions"
            action={
              <button onClick={() => navigate('/tutor/sessions')} className="text-xs font-medium text-brand-600 hover:underline">
                View all sessions
              </button>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState icon={<CalendarDays className="size-6" />} title="No upcoming sessions" description="Your confirmed bookings will show up here." />
          ) : (
            <div className="divide-y divide-neutral-100">
              {upcoming.slice(0, 5).map((b) => {
                const learner = getUser(b.learnerId)
                return (
                  <button key={b.id} onClick={() => navigate('/tutor/sessions')} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-neutral-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-800">{fullName(learner)} · {b.specificTopic}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(b.date)} · {formatTime(b.startTime)}–{formatTime(b.endTime)} · {b.sessionType === 'ONLINE' ? b.meetingPlatform : 'In Person'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <StatusBadge status={b.bookingStatus} />
                      <StatusBadge status={b.paymentStatus} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody className="space-y-2">
            <Button
              fullWidth
              variant="secondary"
              icon={hasSchedule ? <Briefcase className="size-4" /> : <Lock className="size-4" />}
              onClick={() => navigate('/tutor/services')}
            >
              Create Service
            </Button>
            <Button fullWidth variant="outline" icon={<CalendarClock className="size-4" />} onClick={() => navigate('/tutor/availability')}>
              Manage Availability
            </Button>
            <Button fullWidth variant="outline" icon={<CalendarDays className="size-4" />} onClick={() => navigate('/tutor/availability')}>
              View Class Schedule
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Availability Summary" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-success-50 text-success-600">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{thisWeekSlots.length} open slots this week</p>
                <p className="text-xs text-neutral-500">{nextSlot ? `Next available: ${formatDate(nextSlot.date)} · ${formatTime(nextSlot.startTime)}` : 'No open slots yet'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-3.5 py-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-700">
                    Class Schedule: <span className="font-semibold">{hasSchedule ? 'Uploaded & Confirmed' : 'Required'}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={hasSchedule ? 'CONFIRMED' : 'PENDING'} label={hasSchedule ? 'Confirmed' : 'Action needed'} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent Activity / Notifications" />
          <RecentActivity userId={userId} />
        </Card>
      </div>
    </div>
  )
}

function RecentActivity({ userId }: { userId: string }) {
  const notifications = useDb((db) => db.notifications.filter((n) => n.userId === userId).slice(0, 4))
  if (!notifications.length) {
    return <EmptyState title="No recent activity" />
  }
  return (
    <div className="divide-y divide-neutral-100">
      {notifications.map((n) => (
        <div key={n.id} className="px-5 py-3">
          <p className="text-sm text-neutral-800">{n.body}</p>
          <p className="text-xs text-neutral-400">{formatDate(n.createdAt.slice(0, 10))}</p>
        </div>
      ))}
    </div>
  )
}
