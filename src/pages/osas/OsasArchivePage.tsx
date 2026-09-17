import { Archive } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getOsasCases, fullName, getUser } from '../../lib/selectors'
import { formatDateTime } from '../../lib/utils'

export function OsasArchivePage() {
  const archived = useDb(getOsasCases).filter((c) => c.status === 'ARCHIVED')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Case Archive</h1>
        <p className="text-sm text-neutral-500">Resolved institutional records — read-only.</p>
      </div>

      <Card>
        {archived.length === 0 ? (
          <EmptyState icon={<Archive className="size-6" />} title="No archived cases yet" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {archived.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{c.id} · {c.incidentType}</p>
                  <p className="text-xs text-neutral-500">
                    {fullName(getUser(c.reportedUserId))} · Decision: {c.decision?.decision ?? '—'}
                  </p>
                  <p className="text-[11px] text-neutral-400">Decided {c.decision ? formatDateTime(c.decision.decidedAt) : '—'}</p>
                </div>
                <StatusBadge status="ARCHIVED" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
