import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Code2,
  FlaskConical,
  Grid2x2,
  Heart,
  MessageCircle,
  Search,
  Star,
  Users,
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { SelectInput } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Avatar'
import { SaveTutorButton } from '../../components/learner/SaveTutorButton'
import { TutorProfileDrawer } from '../../components/learner/TutorProfileDrawer'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import {
  getActiveServices,
  getBookingsForLearner,
  getRatingsGivenByLearner,
  getSavedTutorIds,
  getTutorProfile,
  getUser,
  fullName,
  isTutorAvailableToday,
  searchTutorServices,
  type TutorDiscoveryFilters,
} from '../../lib/selectors'
import { POPULAR_SUBJECTS, TUTOR_CATEGORY_GROUPS } from '../../lib/constants'
import { formatCurrency, formatDate, formatTime } from '../../lib/utils'

const CATEGORY_ICONS = [FlaskConical, Code2, Briefcase, MessageCircle, BookOpen]

const LEVELS = ['College - 1st Year', 'College - 1st/2nd Year', 'College - 2nd Year', 'College - 2nd/3rd Year', 'College - 3rd Year']

export function LearnerDashboard() {
  const navigate = useNavigate()
  const { user, userId } = useCurrentUser()
  const bookings = useDb(() => (userId ? getBookingsForLearner(userId) : []))
  const savedIds = useDb(() => (userId ? getSavedTutorIds(userId) : []))
  const givenRatings = useDb(() => (userId ? getRatingsGivenByLearner(userId) : []))
  const activeServices = useDb(getActiveServices)

  const [filters, setFilters] = useState<TutorDiscoveryFilters>({})
  const [activeSubjectPill, setActiveSubjectPill] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTutor, setActiveTutor] = useState<string | null>(null)

  const filteredServices = useDb(() =>
    searchTutorServices({ ...filters, query: activeSubjectPill ?? filters.query }),
  )
  const recommended = useMemo(() => {
    const group = TUTOR_CATEGORY_GROUPS.find((g) => g.label === activeCategory)
    const base = group ? filteredServices.filter((s) => group.categories.includes(s.category)) : filteredServices
    return base.slice(0, 4)
  }, [filteredServices, activeCategory])

  if (!user || !userId) return null

  const upcoming = bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
  const availableTutorCount = new Set(activeServices.map((s) => s.tutorId)).size
  const avgGivenRating = givenRatings.length ? givenRatings.reduce((s, r) => s + r.stars, 0) / givenRatings.length : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-sm text-neutral-500">Let's continue your learning journey.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} value={availableTutorCount} label="Available Tutors" sublabel="Active services" tone="brand" onClick={() => navigate('/learner/find-tutor')} />
        <StatCard icon={<CalendarDays className="size-5" />} value={upcoming.length} label="Upcoming Sessions" sublabel="This week" tone="gold" onClick={() => navigate('/learner/sessions')} />
        <StatCard icon={<Heart className="size-5" />} value={savedIds.length} label="Saved Tutors" sublabel="View your list" tone="success" onClick={() => navigate('/learner/saved-tutors')} />
        <StatCard icon={<Star className="size-5" />} value={avgGivenRating ? avgGivenRating.toFixed(1) : '—'} label="Average Rating" sublabel="Your sessions" tone="info" onClick={() => navigate('/learner/my-reviews')} />
      </div>

      <Card>
        <CardHeader title="Find the perfect tutor for you" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SelectInput label="Subject" placeholder="All Subjects" value={filters.subject ?? ''} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value || undefined }))}>
              {[...new Set(activeServices.map((s) => s.category))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Level" placeholder="All Levels" value={filters.level ?? ''} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value || undefined }))}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Availability" placeholder="All Availability" value={filters.sessionType ?? ''} onChange={(e) => setFilters((f) => ({ ...f, sessionType: e.target.value || undefined }))}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In-Person</option>
            </SelectInput>
            <SelectInput label="Sort by" placeholder="Highest Rated" value={filters.sort ?? ''} onChange={(e) => setFilters((f) => ({ ...f, sort: (e.target.value || undefined) as any }))}>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </SelectInput>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-neutral-500">Popular Subjects</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSubjectPill((prev) => (prev === s ? null : s))}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    activeSubjectPill === s ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-neutral-500">Tutor Categories</p>
            <div className="flex flex-wrap gap-2">
              {TUTOR_CATEGORY_GROUPS.map((g, i) => {
                const Icon = CATEGORY_ICONS[i] ?? Grid2x2
                const active = activeCategory === g.label
                return (
                  <button
                    key={g.label}
                    onClick={() => setActiveCategory((prev) => (prev === g.label ? null : g.label))}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {g.label}
                  </button>
                )
              })}
              <button
                onClick={() => setActiveCategory((prev) => (prev === 'Others' ? null : 'Others'))}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  activeCategory === 'Others' ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
                }`}
              >
                <Grid2x2 className="size-3.5" />
                Others
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Recommended Tutors"
          subtitle="Highly rated tutors ready to help you succeed."
          action={
            <button onClick={() => navigate('/learner/find-tutor')} className="text-xs font-medium text-brand-600 hover:underline">
              View all tutors
            </button>
          }
        />
        {recommended.length === 0 ? (
          <EmptyState icon={<Search className="size-6" />} title="No tutors match this filter" description="Try a different subject or category." />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((svc) => {
              const tutor = getUser(svc.tutorId)
              const profile = getTutorProfile(svc.tutorId)
              if (!tutor) return null
              const availableToday = isTutorAvailableToday(svc.tutorId)
              return (
                <div key={svc.id} className="relative flex flex-col rounded-xl border border-neutral-200 p-4">
                  <SaveTutorButton learnerId={userId} tutorId={tutor.id} className="absolute right-3 top-3" />
                  <div className="flex items-center gap-1">
                    {availableToday && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-success-600">
                        <span className="size-1.5 rounded-full bg-success-500" /> Online
                      </span>
                    )}
                  </div>
                  <Avatar firstName={tutor.firstName} lastName={tutor.lastName} size="lg" />
                  <p className="mt-2 text-sm font-semibold text-neutral-900">{tutor.firstName} {tutor.lastName}</p>
                  <p className="text-xs text-neutral-500">{svc.subject}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gold-600">
                    <Star className="size-3 fill-gold-500 text-gold-500" />
                    {profile?.averageRating.toFixed(1) ?? '0.0'}
                    <span className="text-neutral-400">({profile?.ratingCount ?? 0} reviews)</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-brand-700">
                    {formatCurrency(svc.hourlyRate)} <span className="text-xs font-normal text-neutral-400">/ hour</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" fullWidth onClick={() => setActiveTutor(tutor.id)}>
                      View Profile
                    </Button>
                    <Button size="sm" fullWidth onClick={() => setActiveTutor(tutor.id)}>
                      Book Now
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

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
              <Button fullWidth variant="outline" icon={<Users className="size-4" />} onClick={() => navigate('/learner/apply-tutor')}>
                Apply as Tutor
              </Button>
            )}
          </CardBody>
        </Card>
      </div>

      <TutorProfileDrawer tutorId={activeTutor} onClose={() => setActiveTutor(null)} learnerId={userId} />
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
