import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/Field'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Drawer } from '../../components/ui/Drawer'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Avatar } from '../../components/ui/Avatar'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getAllUsers, getClearance } from '../../lib/selectors'
import type { UserAccount } from '../../types'
import { adminReactivateUser, adminSuspendUser } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'

export function AdminUserManagementPage() {
  const { userId: adminId } = useCurrentUser()
  const users = useDb(getAllUsers)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserAccount | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<UserAccount | null>(null)

  const filtered = users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">User Management</h1>
        <p className="text-sm text-neutral-500">Every CampusTutor account is a single identity — Learner by default, plus Tutor once approved.</p>
      </div>

      <Card>
        <div className="border-b border-neutral-100 p-4">
          <TextInput icon={<Search className="size-4" />} placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="No users found" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((u) => (
              <button key={u.id} onClick={() => setSelected(u)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {u.roles.map((r) => (
                    <StatusBadge key={r} status="ACTIVE" label={r} />
                  ))}
                  <StatusBadge status={u.status === 'active' ? 'ACTIVE' : 'SUSPENDED'} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar firstName={selected.firstName} lastName={selected.lastName} size="lg" />
              <div>
                <p className="text-base font-semibold text-neutral-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm text-neutral-500">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Student ID" value={selected.studentId ?? '—'} />
              <Field label="Status" value={<StatusBadge status={selected.status === 'active' ? 'ACTIVE' : 'SUSPENDED'} />} />
              <Field label="College" value={selected.college ?? '—'} />
              <Field label="Program" value={selected.program ?? '—'} />
              <Field label="Joined" value={formatDateTime(selected.createdAt)} />
              <Field label="Roles" value={selected.roles.join(', ')} />
            </div>
            {selected.status === 'suspended' && selected.suspensionReason && (
              <div className="rounded-lg bg-danger-50 p-3 text-xs text-danger-700">
                <p className="font-medium">Suspension reason</p>
                <p>{selected.suspensionReason}</p>
              </div>
            )}
            <ClearanceInfo userId={selected.id} />
            <div className="flex gap-2 border-t border-neutral-100 pt-4">
              {selected.status === 'active' ? (
                <Button fullWidth variant="danger" onClick={() => setSuspendTarget(selected)}>
                  Suspend User
                </Button>
              ) : (
                <Button
                  fullWidth
                  onClick={() => {
                    if (adminId) adminReactivateUser(selected.id, adminId)
                    toast.success('User reactivated.')
                    setSelected(null)
                  }}
                >
                  Reactivate User
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title="Suspend this user?"
        description="The user will be immediately unable to log in. This is a platform action, not an OSAS disciplinary decision."
        confirmLabel="Suspend"
        requireReason
        reasonLabel="Suspension reason"
        onConfirm={(reason) => {
          if (suspendTarget && adminId) adminSuspendUser(suspendTarget.id, adminId, reason ?? '')
          toast.success('User suspended.')
          setSuspendTarget(null)
          setSelected(null)
        }}
      />
    </div>
  )
}

function ClearanceInfo({ userId }: { userId: string }) {
  const clearance = useDb(() => getClearance(userId))
  if (!clearance) return null
  return (
    <div className="rounded-lg border border-neutral-100 p-3 text-xs">
      <p className="mb-1 font-medium text-neutral-600">OSAS Clearance Status</p>
      <StatusBadge status={clearance.status} />
      {clearance.reason && <p className="mt-1 text-neutral-500">{clearance.reason}</p>}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-neutral-800">{value}</p>
    </div>
  )
}
