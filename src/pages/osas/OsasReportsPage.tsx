import { Archive, ClipboardCheck, FolderSearch, ShieldAlert } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { useDb } from '../../hooks/useDb'
import { getAllClearanceReviews, getIncidents, getOsasCases, getSettings } from '../../lib/selectors'

export function OsasReportsPage() {
  const cases = useDb(getOsasCases)
  const incidents = useDb(getIncidents).filter((i) => i.status === 'REFERRED_TO_OSAS')
  const clearances = useDb(getAllClearanceReviews)
  const settings = useDb(getSettings)

  const open = cases.filter((c) => c.status === 'OPEN' || c.status === 'EVIDENCE_REVIEW').length
  const decided = cases.filter((c) => c.status === 'DECIDED').length
  const archived = cases.filter((c) => c.status === 'ARCHIVED').length

  const typeCounts = new Map<string, number>()
  cases.forEach((c) => typeCounts.set(c.incidentType, (typeCounts.get(c.incidentType) ?? 0) + 1))

  const clearanceCounts = new Map<string, number>()
  clearances.forEach((c) => clearanceCounts.set(c.status, (clearanceCounts.get(c.status) ?? 0) + 1))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Reports & Analytics</h1>
        <p className="text-sm text-neutral-500">Institutional case-handling summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<ShieldAlert className="size-5" />} value={incidents.length} label="Referred Incidents" tone="brand" />
        <StatCard icon={<FolderSearch className="size-5" />} value={open} label="Open Cases" tone="gold" />
        <StatCard icon={<ClipboardCheck className="size-5" />} value={decided} label="Resolved Cases" tone="success" />
        <StatCard icon={<Archive className="size-5" />} value={archived} label="Archived Cases" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cases by Incident Type" />
          <div className="space-y-2 p-5 text-sm">
            {[...typeCounts.entries()].map(([type, count]) => (
              <div key={type} className="flex justify-between text-neutral-600">
                <span>{type}</span>
                <span className="font-medium text-neutral-800">{count}</span>
              </div>
            ))}
            {typeCounts.size === 0 && <p className="text-neutral-400">No cases yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Clearance Status Breakdown" />
          <div className="space-y-2 p-5 text-sm">
            {[...clearanceCounts.entries()].map(([status, count]) => (
              <div key={status} className="flex justify-between text-neutral-600">
                <span className="capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-medium text-neutral-800">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Financial Allocation (Read-Only)" subtitle="OSAS does not modify transactions or percentages." />
        <div className="grid grid-cols-3 gap-3 p-5 text-sm">
          <Row label="Tutor Share" value={`${Math.round(settings.tutorSharePct * 100)}%`} />
          <Row label="OSAS Share" value={`${Math.round(settings.osasSharePct * 100)}%`} />
          <Row label="Platform Share" value={`${Math.round(settings.platformSharePct * 100)}%`} />
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-3 text-center">
      <p className="text-lg font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}
