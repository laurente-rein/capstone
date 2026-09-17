import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, MapPin, Video, XCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextArea, SelectInput } from '../ui/Field'
import type { Service, UserAccount } from '../../types'
import { getBookableAvailability, getTutorProfile } from '../../lib/selectors'
import { useDb } from '../../hooks/useDb'
import { formatCurrency, formatDate, formatTime } from '../../lib/utils'
import { BookingError, confirmBookingPayment, createBooking, simulatePayMongoCheckout } from '../../lib/actions'
import { toast } from '../../store/toast'

const DURATIONS = [1, 1.5, 2]

export function BookingFlowModal({
  open,
  onClose,
  tutor,
  service,
  learnerId,
}: {
  open: boolean
  onClose: () => void
  tutor: UserAccount
  service: Service
  learnerId: string
}) {
  const [step, setStep] = useState<'slot' | 'topic' | 'summary' | 'payment' | 'done'>('slot')
  const slots = useDb(() => getBookableAvailability(tutor.id))
  const profile = useDb(() => getTutorProfile(tutor.id))
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [duration, setDuration] = useState(1)
  const [sessionType, setSessionType] = useState<'ONLINE' | 'IN_PERSON'>(service.sessionType === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE')
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')
  const [failMode, setFailMode] = useState(false)
  const [bookingId, setBookingId] = useState('')

  const selectedSlot = slots.find((s) => s.id === selectedSlotId)
  const maxDuration = useMemo(() => {
    if (!selectedSlot) return 2
    const [sh, sm] = selectedSlot.startTime.split(':').map(Number)
    const [eh, em] = selectedSlot.endTime.split(':').map(Number)
    return (eh * 60 + em - (sh * 60 + sm)) / 60
  }, [selectedSlot])

  const endTime = useMemo(() => {
    if (!selectedSlot) return ''
    const [sh, sm] = selectedSlot.startTime.split(':').map(Number)
    const totalMin = sh * 60 + sm + duration * 60
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  }, [selectedSlot, duration])

  const amount = Math.round(service.hourlyRate * duration)

  function reset() {
    setStep('slot')
    setSelectedSlotId('')
    setDuration(1)
    setTopic('')
    setError('')
    setFailMode(false)
    setBookingId('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function goToSummary() {
    if (!selectedSlot) {
      setError('Please select a date and time.')
      return
    }
    if (!topic.trim()) {
      setError('Please describe the specific topic you need help with.')
      return
    }
    setError('')
    setStep('summary')
  }

  async function handlePay() {
    setError('')
    try {
      const booking = createBooking({
        learnerId,
        tutorId: tutor.id,
        serviceId: service.id,
        specificTopic: topic.trim(),
        date: selectedSlot!.date,
        startTime: selectedSlot!.startTime,
        endTime,
        sessionType,
        location: sessionType === 'IN_PERSON' ? 'To be confirmed with tutor' : undefined,
        meetingPlatform: sessionType === 'ONLINE' ? 'Google Meet' : undefined,
        amount,
      })
      setBookingId(booking.id)
      setStep('payment')
      const result = await simulatePayMongoCheckout(amount, failMode)
      if (!result.success) {
        setError(result.message)
        return
      }
      confirmBookingPayment(booking.id, result.referenceId)
      setStep('done')
      toast.success('Booking confirmed!')
    } catch (err) {
      setError(err instanceof BookingError ? err.message : 'Something went wrong.')
      setStep('slot')
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'done' ? 'Booking Confirmed' : `Book ${service.title}`}
      subtitle={step === 'done' ? undefined : `with ${tutor.firstName} ${tutor.lastName} · ${formatCurrency(service.hourlyRate)}/hr`}
      size="md"
    >
      {step === 'slot' && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-neutral-500">Select an available date & time</p>
          {slots.length === 0 ? (
            <p className="rounded-lg bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">
              This tutor has no open availability right now.
            </p>
          ) : (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedSlotId === s.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200 hover:border-brand-300'
                  }`}
                >
                  <p className="font-medium">{formatDate(s.date)}</p>
                  <p className="text-xs text-neutral-500">{formatTime(s.startTime)} – {formatTime(s.endTime)}</p>
                </button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <>
              <SelectInput label="Duration" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.filter((d) => d <= maxDuration).map((d) => (
                  <option key={d} value={d}>
                    {d} hour{d !== 1 ? 's' : ''} — {formatCurrency(Math.round(service.hourlyRate * d))}
                  </option>
                ))}
              </SelectInput>

              {service.sessionType === 'BOTH' && (
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-700">Session Type</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSessionType('ONLINE')}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${sessionType === 'ONLINE' ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200'}`}
                    >
                      <Video className="size-3.5" /> Online
                    </button>
                    <button
                      onClick={() => setSessionType('IN_PERSON')}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${sessionType === 'IN_PERSON' ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-neutral-200'}`}
                    >
                      <MapPin className="size-3.5" /> In-Person
                    </button>
                  </div>
                </div>
              )}

              <TextArea label="Specific Topic" required placeholder="e.g. Need help with related rates problems" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} />
            </>
          )}

          {error && <p className="text-xs text-danger-600">{error}</p>}
          <Button fullWidth disabled={!selectedSlot} onClick={goToSummary}>
            Continue to Summary
          </Button>
        </div>
      )}

      {step === 'summary' && selectedSlot && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
            <SummaryRow label="Tutor" value={`${tutor.firstName} ${tutor.lastName}`} />
            <SummaryRow label="Service" value={service.title} />
            <SummaryRow label="Specific Topic" value={topic} />
            <SummaryRow label="Date" value={formatDate(selectedSlot.date)} />
            <SummaryRow label="Time" value={`${formatTime(selectedSlot.startTime)} – ${formatTime(endTime)}`} />
            <SummaryRow label="Session Type" value={sessionType === 'ONLINE' ? 'Online (Google Meet)' : 'In-Person'} />
            <div className="my-1 border-t border-neutral-200" />
            <SummaryRow label="Amount Due" value={formatCurrency(amount)} bold />
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input type="checkbox" checked={failMode} onChange={(e) => setFailMode(e.target.checked)} />
            Simulate a declined GCash payment (for testing the failure state)
          </label>
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setStep('slot')}>
              Back
            </Button>
            <Button fullWidth onClick={handlePay}>
              Proceed to Payment
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          {error ? (
            <>
              <XCircle className="size-10 text-danger-600" />
              <p className="font-semibold text-neutral-800">Payment Failed</p>
              <p className="text-sm text-neutral-500">{error}</p>
              <Button
                onClick={() => {
                  setError('')
                  setStep('summary')
                }}
              >
                Try Again
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="size-10 animate-spin text-brand-600" />
              <p className="font-semibold text-neutral-800">Processing GCash payment via PayMongo…</p>
              <p className="text-xs text-neutral-400">Booking {bookingId} · {formatCurrency(amount)}</p>
            </>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="size-12 text-success-600" />
          <p className="text-lg font-semibold text-neutral-900">Payment Successful</p>
          <p className="text-sm text-neutral-500">
            Your session with {tutor.firstName} {tutor.lastName} is confirmed for {selectedSlot && formatDate(selectedSlot.date)}.
          </p>
          <p className="text-xs text-neutral-400">Booking ID: {bookingId}</p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}

      {profile && step === 'slot' && profile.ratingCount === 0 && (
        <p className="mt-3 text-center text-[11px] text-neutral-400">This tutor has no ratings yet.</p>
      )}
    </Modal>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-semibold text-neutral-900' : 'text-neutral-800'}>{value}</span>
    </div>
  )
}
