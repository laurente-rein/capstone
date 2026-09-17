import { useState } from 'react'
import { CalendarDays, CheckCircle2, Lock, Plus, Trash2, Upload } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { FileUploader } from '../ui/FileUploader'
import { LoadingState } from '../ui/LoadingState'
import { TextInput, SelectInput } from '../ui/Field'
import { EmptyState } from '../ui/EmptyState'
import { useDb } from '../../hooks/useDb'
import { getActiveClassSchedule, getDraftClassSchedule } from '../../lib/selectors'
import { parseClassScheduleText, runOcr } from '../../lib/ocr'
import { confirmClassSchedule, discardDraftSchedule, updateDraftScheduleEntries, uploadClassSchedule } from '../../lib/actions'
import type { ClassScheduleEntry } from '../../types'
import { makeId } from '../../lib/utils'
import { toast } from '../../store/toast'
import { OCR_CONFIDENCE_THRESHOLD } from '../../lib/constants'

const DAYS: ClassScheduleEntry['day'][] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function ClassScheduleSection({ tutorId }: { tutorId: string }) {
  const confirmed = useDb(() => getActiveClassSchedule(tutorId))
  const draft = useDb(() => getDraftClassSchedule(tutorId))
  const [uploading, setUploading] = useState(false)
  const [showUploader, setShowUploader] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const result = await runOcr(file)
      const entries = result.supported ? parseClassScheduleText(result.text) : []
      uploadClassSchedule(tutorId, file.name, entries.length ? entries : [blankEntry()], result.supported ? result.confidence : undefined)
      toast.info(result.supported ? 'OCR complete — review the extracted rows below.' : 'PDF uploaded — please enter your class rows manually below.')
      setShowUploader(false)
    } catch {
      uploadClassSchedule(tutorId, file.name, [blankEntry()], undefined)
      toast.error('OCR failed — please enter your class rows manually.')
    } finally {
      setUploading(false)
    }
  }

  if (draft) {
    return <DraftReview draft={draft} tutorId={tutorId} />
  }

  return (
    <Card>
      <CardHeader
        title="Class Schedule"
        subtitle={confirmed ? 'Confirmed and read-only. Upload a new file if your schedule changes.' : 'Required before you can create tutoring services.'}
        icon={<CalendarDays className="size-4" />}
        action={
          confirmed ? (
            <Button size="sm" variant="outline" icon={<Upload className="size-3.5" />} onClick={() => setShowUploader(true)}>
              Upload Updated Schedule
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-4">
        {confirmed ? (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3.5 py-2.5 text-sm text-success-700">
              <CheckCircle2 className="size-4" /> Class schedule confirmed — read-only
            </div>
            <ScheduleTable entries={confirmed.entries} readOnly />
          </>
        ) : !showUploader ? (
          <EmptyState
            icon={<Lock className="size-6" />}
            title="No class schedule uploaded"
            description="Upload your CSU class schedule to unlock service creation and prevent booking conflicts."
            action={
              <Button size="sm" icon={<Upload className="size-3.5" />} onClick={() => setShowUploader(true)}>
                Upload Class Schedule
              </Button>
            }
          />
        ) : null}

        {showUploader && (uploading ? <LoadingState label="Running OCR on your class schedule…" /> : <FileUploader onFileSelected={handleFile} />)}
      </CardBody>
    </Card>
  )
}

function blankEntry(): ClassScheduleEntry {
  return { id: makeId('cse'), courseCode: '', courseName: '', day: 'MON', startTime: '08:00', endTime: '09:00', room: '' }
}

function DraftReview({ draft, tutorId }: { draft: NonNullable<ReturnType<typeof getDraftClassSchedule>>; tutorId: string }) {
  const [entries, setEntries] = useState<ClassScheduleEntry[]>(draft.entries)

  function updateRow(id: string, patch: Partial<ClassScheduleEntry>) {
    const next = entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
    setEntries(next)
    updateDraftScheduleEntries(draft.id, next)
  }

  function addRow() {
    const next = [...entries, blankEntry()]
    setEntries(next)
    updateDraftScheduleEntries(draft.id, next)
  }

  function removeRow(id: string) {
    const next = entries.filter((e) => e.id !== id)
    setEntries(next)
    updateDraftScheduleEntries(draft.id, next)
  }

  function handleConfirm() {
    const valid = entries.filter((e) => e.courseCode.trim() && e.startTime < e.endTime)
    if (!valid.length) {
      toast.error('Add at least one valid class row before confirming.')
      return
    }
    updateDraftScheduleEntries(draft.id, valid)
    confirmClassSchedule(draft.id, tutorId)
    toast.success('Class schedule confirmed!')
  }

  return (
    <Card>
      <CardHeader
        title="Review Extracted Schedule"
        subtitle={
          draft.ocrConfidence !== undefined
            ? `OCR confidence: ${draft.ocrConfidence}% — correct any errors before confirming.`
            : 'Enter your class schedule rows below.'
        }
        icon={<CalendarDays className="size-4" />}
        action={
          <span className={`text-xs font-semibold ${draft.ocrConfidence && draft.ocrConfidence >= OCR_CONFIDENCE_THRESHOLD ? 'text-success-600' : 'text-gold-600'}`}>
            {draft.sourceFileName}
          </span>
        }
      />
      <CardBody className="space-y-3">
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-neutral-100 p-2.5">
              <TextInput containerClassName="col-span-2" label="Code" value={e.courseCode} onChange={(ev) => updateRow(e.id, { courseCode: ev.target.value.toUpperCase() })} />
              <TextInput containerClassName="col-span-3" label="Course Name" value={e.courseName} onChange={(ev) => updateRow(e.id, { courseName: ev.target.value })} />
              <SelectInput containerClassName="col-span-2" label="Day" value={e.day} onChange={(ev) => updateRow(e.id, { day: ev.target.value as ClassScheduleEntry['day'] })}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectInput>
              <TextInput containerClassName="col-span-2" label="Start" type="time" value={e.startTime} onChange={(ev) => updateRow(e.id, { startTime: ev.target.value })} />
              <TextInput containerClassName="col-span-2" label="End" type="time" value={e.endTime} onChange={(ev) => updateRow(e.id, { endTime: ev.target.value })} />
              <button onClick={() => removeRow(e.id)} className="col-span-1 flex h-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" icon={<Plus className="size-3.5" />} onClick={addRow}>
          Add Row
        </Button>
        <div className="flex gap-2 border-t border-neutral-100 pt-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              discardDraftSchedule(draft.id)
              toast.info('Upload discarded.')
            }}
          >
            Discard
          </Button>
          <Button fullWidth onClick={handleConfirm}>
            Confirm Class Schedule
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function ScheduleTable({ entries }: { entries: ClassScheduleEntry[]; readOnly?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-100">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-400">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Course</th>
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Room</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2 font-medium text-neutral-800">{e.courseCode}</td>
              <td className="px-3 py-2 text-neutral-600">{e.courseName}</td>
              <td className="px-3 py-2 text-neutral-600">{e.day}</td>
              <td className="px-3 py-2 text-neutral-600">
                {e.startTime}–{e.endTime}
              </td>
              <td className="px-3 py-2 text-neutral-400">{e.room ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
