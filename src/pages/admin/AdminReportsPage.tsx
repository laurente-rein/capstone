import { Briefcase, BookOpen, TrendingUp, Users, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { useDb } from '../../hooks/useDb'
import { getAllBookings, getAllPaymentsWithAllocation, getAllServices, getAllUsers } from '../../lib/selectors'
import { formatCurrency } from '../../lib/utils'

export function AdminReportsPage() {
  const users = useDb(getAllUsers)
  const services = useDb(getAllServices)
  const bookings = useDb(getAllBookings)
  const payments = useDb(getAllPaymentsWithAllocation)

  const activeTutors = users.filter((u) => u.roles.includes('tutor')).length
  const completed = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length
  const gross = payments.reduce((s, p) => s + p.payment.grossAmount, 0)
  const platform = payments.reduce((s, p) => s + (p.allocation?.platformShare ?? 0), 0)
  const tutorShare = payments.reduce((s, p) => s + (p.allocation?.tutorShare ?? 0), 0)
  const osasShare = payments.reduce((s, p) => s + (p.allocation?.osasShare ?? 0), 0)

  const subjectCounts = new Map<string, number>()
  services.forEach((s) => subjectCounts.set(s.category, (subjectCounts.get(s.category) ?? 0) + bookings.filter((b) => b.serviceId === s.id).length))
  const popularSubjects = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxSubjectCount = Math.max(1, ...popularSubjects.map(([, c]) => c))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Reports & Analytics</h1>
        <p className="text-sm text-neutral-500">Platform-wide performance summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} value={users.length} label="Total Users" tone="brand" />
        <StatCard icon={<Users className="size-5" />} value={activeTutors} label="Active Tutors" tone="gold" />
        <StatCard icon={<Briefcase className="size-5" />} value={services.filter((s) => s.status === 'ACTIVE').length} label="Active Services" tone="info" />
        <StatCard icon={<BookOpen className="size-5" />} value={bookings.length} label="Total Bookings" sublabel={`${completed} completed`} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Financial Summary" icon={<Wallet className="size-4" />} />
          <div className="space-y-3 p-5 text-sm">
            <Row label="Gross Session Payments" value={formatCurrency(gross)} />
            <Row label="Tutor Share (90%)" value={formatCurrency(tutorShare)} />
            <Row label="OSAS Share (5%)" value={formatCurrency(osasShare)} />
            <Row label="Platform Revenue (5%)" value={formatCurrency(platform)} bold />
          </div>
        </Card>

        <Card>
          <CardHeader title="Popular Subjects" icon={<TrendingUp className="size-4" />} />
          <div className="space-y-3 p-5">
            {popularSubjects.length === 0 ? (
              <p className="text-sm text-neutral-400">No booking data yet.</p>
            ) : (
              popularSubjects.map(([subject, count]) => (
                <div key={subject}>
                  <div className="mb-1 flex justify-between text-xs text-neutral-500">
                    <span>{subject}</span>
                    <span>{count} bookings</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(count / maxSubjectCount) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}>{value}</span>
    </div>
  )
}
