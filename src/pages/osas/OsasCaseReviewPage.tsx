import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderSearch } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Drawer } from '../../components/ui/Drawer'
import { Button } from '../../components/ui/Button'
import { TextArea, SelectInput, TextInput } from '../../components/ui/Field'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getCaseActions, getEvidenceValidations, getIncident, getOsasCases, fullName, getUser } from '../../lib/selectors'
import { addCaseAction, archiveCase, recordCaseDecision, OsasError } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'
import type { CaseDecisionType, OsasCase } from '../../types'

const TABS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DECIDED', label: 'Decided' },
]

const DECISIONS: CaseDecisionType[] = [
  'No Violation',
  'Case Dismissed',
  'Counseled',
  'Verbal Warning',
  'Written Warning',
  'Referred for Further Action',
  'Clearance Hold Recommended',
]

export function OsasCaseReviewPage() {
  const cases = useDb(getOsasCases).filter((c) => c.status !== 'ARCHIVED')
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('ACTIVE')
  const [selected, setSelected] = useState<OsasCase | null>(null)

  useEffect(() => {
    const caseId = searchParams.get('case')
    if (!caseId) return
    const match = cases.find((c) => c.id === caseId)
    if (match) {
      setSelected(match)
      setTab(match.status === 'DECIDED' ? 'DECIDED' : 'ACTIVE')
    }
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = tab === 'ACTIVE' ? cases.filter((c) => c.status !== 'DECIDED') : cases.filter((c) => c.status === 'DECIDED')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Case Review</h1>
        <p className="text-sm text-neutral-500">Formal institutional cases referred by Admin.</p>
      </div>

      <Card>
        <Tabs tabs={TABS.map((t) => ({ ...t, count: t.key === 'ACTIVE' ? cases.filter((c) => c.status !== 'DECIDED').length : cases.filter((c) => c.status === 'DECIDED').length }))} active={tab} onChange={setTab} />
        {shown.length === 0 ? (
          <EmptyState icon={<FolderSearch className="size-6" />} title="No cases" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{c.id} · {c.incidentType}</p>
                  <p className="text-xs text-neutral-500">Involving {fullName(getUser(c.reportedUserId))} · Opened {formatDateTime(c.openedAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={c.priority} label={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && <CaseDrawer kase={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function CaseDrawer({ kase, onClose }: { kase: OsasCase; onClose: () => void }) {
  const { userId: osasId } = useCurrentUser()
  const incident = getIncident(kase.incidentReportId)
  const actions = useDb(() => getCaseActions(kase.id))
  const validations = useDb(() => getEvidenceValidations(kase.id))
  const [actionText, setActionText] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [decision, setDecision] = useState<CaseDecisionType>('No Violation')
  const [decisionDetails, setDecisionDetails] = useState('')
  const [clearanceEffect, setClearanceEffect] = useState('')
  const [error, setError] = useState('')

  return (
    <Drawer open onClose={onClose} title={kase.id} subtitle={kase.incidentType}>
      <div className="space-y-5">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={kase.priority} label={kase.priority} />
          <StatusBadge status={kase.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-medium uppercase text-neutral-400">Reporter</p>
            <p className="text-neutral-800">{fullName(getUser(kase.reporterId))}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-neutral-400">Reported Student</p>
            <p className="text-neutral-800">{fullName(getUser(kase.reportedUserId))}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Description</p>
          <p className="text-sm text-neutral-700">{kase.description}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Case Timeline</p>
          <ul className="space-y-1.5 text-sm">
            {kase.timeline.map((t) => (
              <li key={t.id} className="flex justify-between text-neutral-600">
                <span>{t.label}</span>
                <span className="text-xs text-neutral-400">{formatDateTime(t.at)}</span>
              </li>
            ))}
          </ul>
        </div>

        {incident && incident.evidence.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Evidence</p>
            <div className="space-y-2">
              {incident.evidence.map((e) => {
                const validation = validations.find((v) => v.evidenceId === e.id)
                return (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                    <span className="text-neutral-700">{e.fileName}</span>
                    {validation ? <StatusBadge status={validation.result} /> : <span className="text-xs text-neutral-400">Not yet validated</span>}
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Use Evidence Validation to review each item in detail.</p>
          </div>
        )}

        {kase.status !== 'DECIDED' && (
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Add Case Action</p>
            <TextInput placeholder="Action taken (e.g. Interviewed reported student)" value={actionText} onChange={(e) => setActionText(e.target.value)} />
            <TextArea placeholder="Notes" rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  if (!osasId) return
                  addCaseAction(kase.id, actionText, actionNotes, osasId)
                  setActionText('')
                  setActionNotes('')
                  toast.success('Case action recorded.')
                } catch (err) {
                  toast.error(err instanceof OsasError ? err.message : 'Could not save action.')
                }
              }}
            >
              Save Action
            </Button>
          </div>
        )}

        {kase.status !== 'DECIDED' ? (
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Record Decision</p>
            <SelectInput value={decision} onChange={(e) => setDecision(e.target.value as CaseDecisionType)}>
              {DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectInput>
            <TextArea placeholder="Decision details" rows={2} value={decisionDetails} onChange={(e) => setDecisionDetails(e.target.value)} />
            {decision === 'Clearance Hold Recommended' && (
              <TextInput placeholder="Clearance effect / basis" value={clearanceEffect} onChange={(e) => setClearanceEffect(e.target.value)} />
            )}
            {error && <p className="text-xs text-danger-600">{error}</p>}
            <Button
              fullWidth
              onClick={() => {
                if (!decisionDetails.trim()) {
                  setError('Decision details are required.')
                  return
                }
                if (!osasId) return
                recordCaseDecision(kase.id, decision, decisionDetails.trim(), clearanceEffect.trim() || undefined, osasId)
                toast.success('Decision recorded.')
                onClose()
              }}
            >
              Record Decision
            </Button>
          </div>
        ) : (
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Decision</p>
            <p className="text-sm font-medium text-neutral-800">{kase.decision?.decision}</p>
            <p className="text-sm text-neutral-600">{kase.decision?.details}</p>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                archiveCase(kase.id)
                toast.success('Case archived.')
                onClose()
              }}
            >
              Archive Case
            </Button>
          </div>
        )}

        {actions.length > 0 && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Action History</p>
            <ul className="space-y-2 text-sm">
              {actions.map((a) => (
                <li key={a.id}>
                  <p className="font-medium text-neutral-700">{a.action}</p>
                  {a.notes && <p className="text-xs text-neutral-500">{a.notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Drawer>
  )
}
