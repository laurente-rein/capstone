import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { TextArea } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getAllServices, fullName, getUser } from '../../lib/selectors'
import { adminRequestServiceChanges, adminSuspendService, tutorReactivateOwnService } from '../../lib/actions'
import { formatCurrency } from '../../lib/utils'
import { toast } from '../../store/toast'
import type { Service } from '../../types'

export function AdminServiceManagementPage() {
  const { userId: adminId } = useCurrentUser()
  const services = useDb(getAllServices)
  const [selected, setSelected] = useState<Service | null>(null)
  const [requestNotes, setRequestNotes] = useState('')
  const [showSuspend, setShowSuspend] = useState(false)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Service Management</h1>
        <p className="text-sm text-neutral-500">Monitor tutor-created services. Tutors remain responsible for their own content.</p>
      </div>

      <Card>
        {services.length === 0 ? (
          <EmptyState icon={<ClipboardList className="size-6" />} title="No services yet" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {services.map((s) => (
              <button key={s.id} onClick={() => setSelected(s)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{s.title}</p>
                  <p className="text-xs text-neutral-500">by {fullName(getUser(s.tutorId))} · {formatCurrency(s.hourlyRate)}/hr</p>
                </div>
                <StatusBadge status={s.status} />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title} subtitle={selected ? `by ${fullName(getUser(selected.tutorId))}` : undefined}>
        {selected && (
          <div className="space-y-4">
            <StatusBadge status={selected.status} />
            <p className="text-sm text-neutral-600">{selected.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.topics.map((t) => (
                <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {t}
                </span>
              ))}
            </div>
            <div className="space-y-2 border-t border-neutral-100 pt-4">
              <TextArea label="Request changes from tutor" placeholder="Describe what needs to change…" rows={3} value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} />
              <Button
                fullWidth
                variant="outline"
                disabled={!requestNotes.trim()}
                onClick={() => {
                  if (adminId) adminRequestServiceChanges(selected.id, selected.tutorId, adminId, requestNotes.trim())
                  toast.success('Change request sent to tutor.')
                  setRequestNotes('')
                }}
              >
                Send Change Request
              </Button>
              {selected.status === 'SUSPENDED' ? (
                <Button
                  fullWidth
                  onClick={() => {
                    tutorReactivateOwnService(selected.id)
                    toast.success('Service reactivated.')
                    setSelected(null)
                  }}
                >
                  Reactivate Service
                </Button>
              ) : (
                <Button fullWidth variant="danger" onClick={() => setShowSuspend(true)}>
                  Suspend Service
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={showSuspend}
        onClose={() => setShowSuspend(false)}
        title="Suspend this service?"
        description="Learners will no longer be able to book this service."
        confirmLabel="Suspend"
        requireReason
        onConfirm={(reason) => {
          if (selected && adminId) adminSuspendService(selected.id, adminId, reason ?? '')
          toast.success('Service suspended.')
          setShowSuspend(false)
          setSelected(null)
        }}
      />
    </div>
  )
}
