import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ClipboardCheck, FileSearch, FolderSearch, MoreHorizontal, ShieldCheck } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SelectInput } from '../../components/ui/Field'
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown'
import { DonutChart } from '../../components/ui/DonutChart'
import { useDb } from '../../hooks/useDb'
import { getOsasCases, getAllClearanceReviews, getPendingEvidenceCount, fullName, getUser } from '../../lib/selectors'
import { formatDate } from '../../lib/utils'

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function OsasOverviewPage() {
  const navigate = useNavigate()
  const cases = useDb(getOsasCases)
  const clearances = useDb(getAllClearanceReviews)
  const pendingEvidence = useDb(getPendingEvidenceCount)

  const openCases = cases.filter((c) => c.status === 'OPEN')
  const underReview = cases.filter((c) => c.status === 'EVIDENCE_REVIEW')
  const decided = cases.filter((c) => c.status === 'DECIDED')
  const archived = cases.filter((c) => c.status === 'ARCHIVED')
  const clearanceActionNeeded = clearances.filter((c) => c.status === 'PENDING_REVIEW' || c.status === 'REQUIRES_RESOLUTION')

  const months = useMemo(() => {
    const keys = new Set(cases.map((c) => monthKey(c.openedAt)))
    keys.add(monthKey(new Date().toISOString()))
    return [...keys].sort().reverse()
  }, [cases])
  const [month, setMonth] = useState(months[0])
  const resolvedThisMonth = decided.filter((c) => c.decision && monthKey(c.decision.decidedAt) === month).length
  const casesThisMonth = cases.filter((c) => monthKey(c.openedAt) === month)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">OSAS Overview</h1>
          <p className="text-sm text-neutral-500">Institutional overview of referred cases, evidence review, and student-clearance activity.</p>
        </div>
        <SelectInput
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          containerClassName="w-48"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m + '-01')}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={<FolderSearch className="size-5" />} value={openCases.length} label="Open Cases" sublabel="Requires attention" tone="gold" onClick={() => navigate('/osas/case-review')} />
        <StatCard icon={<FileSearch className="size-5" />} value={pendingEvidence} label="Pending Evidence Review" sublabel="Awaiting validation" tone="info" onClick={() => navigate('/osas/evidence-validation')} />
        <StatCard icon={<ShieldCheck className="size-5" />} value={underReview.length} label="Cases Under Review" sublabel="Currently being evaluated" tone="purple" onClick={() => navigate('/osas/case-review')} />
        <StatCard icon={<ClipboardCheck className="size-5" />} value={clearanceActionNeeded.length} label="Clearance Reviews" sublabel="Pending OSAS action" tone="brand" onClick={() => navigate('/osas/clearance')} />
        <StatCard icon={<Archive className="size-5" />} value={resolvedThisMonth} label="Resolved Cases" sublabel="This month" tone="success" onClick={() => navigate('/osas/archive')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Cases"
            action={
              <button onClick={() => navigate('/osas/case-review')} className="text-xs font-medium text-brand-600 hover:underline">
                View all cases →
              </button>
            }
          />
          {casesThisMonth.length === 0 ? (
            <EmptyState title="No cases opened this month" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Case ID</th>
                    <th className="px-4 py-2.5">Student / Reported User</th>
                    <th className="px-4 py-2.5">Incident Type</th>
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Date Opened</th>
                    <th className="px-4 py-2.5">Case Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {casesThisMonth.slice(0, 6).map((c, i) => {
                    const reported = getUser(c.reportedUserId)
                    return (
                      <tr key={c.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-2.5 text-neutral-400">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-neutral-700">{c.id}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-neutral-800">{fullName(reported)}</p>
                          <p className="text-[11px] text-neutral-400">ID: {reported?.studentId ?? '—'}</p>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.incidentType}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={c.priority} label={c.priority} />
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">{formatDate(c.openedAt.slice(0, 10))}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Dropdown
                            trigger={({ toggle }) => (
                              <button onClick={toggle} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100">
                                <MoreHorizontal className="size-4" />
                              </button>
                            )}
                          >
                            {(close) => (
                              <DropdownItem
                                onClick={() => {
                                  close()
                                  navigate(`/osas/case-review?case=${c.id}`)
                                }}
                              >
                                View Case
                              </DropdownItem>
                            )}
                          </Dropdown>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Pending Actions" />
            <ul className="divide-y divide-neutral-100">
              <PendingActionRow icon={<FileSearch className="size-4 text-gold-600" />} label="Evidence items requiring validation" count={pendingEvidence} onClick={() => navigate('/osas/evidence-validation')} />
              <PendingActionRow icon={<FolderSearch className="size-4 text-violet-600" />} label="Cases awaiting review" count={openCases.length + underReview.length} onClick={() => navigate('/osas/case-review')} />
              <PendingActionRow icon={<ClipboardCheck className="size-4 text-brand-700" />} label="Clearance reviews requiring action" count={clearanceActionNeeded.length} onClick={() => navigate('/osas/clearance')} />
              <PendingActionRow icon={<Archive className="size-4 text-info-600" />} label="Cases requiring documentation / follow-up" count={decided.length} onClick={() => navigate('/osas/case-review')} />
            </ul>
          </Card>

          <Card>
            <CardHeader title="Case Status Overview" />
            <div className="p-5">
              <DonutChart
                centerLabel="Total Cases"
                segments={[
                  { label: 'Open', value: openCases.length, colorClass: 'bg-gold-500', hex: '#eaa809' },
                  { label: 'Under Review', value: underReview.length, colorClass: 'bg-info-600', hex: '#2563eb' },
                  { label: 'Resolved', value: decided.length, colorClass: 'bg-success-600', hex: '#16a34a' },
                  { label: 'Archived', value: archived.length, colorClass: 'bg-neutral-400', hex: '#a3a3a3' },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="rounded-lg bg-info-50 px-4 py-3 text-sm text-info-700">
        Incident reports remain allegations until OSAS completes impartial review and records a final institutional decision.
      </div>
    </div>
  )
}

function PendingActionRow({ icon, label, count, onClick }: { icon: React.ReactNode; label: string; count: number; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-neutral-50">
        <span className="flex items-center gap-2.5 text-sm text-neutral-700">
          {icon}
          {label}
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700">{count}</span>
      </button>
    </li>
  )
}
