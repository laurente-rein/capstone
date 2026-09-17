import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SelectInput, TextArea, TextInput } from '../ui/Field'
import { SUBJECT_CATEGORIES } from '../../lib/constants'
import type { Service, SessionType } from '../../types'
import { createService, TutorActionError, updateService } from '../../lib/actions'
import { toast } from '../../store/toast'

const LEVELS = ['College - 1st Year', 'College - 1st/2nd Year', 'College - 2nd Year', 'College - 2nd/3rd Year', 'College - 3rd Year', 'College - 3rd/4th Year']

export function ServiceFormModal({ open, onClose, tutorId, existing }: { open: boolean; onClose: () => void; tutorId: string; existing?: Service }) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [subject, setSubject] = useState(existing?.subject ?? '')
  const [category, setCategory] = useState(existing?.category ?? SUBJECT_CATEGORIES[0])
  const [level, setLevel] = useState(existing?.level ?? LEVELS[0])
  const [description, setDescription] = useState(existing?.description ?? '')
  const [topics, setTopics] = useState(existing?.topics.join(', ') ?? '')
  const [hourlyRate, setHourlyRate] = useState(existing?.hourlyRate ?? 300)
  const [sessionType, setSessionType] = useState<SessionType>(existing?.sessionType ?? 'BOTH')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setError('')
    setSaving(true)
    try {
      const input = {
        title: title.trim(),
        subject: subject.trim(),
        category,
        level,
        description: description.trim(),
        topics: topics.split(',').map((t) => t.trim()).filter(Boolean),
        hourlyRate: Number(hourlyRate),
        sessionType,
      }
      if (existing) {
        updateService(existing.id, input)
        toast.success('Service updated.')
      } else {
        createService(tutorId, input)
        toast.success('Service created.')
      }
      onClose()
    } catch (err) {
      setError(err instanceof TutorActionError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit Service' : 'Create Service'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {existing ? 'Save Changes' : 'Create Service'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput label="Service Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus 1 Tutoring" />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Calculus 1" />
          <SelectInput label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {SUBJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </div>
        <SelectInput label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </SelectInput>
        <TextArea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextInput label="Topics / Skills" hint="Comma-separated" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Limits, Derivatives, Optimization" />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Hourly Rate (₱)" type="number" min={50} required value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
          <SelectInput label="Session Type" value={sessionType} onChange={(e) => setSessionType(e.target.value as SessionType)}>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In-Person</option>
            <option value="BOTH">Both</option>
          </SelectInput>
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    </Modal>
  )
}
