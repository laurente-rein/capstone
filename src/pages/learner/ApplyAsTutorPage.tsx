import { useState } from 'react'
import { CheckCircle2, Clock, FileWarning, GraduationCap, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TextArea } from '../../components/ui/Field'
import { FileUploader } from '../../components/ui/FileUploader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingState } from '../../components/ui/LoadingState'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getTutorApplication } from '../../lib/selectors'
import { SUBJECT_CATEGORIES } from '../../lib/constants'
import { OCR_CONFIDENCE_THRESHOLD } from '../../lib/constants'
import { runOcr, parseVerificationFields } from '../../lib/ocr'
import { resubmitTutorApplication, submitTutorApplication, TutorActionError } from '../../lib/actions'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'

export function ApplyAsTutorPage() {
  const { user, userId } = useCurrentUser()
  const application = useDb(() => (userId ? getTutorApplication(userId) : undefined))

  if (!user || !userId) return null

  if (user.roles.includes('tutor')) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
          <CheckCircle2 className="size-12 text-success-600" />
          <h2 className="text-lg font-bold text-neutral-900">You're an approved CampusTutor tutor!</h2>
          <p className="max-w-sm text-sm text-neutral-500">
            Switch to your Tutor role from the sidebar to manage services, availability, and sessions.
          </p>
        </CardBody>
      </Card>
    )
  }

  if (application && ['PENDING', 'UNDER_REVIEW'].includes(application.status)) {
    return <StatusScreen application={application} />
  }

  if (application && application.status === 'RESUBMISSION_REQUIRED') {
    return <ApplicationForm userId={userId} existing={application} />
  }

  if (application && application.status === 'REJECTED') {
    return <StatusScreen application={application} allowReapply />
  }

  return <ApplicationForm userId={userId} />
}

function StatusScreen({ application, allowReapply }: { application: NonNullable<ReturnType<typeof getTutorApplication>>; allowReapply?: boolean }) {
  const [reapply, setReapply] = useState(false)
  if (reapply) return <ApplicationForm userId={application.userId} />

  const icon =
    application.status === 'REJECTED' ? (
      <XCircle className="size-12 text-danger-600" />
    ) : (
      <Clock className="size-12 text-gold-600" />
    )

  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
        {icon}
        <StatusBadge status={application.status} />
        <h2 className="text-lg font-bold text-neutral-900">
          {application.status === 'REJECTED' ? 'Your application was not approved' : 'Your tutor application is being reviewed'}
        </h2>
        <p className="max-w-sm text-sm text-neutral-500">
          Submitted {formatDateTime(application.submittedAt)}. {application.adminNotes && `Admin notes: ${application.adminNotes}`}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {application.subjects.map((s) => (
            <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              {s}
            </span>
          ))}
        </div>
        {allowReapply && (
          <Button className="mt-3" onClick={() => setReapply(true)}>
            Submit New Application
          </Button>
        )}
      </CardBody>
    </Card>
  )
}

function ApplicationForm({ userId, existing }: { userId: string; existing?: NonNullable<ReturnType<typeof getTutorApplication>> }) {
  const [subjects, setSubjects] = useState<string[]>(existing?.subjects ?? [])
  const [motivation, setMotivation] = useState(existing?.motivation ?? '')
  const [ocrState, setOcrState] = useState<'idle' | 'processing' | 'done'>('idle')
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>()
  const [ocrFields, setOcrFields] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleSubject(s: string) {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setOcrState('processing')
    try {
      const result = await runOcr(file)
      if (result.supported) {
        const fields = parseVerificationFields(result.text)
        setOcrFields(
          Object.fromEntries(Object.entries(fields).filter(([, v]) => v)) as Record<string, string>,
        )
        setOcrConfidence(result.confidence)
      } else {
        setOcrFields({})
        setOcrConfidence(undefined)
      }
    } catch {
      toast.error('OCR processing failed — you can still submit, Admin will review the document manually.')
    } finally {
      setOcrState('done')
    }
  }

  async function handleSubmit() {
    setError('')
    if (!subjects.length) {
      setError('Select at least one subject you can tutor.')
      return
    }
    if (!fileName) {
      setError('Upload a verification document (COR or valid ID).')
      return
    }
    setSubmitting(true)
    try {
      const input = {
        subjects,
        motivation,
        documents: [
          {
            fileName,
            fileUrl: '',
            ocrExtractedText: '',
            ocrFields,
            ocrConfidence,
          },
        ],
      }
      if (existing) resubmitTutorApplication(existing.id, input)
      else submitTutorApplication(userId, input)
      toast.success('Tutor application submitted! Admin will review it shortly.')
    } catch (err) {
      setError(err instanceof TutorActionError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Apply as Tutor</h1>
        <p className="text-sm text-neutral-500">Share your subjects and upload a verification document.</p>
      </div>

      {existing?.status === 'RESUBMISSION_REQUIRED' && existing.adminNotes && (
        <div className="flex items-start gap-2 rounded-lg bg-gold-50 p-3.5 text-sm text-gold-800">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Admin requested changes</p>
            <p className="text-xs">{existing.adminNotes}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader title="Subjects you can tutor" icon={<GraduationCap className="size-4" />} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_CATEGORIES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSubject(s)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  subjects.includes(s) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-600 hover:border-brand-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Why do you want to be a tutor?" />
        <CardBody>
          <TextArea placeholder="Tell us about your experience and motivation…" rows={4} value={motivation} onChange={(e) => setMotivation(e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Verification Document" subtitle="Certificate of Registration (COR) or valid school ID" />
        <CardBody className="space-y-3">
          <FileUploader onFileSelected={handleFile} />
          {ocrState === 'processing' && <LoadingState label="Running OCR on your document…" />}
          {ocrState === 'done' && (
            <div className="rounded-lg border border-neutral-200 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-neutral-700">OCR Extraction (decision support only)</p>
                {ocrConfidence !== undefined && (
                  <span className={`text-xs font-semibold ${ocrConfidence >= OCR_CONFIDENCE_THRESHOLD ? 'text-success-600' : 'text-gold-600'}`}>
                    {ocrConfidence}% confidence
                  </span>
                )}
              </div>
              {Object.keys(ocrFields).length === 0 ? (
                <p className="text-xs text-neutral-400">No fields could be automatically extracted. Admin will review the document manually.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {Object.entries(ocrFields).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-neutral-400">{k}</dt>
                      <dd className="font-medium text-neutral-700">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-[11px] text-neutral-400">
                Automatic Tutor Approval is disabled. Admin makes the final decision regardless of OCR confidence.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

      <Button fullWidth loading={submitting} onClick={handleSubmit}>
        Submit Application
      </Button>
    </div>
  )
}
