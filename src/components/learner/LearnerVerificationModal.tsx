import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SelectInput } from '../ui/Field'
import { FileUploader } from '../ui/FileUploader'
import { LoadingState } from '../ui/LoadingState'
import { OCR_CONFIDENCE_THRESHOLD } from '../../lib/constants'
import { runOcr, parseVerificationFields } from '../../lib/ocr'
import { submitLearnerVerification } from '../../lib/actions'
import type { LearnerDocumentType } from '../../types'

const DOCUMENT_TYPES: LearnerDocumentType[] = ['Class Schedule', 'COR', 'Student ID']

export function LearnerVerificationModal({
  open,
  onClose,
  learnerId,
  onVerified,
}: {
  open: boolean
  onClose: () => void
  learnerId: string
  onVerified: () => void
}) {
  const [documentType, setDocumentType] = useState<LearnerDocumentType>('Class Schedule')
  const [ocrState, setOcrState] = useState<'idle' | 'processing' | 'done'>('idle')
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>()
  const [ocrName, setOcrName] = useState<string | undefined>()
  const [ocrStudentId, setOcrStudentId] = useState<string | undefined>()
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setDocumentType('Class Schedule')
    setOcrState('idle')
    setOcrConfidence(undefined)
    setOcrName(undefined)
    setOcrStudentId(undefined)
    setFileName('')
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setOcrState('processing')
    try {
      const result = await runOcr(file)
      if (result.supported) {
        const fields = parseVerificationFields(result.text)
        setOcrName(fields.name)
        setOcrStudentId(fields.studentId)
        setOcrConfidence(result.confidence)
      } else {
        setOcrName(undefined)
        setOcrStudentId(undefined)
        setOcrConfidence(undefined)
      }
    } finally {
      setOcrState('done')
    }
  }

  function handleSubmit() {
    setSubmitting(true)
    submitLearnerVerification(learnerId, {
      documentType,
      fileName,
      ocrExtractedName: ocrName,
      ocrExtractedStudentId: ocrStudentId,
      ocrConfidence,
    })
    setSubmitting(false)
    reset()
    onVerified()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Verify Your Account to Book"
      subtitle="Upload a document showing your name and school ID"
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>Before booking your first session, upload your Class Schedule, COR, or Student ID so tutors know they're meeting a verified CSU student.</p>
        </div>

        <SelectInput
          label="Document Type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as LearnerDocumentType)}
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectInput>

        <FileUploader onFileSelected={handleFile} />

        {ocrState === 'processing' && <LoadingState label="Running OCR on your document…" />}
        {ocrState === 'done' && (
          <div className="rounded-lg border border-neutral-200 p-3 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-neutral-700">OCR Extraction</p>
              {ocrConfidence !== undefined && (
                <span className={`text-xs font-semibold ${ocrConfidence >= OCR_CONFIDENCE_THRESHOLD ? 'text-success-600' : 'text-gold-600'}`}>
                  {ocrConfidence}% confidence
                </span>
              )}
            </div>
            {!ocrName && !ocrStudentId ? (
              <p className="text-xs text-neutral-400">No fields could be automatically read — that's okay, your document is still on file.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {ocrName && (
                  <div>
                    <dt className="text-neutral-400">Name</dt>
                    <dd className="font-medium text-neutral-700">{ocrName}</dd>
                  </div>
                )}
                {ocrStudentId && (
                  <div>
                    <dt className="text-neutral-400">Student ID</dt>
                    <dd className="font-medium text-neutral-700">{ocrStudentId}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth disabled={!fileName} loading={submitting} onClick={handleSubmit}>
            Verify & Continue
          </Button>
        </div>
      </div>
    </Modal>
  )
}
