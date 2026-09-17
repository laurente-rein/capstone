import { useState } from 'react'
import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { SelectInput, TextInput } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getTutorProfile, getUser, searchTutorServices, type TutorDiscoveryFilters } from '../../lib/selectors'
import { SUBJECT_CATEGORIES } from '../../lib/constants'
import { formatCurrency } from '../../lib/utils'
import { TutorProfileDrawer } from '../../components/learner/TutorProfileDrawer'
import { SaveTutorButton } from '../../components/learner/SaveTutorButton'

const LEVELS = ['College - 1st Year', 'College - 1st/2nd Year', 'College - 2nd/3rd Year', 'College - 2nd Year', 'College - 3rd Year']

export function FindTutorPage() {
  const { userId } = useCurrentUser()
  const [filters, setFilters] = useState<TutorDiscoveryFilters>({})
  const [query, setQuery] = useState('')
  const services = useDb(() => searchTutorServices({ ...filters, query }))
  const [activeTutor, setActiveTutor] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Find a Tutor</h1>
        <p className="text-sm text-neutral-500">Browse active tutoring services from fellow CSU students.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <TextInput
            icon={<Search className="size-4" />}
            placeholder="Search subject, topic, or tutor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SelectInput placeholder="All Subjects" value={filters.subject ?? ''} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value || undefined }))}>
            {SUBJECT_CATEGORIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
          <SelectInput placeholder="All Levels" value={filters.level ?? ''} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value || undefined }))}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </SelectInput>
          <SelectInput placeholder="Any Session Type" value={filters.sessionType ?? ''} onChange={(e) => setFilters((f) => ({ ...f, sessionType: e.target.value || undefined }))}>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In-Person</option>
          </SelectInput>
          <SelectInput placeholder="Sort by" value={filters.sort ?? ''} onChange={(e) => setFilters((f) => ({ ...f, sort: (e.target.value || undefined) as any }))}>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </SelectInput>
        </div>
      </Card>

      {services.length === 0 ? (
        <Card>
          <EmptyState icon={<SlidersHorizontal className="size-6" />} title="No tutors match your filters" description="Try adjusting your search or filters." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => {
            const tutor = getUser(svc.tutorId)
            const profile = getTutorProfile(svc.tutorId)
            if (!tutor) return null
            return (
              <Card key={svc.id} className="relative flex flex-col p-4">
                {userId && <SaveTutorButton learnerId={userId} tutorId={tutor.id} className="absolute right-3 top-3" />}
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
                <p className="mt-3 text-sm font-semibold text-neutral-800">{svc.title}</p>
                <p className="line-clamp-2 text-xs text-neutral-500">{svc.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {svc.topics.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="text-sm font-bold text-brand-700">{formatCurrency(svc.hourlyRate)}<span className="text-xs font-normal text-neutral-400">/hr</span></p>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTutor(svc.tutorId)}>
                    View Profile
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {userId && <TutorProfileDrawer tutorId={activeTutor} onClose={() => setActiveTutor(null)} learnerId={userId} />}
    </div>
  )
}
