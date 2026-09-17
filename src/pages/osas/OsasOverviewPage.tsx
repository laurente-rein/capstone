import { useNavigate } from 'react-router-dom'
import { Archive, ClipboardCheck, FolderSearch, ShieldAlert } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getOsasCases, getAllClearanceReviews, fullName, getUser } from '../../lib/selectors'
import { formatDateTime } from '../../lib/utils'

export function OsasOverviewPage() {
  const navigate = useNavigate()
  const cases = useDb(getOsasCases)
  const clearances = useDb(getAllClearanceReviews)

  const open = cases.filter((c) => c.status === 'OPEN' || c.status === 'EVIDENCE_REVIEW')
  const decided = cases.filter((c) => c.status === 'DECIDED')
  const archived = cases.filter((c) => c.status === 'ARCHIVED')
  const holds = clearances.filter((c) => c.status === 'ON_HOLD')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">OSAS Overview</h1>
        <p className="text-sm text-neutral-500">Institutional accountability at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FolderSearch className="size-5" />} value={open.length} label="Open Cases" tone="gold" onClick={() => navigate('/osas/case-review')} />
        <StatCard icon={<ShieldAlert className="size-5" />} value={decided.length} label="Decided Cases" tone="success" onClick={() => navigate('/osas/case-review')} />
        <StatCard icon={<ClipboardCheck className="size-5" />} value={holds.length} label="Clearance Holds" tone="brand" onClick={() => navigate('/osas/clearance')} />
        <StatCard icon={<Archive className="size-5" />} value={archived.length} label="Archived Cases" tone="neutral" onClick={() => navigate('/osas/archive')} />
      </div>

      <Card>
        <CardHeader title="Cases Needing Attention" />
        {open.length === 0 ? (
          <EmptyState title="No open cases" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {open.map((c) => (
              <button key={c.id} onClick={() => navigate('/osas/case-review')} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{c.id} · {c.incidentType}</p>
                  <p className="text-xs text-neutral-500">
                    Involving {fullName(getUser(c.reportedUserId))} · Opened {formatDateTime(c.openedAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
