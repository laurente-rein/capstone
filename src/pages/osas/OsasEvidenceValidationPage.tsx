import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { SelectInput, TextArea } from '../../components/ui/Field'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getEvidenceValidations, getIncident, getOsasCases } from '../../lib/selectors'
import { addEvidenceValidation } from '../../lib/actions'
import { toast } from '../../store/toast'
import type { EvidenceValidation } from '../../types'

const CHECKS: { key: keyof Pick<EvidenceValidation, 'readability' | 'contextCompleteness' | 'relevance' | 'sourceVerification' | 'signsOfManipulation'>; label: string }[] = [
  { key: 'readability', label: 'Readable' },
  { key: 'contextCompleteness', label: 'Context complete' },
  { key: 'relevance', label: 'Relevant to case' },
  { key: 'sourceVerification', label: 'Source verifiable' },
  { key: 'signsOfManipulation', label: 'Signs of manipulation' },
]

export function OsasEvidenceValidationPage() {
  const { userId: osasId } = useCurrentUser()
  const cases = useDb(getOsasCases).filter((c) => c.status !== 'ARCHIVED')

  const withEvidence = cases
    .map((c) => ({ kase: c, incident: getIncident(c.incidentReportId) }))
    .filter((x) => x.incident && x.incident.evidence.length > 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Evidence Validation</h1>
        <p className="text-sm text-neutral-500">Review submitted evidence before it informs a case decision.</p>
      </div>

      {withEvidence.length === 0 ? (
        <Card>
          <EmptyState icon={<FileSearch className="size-6" />} title="No evidence to validate" />
        </Card>
      ) : (
        withEvidence.map(({ kase, incident }) => (
          <Card key={kase.id}>
            <CardHeader title={`${kase.id} · ${kase.incidentType}`} />
            <div className="divide-y divide-neutral-100">
              {incident!.evidence.map((e) => (
                <EvidenceRow key={e.id} caseId={kase.id} evidenceId={e.id} fileName={e.fileName} osasId={osasId ?? ''} />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

function EvidenceRow({ caseId, evidenceId, fileName, osasId }: { caseId: string; evidenceId: string; fileName: string; osasId: string }) {
  const validations = useDb(() => getEvidenceValidations(caseId))
  const existing = validations.find((v) => v.evidenceId === evidenceId)
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState({ readability: true, contextCompleteness: true, relevance: true, sourceVerification: false, signsOfManipulation: false })
  const [result, setResult] = useState<EvidenceValidation['result']>('VALIDATED')
  const [notes, setNotes] = useState('')

  if (existing) {
    return (
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm text-neutral-700">{fileName}</span>
        <StatusBadge status={existing.result} />
      </div>
    )
  }

  return (
    <div className="px-5 py-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left text-sm">
        <span className="text-neutral-700">{fileName}</span>
        <span className="text-xs font-medium text-brand-600">{open ? 'Cancel' : 'Validate'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 rounded-lg bg-neutral-50 p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {CHECKS.map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 text-neutral-600">
                <input
                  type="checkbox"
                  checked={checks[c.key]}
                  onChange={(e) => setChecks((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                />
                {c.label}
              </label>
            ))}
          </div>
          <SelectInput label="Result" value={result} onChange={(e) => setResult(e.target.value as EvidenceValidation['result'])}>
            <option value="VALIDATED">Validated</option>
            <option value="INSUFFICIENT">Insufficient</option>
            <option value="REQUIRES_CLARIFICATION">Requires Clarification</option>
          </SelectInput>
          <TextArea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button
            size="sm"
            onClick={() => {
              addEvidenceValidation(caseId, { evidenceId, ...checks, result, notes, validatedBy: osasId })
              toast.success('Evidence validation recorded.')
              setOpen(false)
            }}
          >
            Save Validation
          </Button>
        </div>
      )}
    </div>
  )
}
