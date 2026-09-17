import { useNavigate } from 'react-router-dom'
import { BookOpen, ShieldAlert, ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getAllBookings, getAllPaymentsWithAllocation, getAllServices, getAllTutorApplications, getAllUsers, getIncidents, fullName, getUser } from '../../lib/selectors'
import { formatCurrency, formatDateTime } from '../../lib/utils'

export function AdminOverviewPage() {
  const navigate = useNavigate()
  const users = useDb(getAllUsers)
  const services = useDb(getAllServices)
  const bookings = useDb(getAllBookings)
  const payments = useDb(getAllPaymentsWithAllocation)
  const applications = useDb(getAllTutorApplications)
  const incidents = useDb(getIncidents)

  const activeTutors = users.filter((u) => u.roles.includes('tutor')).length
  const grossRevenue = payments.reduce((s, p) => s + p.payment.grossAmount, 0)
  const platformRevenue = payments.reduce((s, p) => s + (p.allocation?.platformShare ?? 0), 0)
  const pendingApplications = applications.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW')
  const openIncidents = incidents.filter((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_ADMIN_REVIEW')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Overview</h1>
        <p className="text-sm text-neutral-500">Platform-wide activity at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} value={users.length} label="Total Users" sublabel={`${activeTutors} tutors`} tone="brand" onClick={() => navigate('/admin/users')} />
        <StatCard icon={<BookOpen className="size-5" />} value={bookings.length} label="Total Bookings" sublabel={`${bookings.filter((b) => b.bookingStatus === 'COMPLETED').length} completed`} tone="info" onClick={() => navigate('/admin/bookings')} />
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(grossRevenue)} label="Gross Session Payments" tone="success" onClick={() => navigate('/admin/payments')} />
        <StatCard icon={<TrendingUp className="size-5" />} value={formatCurrency(platformRevenue)} label="Platform Revenue (5%)" tone="gold" onClick={() => navigate('/admin/payments')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pending Tutor Applications"
            icon={<ShieldCheck className="size-4" />}
            action={
              <button onClick={() => navigate('/admin/tutor-verification')} className="text-xs font-medium text-brand-600 hover:underline">
                Review all
              </button>
            }
          />
          {pendingApplications.length === 0 ? (
            <EmptyState title="No pending applications" />
          ) : (
            <div className="divide-y divide-neutral-100">
              {pendingApplications.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{fullName(getUser(a.userId))}</p>
                    <p className="text-xs text-neutral-500">{a.subjects.join(', ')}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Open Incident Reports"
            icon={<ShieldAlert className="size-4" />}
            action={
              <button onClick={() => navigate('/admin/incidents')} className="text-xs font-medium text-brand-600 hover:underline">
                Review all
              </button>
            }
          />
          {openIncidents.length === 0 ? (
            <EmptyState title="No open incidents" />
          ) : (
            <div className="divide-y divide-neutral-100">
              {openIncidents.slice(0, 5).map((i) => (
                <div key={i.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{i.id} · {i.incidentType}</p>
                    <p className="text-xs text-neutral-500">{formatDateTime(i.createdAt)}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Active Services" subtitle={`${services.filter((s) => s.status === 'ACTIVE').length} of ${services.length} services active`} />
      </Card>
    </div>
  )
}
