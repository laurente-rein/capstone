import { CheckCircle2, TrendingUp, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { computeTutorEarnings, fullName, getUser } from '../../lib/selectors'
import { formatCurrency, formatDate } from '../../lib/utils'

export function TutorEarningsPage() {
  const { userId } = useCurrentUser()
  const earnings = useDb(() => (userId ? computeTutorEarnings(userId) : null))

  if (!userId || !earnings) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Earnings</h1>
        <p className="text-sm text-neutral-500">Your tutoring income from completed, paid sessions.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(earnings.gross)} label="Gross Session Amount" tone="neutral" />
        <StatCard icon={<TrendingUp className="size-5" />} value={formatCurrency(earnings.tutorShare)} label="Tutor Earnings (90%)" tone="brand" />
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(earnings.osasShare)} label="OSAS Share (5%)" tone="info" />
        <StatCard icon={<CheckCircle2 className="size-5" />} value={earnings.completedPaidCount} label="Completed Paid Sessions" tone="success" />
      </div>

      <Card>
        <CardHeader title="Transaction History" />
        {earnings.rows.length === 0 ? (
          <EmptyState title="No earnings yet" description="Completed and paid sessions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-2.5">Booking</th>
                  <th className="px-5 py-2.5">Learner</th>
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">Gross</th>
                  <th className="px-5 py-2.5">Your Share</th>
                  <th className="px-5 py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {earnings.rows.map(({ booking, alloc }) => (
                  <tr key={booking.id}>
                    <td className="px-5 py-2.5 font-medium text-neutral-700">{booking.id}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{fullName(getUser(booking.learnerId))}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{formatDate(booking.date)}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{formatCurrency(booking.amount)}</td>
                    <td className="px-5 py-2.5 font-semibold text-brand-700">{formatCurrency(alloc?.tutorShare ?? 0)}</td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={booking.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
