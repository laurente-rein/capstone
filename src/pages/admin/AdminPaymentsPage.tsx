import { CreditCard, TrendingUp, Wallet } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getAllPaymentsWithAllocation, fullName, getUser } from '../../lib/selectors'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { PAYMENT_METHOD, PAYMENT_PROVIDER } from '../../lib/constants'

export function AdminPaymentsPage() {
  const rows = useDb(getAllPaymentsWithAllocation)

  const gross = rows.reduce((s, r) => s + r.payment.grossAmount, 0)
  const tutorTotal = rows.reduce((s, r) => s + (r.allocation?.tutorShare ?? 0), 0)
  const osasTotal = rows.reduce((s, r) => s + (r.allocation?.osasShare ?? 0), 0)
  const platformTotal = rows.reduce((s, r) => s + (r.allocation?.platformShare ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Payments & Transactions</h1>
        <p className="text-sm text-neutral-500">
          All payments are processed via {PAYMENT_PROVIDER} ({PAYMENT_METHOD}). Allocation: 90% Tutor / 5% OSAS / 5% Platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Wallet className="size-5" />} value={formatCurrency(gross)} label="Gross Session Payments" tone="neutral" />
        <StatCard icon={<TrendingUp className="size-5" />} value={formatCurrency(tutorTotal)} label="Tutor Share (90%)" tone="brand" />
        <StatCard icon={<CreditCard className="size-5" />} value={formatCurrency(osasTotal)} label="OSAS Share (5%)" tone="info" />
        <StatCard icon={<CreditCard className="size-5" />} value={formatCurrency(platformTotal)} label="Platform Revenue (5%)" tone="gold" />
      </div>

      <Card>
        <CardHeader title="Transactions" />
        {rows.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-2.5">Transaction</th>
                  <th className="px-5 py-2.5">Booking</th>
                  <th className="px-5 py-2.5">Learner</th>
                  <th className="px-5 py-2.5">Tutor</th>
                  <th className="px-5 py-2.5">Gross</th>
                  <th className="px-5 py-2.5">Tutor / OSAS / Platform</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map(({ payment, allocation, booking }) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-500">{payment.providerReferenceId}</td>
                    <td className="px-5 py-2.5 font-medium text-neutral-700">{payment.bookingId}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{booking ? fullName(getUser(booking.learnerId)) : '—'}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{booking ? fullName(getUser(booking.tutorId)) : '—'}</td>
                    <td className="px-5 py-2.5 text-neutral-700">{formatCurrency(payment.grossAmount)}</td>
                    <td className="px-5 py-2.5 text-xs text-neutral-500">
                      {formatCurrency(allocation?.tutorShare ?? 0)} / {formatCurrency(allocation?.osasShare ?? 0)} / {formatCurrency(allocation?.platformShare ?? 0)}
                    </td>
                    <td className="px-5 py-2.5"><StatusBadge status={payment.status} /></td>
                    <td className="px-5 py-2.5 text-neutral-400">{formatDateTime(payment.createdAt)}</td>
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
