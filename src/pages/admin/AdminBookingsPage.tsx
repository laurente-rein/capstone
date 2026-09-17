import { useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getAllBookings, fullName, getUser } from '../../lib/selectors'
import { formatCurrency, formatDate } from '../../lib/utils'

export function AdminBookingsPage() {
  const bookings = useDb(getAllBookings)
  const [query, setQuery] = useState('')

  const filtered = bookings.filter((b) => {
    const learner = fullName(getUser(b.learnerId)).toLowerCase()
    const tutor = fullName(getUser(b.tutorId)).toLowerCase()
    return b.id.toLowerCase().includes(query.toLowerCase()) || learner.includes(query.toLowerCase()) || tutor.includes(query.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Bookings Monitoring</h1>
        <p className="text-sm text-neutral-500">Read-only visibility into all platform bookings.</p>
      </div>

      <Card>
        <div className="border-b border-neutral-100 p-4">
          <TextInput icon={<Search className="size-4" />} placeholder="Search by booking ID, learner, or tutor…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<BookOpen className="size-6" />} title="No bookings found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-2.5">Booking</th>
                  <th className="px-5 py-2.5">Learner</th>
                  <th className="px-5 py-2.5">Tutor</th>
                  <th className="px-5 py-2.5">Date/Time</th>
                  <th className="px-5 py-2.5">Type</th>
                  <th className="px-5 py-2.5">Amount</th>
                  <th className="px-5 py-2.5">Booking Status</th>
                  <th className="px-5 py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-2.5 font-medium text-neutral-700">{b.id}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{fullName(getUser(b.learnerId))}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{fullName(getUser(b.tutorId))}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{formatDate(b.date)} · {b.startTime}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{b.sessionType === 'ONLINE' ? 'Online' : 'In-Person'}</td>
                    <td className="px-5 py-2.5 text-neutral-600">{formatCurrency(b.amount)}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={b.bookingStatus} /></td>
                    <td className="px-5 py-2.5"><StatusBadge status={b.paymentStatus} /></td>
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
