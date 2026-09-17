import { useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Drawer } from '../../components/ui/Drawer'
import { Button } from '../../components/ui/Button'
import { TextArea } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Avatar'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getAllTutorApplications, fullName, getUser } from '../../lib/selectors'
import { OCR_CONFIDENCE_THRESHOLD } from '../../lib/constants'
import { adminApproveTutor, adminRejectTutor, adminRequestResubmission, adminStartReview } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'
import type { TutorApplication } from '../../types'

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'RESUBMISSION_REQUIRED', label: 'Resubmitted' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

export function AdminTutorVerificationPage() {
  const { userId: adminId } = useCurrentUser()
  const applications = useDb(getAllTutorApplications)
  const [tab, setTab] = useState('PENDING')
  const [selected, setSelected] = useState<TutorApplication | null>(null)

  const shown = applications.filter((a) => a.status === tab)

  function openApp(app: TutorApplication) {
    if (app.status === 'PENDING' && adminId) adminStartReview(app.id)
    setSelected(app)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Tutor Verification</h1>
        <p className="text-sm text-neutral-500">Automatic approval is disabled — every application needs a manual decision.</p>
      </div>

      <Card>
        <Tabs tabs={TABS.map((t) => ({ ...t, count: applications.filter((a) => a.status === t.key).length }))} active={tab} onChange={setTab} />
        {shown.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="size-6" />} title="Nothing here" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((a) => {
              const applicant = getUser(a.userId)
              if (!applicant) return null
              return (
                <button key={a.id} onClick={() => openApp(a)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={applicant.firstName} lastName={applicant.lastName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{fullName(applicant)}</p>
                      <p className="text-xs text-neutral-500">{a.subjects.join(', ')}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">{formatDateTime(a.submittedAt)}</span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {selected && <ApplicationDrawer application={selected} onClose={() => setSelected(null)} adminId={adminId ?? ''} />}
    </div>
  )
}

function ApplicationDrawer({ application, onClose, adminId }: { application: TutorApplication; onClose: () => void; adminId: string }) {
  const applicant = getUser(application.userId)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const canDecide = application.status === 'PENDING' || application.status === 'UNDER_REVIEW'

  function handle(action: 'approve' | 'resubmit' | 'reject') {
    if ((action === 'resubmit' || action === 'reject') && !notes.trim()) {
      setError('Please provide notes explaining your decision.')
      return
    }
    if (action === 'approve') {
      adminApproveTutor(application.id, adminId, notes.trim() || 'Approved.')
      toast.success('Tutor approved.')
    } else if (action === 'resubmit') {
      adminRequestResubmission(application.id, adminId, notes.trim())
      toast.success('Resubmission requested.')
    } else {
      adminRejectTutor(application.id, adminId, notes.trim())
      toast.success('Application rejected.')
    }
    onClose()
  }

  return (
    <Drawer open onClose={onClose} title="Tutor Application" subtitle={application.id}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar firstName={applicant?.firstName ?? ''} lastName={applicant?.lastName ?? ''} />
          <div>
            <p className="font-semibold text-neutral-900">{fullName(applicant)}</p>
            <p className="text-xs text-neutral-500">{applicant?.email}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Subjects</p>
          <div className="flex flex-wrap gap-1.5">
            {application.subjects.map((s) => (
              <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Motivation</p>
          <p className="text-sm text-neutral-700">{application.motivation || '—'}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Verification Documents & OCR</p>
          <div className="space-y-2">
            {application.documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-neutral-200 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <FileText className="size-3.5" /> {doc.fileName}
                  </span>
                  {doc.ocrConfidence !== undefined && (
                    <span className={`text-xs font-semibold ${doc.ocrConfidence >= OCR_CONFIDENCE_THRESHOLD ? 'text-success-600' : 'text-gold-600'}`}>
                      {doc.ocrConfidence}% OCR confidence
                    </span>
                  )}
                </div>
                {doc.ocrFields && Object.keys(doc.ocrFields).length > 0 ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {Object.entries(doc.ocrFields).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-neutral-400">{k}</dt>
                        <dd className="font-medium text-neutral-700">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs text-neutral-400">No fields extracted — review manually.</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            OCR confidence and field matches are decision support only — they do not prove document authenticity, and automatic approval is disabled.
          </p>
        </div>

        {application.adminNotes && (
          <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
            <p className="font-medium text-neutral-700">Previous admin notes</p>
            <p>{application.adminNotes}</p>
          </div>
        )}

        {canDecide && (
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <TextArea label="Decision Notes" placeholder="Explain your decision (required for resubmission/rejection)…" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <p className="text-xs text-danger-600">{error}</p>}
            <div className="flex gap-2">
              <Button fullWidth variant="danger" onClick={() => handle('reject')}>
                Reject
              </Button>
              <Button fullWidth variant="outline" onClick={() => handle('resubmit')}>
                Request Resubmission
              </Button>
              <Button fullWidth onClick={() => handle('approve')}>
                Approve
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
