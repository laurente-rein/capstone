import { ShieldAlert } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import { getIncidents, getOsasCases, fullName, getUser } from '../../lib/selectors'
import { formatDateTime } from '../../lib/utils'

export function OsasIncidentMonitoringPage() {
  const incidents = useDb(getIncidents).filter((i) => i.status === 'REFERRED_TO_OSAS')
  const cases = useDb(getOsasCases)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Incident Monitoring</h1>
        <p className="text-sm text-neutral-500">Incidents Admin has referred for institutional review.</p>
      </div>

      <Card>
        {incidents.length === 0 ? (
          <EmptyState icon={<ShieldAlert className="size-6" />} title="No referred incidents" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {incidents.map((i) => {
              const linkedCase = cases.find((c) => c.incidentReportId === i.id)
              return (
                <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{i.id} · {i.incidentType}</p>
                    <p className="text-xs text-neutral-500">
                      {fullName(getUser(i.reporterId))} reported {fullName(getUser(i.reportedUserId))} · {formatDateTime(i.createdAt)}
                    </p>
                    {i.adminNotes && <p className="mt-0.5 text-xs text-neutral-400">Admin notes: {i.adminNotes}</p>}
                  </div>
                  {linkedCase && <StatusBadge status={linkedCase.status} />}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
