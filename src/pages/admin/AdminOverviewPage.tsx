import { useNavigate } from 'react-router-dom'
import { BookOpen, Briefcase, FileText, ShieldAlert, Users, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Avatar } from '../../components/ui/Avatar'
import { useDb } from '../../hooks/useDb'
import {
  getAllBookings,
  getAllPaymentsWithAllocation,
  getAllServices,
  getAllTutorApplications,
  getAllUsers,
  getIncidents,
  fullName,
  getUser,
} from '../../lib/selectors'
import { OCR_CONFIDENCE_THRESHOLD } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'

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
  const pendingApplications = applications.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW')
  const openIncidents = incidents.filter((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_ADMIN_REVIEW' || i.status === 'REFERRED_TO_OSAS')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Overview</h1>
        <p className="text-sm text-neutral-500">Monitor CampusTutor platform operations and recent activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Users className="size-5" />} value={users.length} label="Total Users" sublabel="All user accounts" tone="brand" onClick={() => navigate('/admin/users')} />
        <StatCard icon={<Users className="size-5" />} value={activeTutors} label="Active Tutors" sublabel="Currently active" tone="gold" onClick={() => navigate('/admin/users')} />
        <StatCard icon={<FileText className="size-5" />} value={pendingApplications.length} label="Pending Tutor Applications" sublabel="Awaiting review" tone="danger" onClick={() => navigate('/admin/tutor-verification')} />
        <StatCard icon={<Briefcase className="size-5" />} value={services.filter((s) => s.status === 'ACTIVE').length} label="Active Services" sublabel="Published services" tone="brand" onClick={() => navigate('/admin/services')} />
        <StatCard icon={<BookOpen className="size-5" />} value={bookings.length} label="Total Bookings" sublabel="All time bookings" tone="info" onClick={() => navigate('/admin/bookings')} />
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(grossRevenue)} label="Gross Session Payments" sublabel="Total payments received" tone="purple" onClick={() => navigate('/admin/payments')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pending Tutor Applications"
            action={
              <button onClick={() => navigate('/admin/tutor-verification')} className="text-xs font-medium text-brand-600 hover:underline">
                View All
              </button>
            }
          />
          {pendingApplications.length === 0 ? (
            <EmptyState title="No pending applications" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-2.5">Applicant</th>
                    <th className="px-4 py-2.5">Student ID</th>
                    <th className="px-4 py-2.5">OCR Review</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pendingApplications.slice(0, 5).map((a) => {
                    const applicant = getUser(a.userId)
                    const confidence = a.documents[0]?.ocrConfidence
                    if (!applicant) return null
                    return (
                      <tr key={a.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => navigate('/admin/tutor-verification')}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar firstName={applicant.firstName} lastName={applicant.lastName} size="sm" />
                            <span className="font-medium text-neutral-800">{fullName(applicant)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">{applicant.studentId}</td>
                        <td className="px-4 py-2.5">
                          {confidence !== undefined ? (
                            <div>
                              <span className={`font-semibold ${confidence >= OCR_CONFIDENCE_THRESHOLD ? 'text-success-600' : 'text-gold-600'}`}>
                                OCR {confidence}%
                              </span>
                              <p className="text-[11px] text-neutral-400">{confidence >= OCR_CONFIDENCE_THRESHOLD ? 'Review Required' : 'Manual Review'}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">Manual Review</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Incident Reports"
            icon={<ShieldAlert className="size-4" />}
            action={
              <button onClick={() => navigate('/admin/incidents')} className="text-xs font-medium text-brand-600 hover:underline">
                View All
              </button>
            }
          />
          {openIncidents.length === 0 ? (
            <EmptyState title="No open incidents" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-2.5">Incident ID</th>
                    <th className="px-4 py-2.5">Related Booking</th>
                    <th className="px-4 py-2.5">Issue Type</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {openIncidents.slice(0, 5).map((i) => (
                    <tr key={i.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => navigate('/admin/incidents')}>
                      <td className="px-4 py-2.5 font-medium text-neutral-700">{i.id}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{i.bookingId ?? '—'}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{i.incidentType}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent Bookings"
          action={
            <button onClick={() => navigate('/admin/bookings')} className="text-xs font-medium text-brand-600 hover:underline">
              View All
            </button>
          }
        />
        {bookings.length === 0 ? (
          <EmptyState title="No bookings yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                <tr>
                  <th className="px-4 py-2.5">Booking ID</th>
                  <th className="px-4 py-2.5">Learner</th>
                  <th className="px-4 py-2.5">Tutor</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Booking Status</th>
                  <th className="px-4 py-2.5">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bookings.slice(0, 4).map((b) => {
                  const service = services.find((s) => s.id === b.serviceId)
                  return (
                    <tr key={b.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => navigate('/admin/bookings')}>
                      <td className="px-4 py-2.5 font-medium text-neutral-700">{b.id}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar firstName={getUser(b.learnerId)?.firstName ?? ''} lastName={getUser(b.learnerId)?.lastName ?? ''} size="sm" />
                          {fullName(getUser(b.learnerId))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar firstName={getUser(b.tutorId)?.firstName ?? ''} lastName={getUser(b.tutorId)?.lastName ?? ''} size="sm" />
                          {fullName(getUser(b.tutorId))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-600">{service?.title ?? '—'}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{formatDate(b.date)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={b.bookingStatus} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={b.paymentStatus} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

