import { useState } from 'react'
import { ClipboardCheck, Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Drawer } from '../../components/ui/Drawer'
import { Button } from '../../components/ui/Button'
import { SelectInput, TextArea } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Avatar'
import { useDb } from '../../hooks/useDb'
import { getAllClearanceReviews, getAllUsers, fullName } from '../../lib/selectors'
import { updateClearanceStatus, OsasError } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'
import type { ClearanceStatus, UserAccount } from '../../types'

export function OsasClearancePage() {
  const users = useDb(getAllUsers)
  const clearances = useDb(getAllClearanceReviews)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserAccount | null>(null)

  const filtered = users.filter((u) => u.roles.includes('learner') && `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Student Clearance Review</h1>
        <p className="text-sm text-neutral-500">A clearance hold requires an institutional basis — an incident report alone is not enough.</p>
      </div>

      <Card>
        <div className="border-b border-neutral-100 p-4">
          <TextInput icon={<Search className="size-4" />} placeholder="Search student…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="size-6" />} title="No students found" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((u) => {
              const clearance = clearances.find((c) => c.userId === u.id)
              return (
                <button key={u.id} onClick={() => setSelected(u)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                    <p className="text-sm font-medium text-neutral-800">{fullName(u)}</p>
                  </div>
                  <StatusBadge status={clearance?.status ?? 'PENDING_REVIEW'} />
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {selected && <ClearanceDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ClearanceDrawer({ user, onClose }: { user: UserAccount; onClose: () => void }) {
  const clearance = useDb(() => getAllClearanceReviews().find((c) => c.userId === user.id))
  const [status, setStatus] = useState<ClearanceStatus>(clearance?.status ?? 'PENDING_REVIEW')
  const [reason, setReason] = useState(clearance?.reason ?? '')
  const [error, setError] = useState('')

  return (
    <Drawer open onClose={onClose} title={fullName(user)} subtitle="Clearance Review">
      <div className="space-y-4">
        <StatusBadge status={clearance?.status ?? 'PENDING_REVIEW'} />
        {clearance?.relatedCaseIds.length ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Related Cases</p>
            <ul className="text-sm text-neutral-700">
              {clearance.relatedCaseIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">No related cases on file.</p>
        )}
        {clearance && <p className="text-xs text-neutral-400">Last updated {formatDateTime(clearance.updatedAt)}</p>}

        <div className="space-y-2 border-t border-neutral-100 pt-4">
          <SelectInput label="Status" value={status} onChange={(e) => setStatus(e.target.value as ClearanceStatus)}>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CLEARED">Cleared</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="REQUIRES_RESOLUTION">Requires Resolution</option>
          </SelectInput>
          <TextArea label="Institutional basis / reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required={status === 'ON_HOLD' || status === 'REQUIRES_RESOLUTION'} />
          {error && <p className="text-xs text-danger-600">{error}</p>}
          <Button
            fullWidth
            onClick={() => {
              try {
                updateClearanceStatus(user.id, status, reason.trim())
                toast.success('Clearance status updated.')
                onClose()
              } catch (err) {
                setError(err instanceof OsasError ? err.message : 'Could not update clearance.')
              }
            }}
          >
            Save Clearance Status
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
