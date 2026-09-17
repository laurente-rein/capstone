import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Drawer } from '../../components/ui/Drawer'
import { Button } from '../../components/ui/Button'
import { TextArea, SelectInput } from '../../components/ui/Field'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getIncidents, fullName, getUser } from '../../lib/selectors'
import { adminMarkUnderReview, adminReferToOsas, adminResolvePlatformIssue } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'
import type { IncidentReport } from '../../types'

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_ADMIN_REVIEW', label: 'Under Review' },
  { key: 'RESOLVED_PLATFORM', label: 'Resolved' },
  { key: 'REFERRED_TO_OSAS', label: 'Referred to OSAS' },
]

export function AdminIncidentsPage() {
  const { userId: adminId } = useCurrentUser()
  const incidents = useDb(getIncidents)
  const [tab, setTab] = useState('ALL')
  const [selected, setSelected] = useState<IncidentReport | null>(null)

  const shown = tab === 'ALL' ? incidents : incidents.filter((i) => i.status === tab)

  function openIncident(i: IncidentReport) {
    if (i.status === 'SUBMITTED') adminMarkUnderReview(i.id)
    setSelected(i)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Incident Reports</h1>
        <p className="text-sm text-neutral-500">Resolve platform/technical issues directly, or refer institutional conduct matters to OSAS.</p>
      </div>

      <Card>
        <Tabs tabs={TABS.map((t) => ({ ...t, count: t.key === 'ALL' ? incidents.length : incidents.filter((i) => i.status === t.key).length }))} active={tab} onChange={setTab} />
        {shown.length === 0 ? (
          <EmptyState icon={<ShieldAlert className="size-6" />} title="No incidents" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((i) => (
              <button key={i.id} onClick={() => openIncident(i)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{i.id} · {i.incidentType}</p>
                  <p className="text-xs text-neutral-500">
                    {fullName(getUser(i.reporterId))} reported {fullName(getUser(i.reportedUserId))} · {formatDateTime(i.createdAt)}
                  </p>
                </div>
                <StatusBadge status={i.status} />
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && <IncidentDrawer incident={selected} adminId={adminId ?? ''} onClose={() => setSelected(null)} />}
    </div>
  )
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

function IncidentDrawer({ incident, adminId, onClose }: { incident: IncidentReport; adminId: string; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('MEDIUM')
  const [error, setError] = useState('')
  const actionable = incident.status === 'SUBMITTED' || incident.status === 'UNDER_ADMIN_REVIEW'

  function requireNotes(): boolean {
    if (!notes.trim()) {
      setError('Please provide notes explaining your decision.')
      return false
    }
    return true
  }

  return (
    <Drawer open onClose={onClose} title={incident.id} subtitle={incident.incidentType}>
      <div className="space-y-5">
        <StatusBadge status={incident.status} />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-medium uppercase text-neutral-400">Reporter</p>
            <p className="text-neutral-800">{fullName(getUser(incident.reporterId))}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-neutral-400">Reported User</p>
            <p className="text-neutral-800">{fullName(getUser(incident.reportedUserId))}</p>
          </div>
          {incident.bookingId && (
            <div>
              <p className="text-[11px] font-medium uppercase text-neutral-400">Booking</p>
              <p className="text-neutral-800">{incident.bookingId}</p>
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Description</p>
          <p className="text-sm text-neutral-700">{incident.description}</p>
        </div>
        {incident.evidence.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Evidence</p>
            <ul className="space-y-1 text-sm text-neutral-600">
              {incident.evidence.map((e) => (
                <li key={e.id}>{e.fileName}</li>
              ))}
            </ul>
          </div>
        )}
        {incident.adminNotes && (
          <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
            <p className="font-medium text-neutral-700">Admin notes</p>
            <p>{incident.adminNotes}</p>
          </div>
        )}

        {actionable && (
          <div className="space-y-3 border-t border-neutral-100 pt-4">
            <TextArea label="Notes" required rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <p className="text-xs text-danger-600">{error}</p>}
            <Button
              fullWidth
              variant="secondary"
              onClick={() => {
                if (!requireNotes()) return
                adminResolvePlatformIssue(incident.id, adminId, notes.trim())
                toast.success('Marked as resolved (platform issue).')
                onClose()
              }}
            >
              Resolve as Platform/Technical Issue
            </Button>
            <div className="flex items-end gap-2">
              <SelectInput label="Referral Priority" value={priority} onChange={(e) => setPriority(e.target.value as any)} containerClassName="flex-1">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectInput>
              <Button
                variant="danger"
                onClick={() => {
                  if (!requireNotes()) return
                  adminReferToOsas(incident.id, adminId, notes.trim(), priority)
                  toast.success('Referred to OSAS for institutional review.')
                  onClose()
                }}
              >
                Refer to OSAS
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
