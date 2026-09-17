import { useState } from 'react'
import { CalendarDays, MessageSquare, ShieldAlert, Star, Video, MapPin, XCircle } from 'lucide-react'
import { Card } from '../ui/Card'
import { Tabs } from '../ui/Tabs'
import { EmptyState } from '../ui/EmptyState'
import { StatusBadge } from '../ui/StatusBadge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TextArea, SelectInput, TextInput } from '../ui/Field'
import { useDb } from '../../hooks/useDb'
import type { Booking } from '../../types'
import { fullName, getRatingForBooking, getUser } from '../../lib/selectors'
import { formatCurrency, formatDate, formatTime } from '../../lib/utils'
import { cancelBooking, requestReschedule, submitRating, BookingError, submitIncident, getOrCreateConversation } from '../../lib/actions'
import { toast } from '../../store/toast'
import { useNavigate } from 'react-router-dom'

type Role = 'learner' | 'tutor'

export function SessionsBoard({ bookings, viewerRole, viewerId }: { bookings: Booking[]; viewerRole: Role; viewerId: string }) {
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [detailId, setDetailId] = useState<string | null>(null)

  const upcoming = bookings.filter((b) => b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED')
  const completed = bookings.filter((b) => b.bookingStatus === 'COMPLETED')
  const cancelled = bookings.filter((b) => b.bookingStatus === 'CANCELLED')
  const shown = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : cancelled

  const detail = bookings.find((b) => b.id === detailId)

  return (
    <div className="space-y-4">
      <Card>
        <Tabs
          tabs={[
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'completed', label: 'Completed', count: completed.length },
            { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
          ]}
          active={tab}
          onChange={(k) => setTab(k as any)}
        />
        {shown.length === 0 ? (
          <EmptyState icon={<CalendarDays className="size-6" />} title={`No ${tab} sessions`} description="Sessions will show up here." />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((b) => (
              <SessionRow key={b.id} booking={b} viewerRole={viewerRole} onClick={() => setDetailId(b.id)} />
            ))}
          </div>
        )}
      </Card>

      {detail && (
        <SessionDetailDrawer booking={detail} viewerRole={viewerRole} viewerId={viewerId} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}

function SessionRow({ booking, viewerRole, onClick }: { booking: Booking; viewerRole: Role; onClick: () => void }) {
  const otherUser = useDb(() => getUser(viewerRole === 'learner' ? booking.tutorId : booking.learnerId))
  const service = useDb((db) => db.services.find((s) => s.id === booking.serviceId))
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-neutral-50">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-800">
          {service?.title ?? 'Service'} · {viewerRole === 'learner' ? 'with' : 'for'} {fullName(otherUser)}
        </p>
        <p className="text-xs text-neutral-500">
          {formatDate(booking.date)} · {formatTime(booking.startTime)}–{formatTime(booking.endTime)} · {booking.sessionType === 'ONLINE' ? 'Online' : 'In-Person'}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <StatusBadge status={booking.bookingStatus} />
        <StatusBadge status={booking.paymentStatus} />
      </div>
    </button>
  )
}

function SessionDetailDrawer({
  booking,
  viewerRole,
  viewerId,
  onClose,
}: {
  booking: Booking
  viewerRole: Role
  viewerId: string
  onClose: () => void
}) {
  const navigate = useNavigate()
  const otherUser = useDb(() => getUser(viewerRole === 'learner' ? booking.tutorId : booking.learnerId))
  const service = useDb((db) => db.services.find((s) => s.id === booking.serviceId))
  const rating = useDb(() => getRatingForBooking(booking.id))
  const [showCancel, setShowCancel] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showRate, setShowRate] = useState(false)
  const [showIncident, setShowIncident] = useState(false)

  const canCancel = booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED'
  const canRate = viewerRole === 'learner' && booking.bookingStatus === 'COMPLETED' && !rating

  function handleMessage() {
    if (!otherUser) return
    const convId = getOrCreateConversation(viewerId, otherUser.id, booking.id)
    onClose()
    navigate(`/${viewerRole}/messages?conversation=${convId}`)
  }

  return (
    <>
      <Drawer open onClose={onClose} title={service?.title ?? 'Session Details'} subtitle={`Booking ${booking.id}`}>
        <div className="space-y-5">
          <div className="flex gap-1.5">
            <StatusBadge status={booking.bookingStatus} />
            <StatusBadge status={booking.paymentStatus} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label={viewerRole === 'learner' ? 'Tutor' : 'Learner'} value={fullName(otherUser)} />
            <Field label="Specific Topic" value={booking.specificTopic} />
            <Field label="Date" value={formatDate(booking.date)} />
            <Field label="Time" value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`} />
            <Field
              label="Session Type"
              value={
                <span className="flex items-center gap-1">
                  {booking.sessionType === 'ONLINE' ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}
                  {booking.sessionType === 'ONLINE' ? booking.meetingPlatform ?? 'Online' : booking.location ?? 'In-Person'}
                </span>
              }
            />
            <Field label="Amount" value={formatCurrency(booking.amount)} />
          </div>

          {booking.cancelReason && (
            <div className="rounded-lg bg-danger-50 p-3 text-xs text-danger-700">
              <p className="font-medium">Cancelled by {booking.cancelledBy === viewerId ? 'you' : fullName(otherUser)}</p>
              <p>{booking.cancelReason}</p>
            </div>
          )}

          {rating && (
            <div className="rounded-lg bg-gold-50 p-3 text-xs">
              <p className="mb-1 flex items-center gap-1 font-medium text-gold-700">
                {Array.from({ length: rating.stars }).map((_, i) => (
                  <Star key={i} className="size-3 fill-gold-500 text-gold-500" />
                ))}
              </p>
              <p className="text-neutral-600">{rating.comment}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button fullWidth variant="secondary" icon={<MessageSquare className="size-4" />} onClick={handleMessage}>
              Message {viewerRole === 'learner' ? 'Tutor' : 'Learner'}
            </Button>

            {booking.sessionType === 'ONLINE' && booking.meetingUrl && booking.bookingStatus === 'CONFIRMED' && (
              <Button fullWidth variant="outline" icon={<Video className="size-4" />} onClick={() => window.open(booking.meetingUrl, '_blank')}>
                Open External Meeting
              </Button>
            )}

            {canCancel && (
              <Button fullWidth variant="outline" onClick={() => setShowReschedule(true)}>
                Request Reschedule
              </Button>
            )}

            {canRate && (
              <Button fullWidth variant="gold" icon={<Star className="size-4" />} onClick={() => setShowRate(true)}>
                Rate & Review
              </Button>
            )}

            {(booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CONFIRMED') && (
              <Button fullWidth variant="outline" icon={<ShieldAlert className="size-4" />} onClick={() => setShowIncident(true)}>
                Report an Issue
              </Button>
            )}

            {canCancel && (
              <Button fullWidth variant="danger" icon={<XCircle className="size-4" />} onClick={() => setShowCancel(true)}>
                Cancel Session
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel this session?"
        description="Cancelling does not automatically issue a refund. The other party will be notified."
        confirmLabel="Cancel Session"
        requireReason
        reasonLabel="Reason for cancellation"
        onConfirm={async (reason) => {
          try {
            cancelBooking(booking.id, viewerId, reason ?? '')
            toast.success('Session cancelled.')
            setShowCancel(false)
            onClose()
          } catch (err) {
            toast.error(err instanceof BookingError ? err.message : 'Could not cancel session.')
          }
        }}
      />

      {showReschedule && (
        <RescheduleModal booking={booking} viewerId={viewerId} onClose={() => setShowReschedule(false)} />
      )}
      {showRate && <RateModal bookingId={booking.id} learnerId={viewerId} onClose={() => setShowRate(false)} />}
      {showIncident && (
        <ReportIncidentModal booking={booking} reporterId={viewerId} reportedUserId={otherUser?.id ?? ''} onClose={() => setShowIncident(false)} />
      )}
    </>
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

function RescheduleModal({ booking, viewerId, onClose }: { booking: Booking; viewerId: string; onClose: () => void }) {
  const [date, setDate] = useState(booking.date)
  const [start, setStart] = useState(booking.startTime)
  const [end, setEnd] = useState(booking.endTime)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  return (
    <Modal
      open
      onClose={onClose}
      title="Request Reschedule"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                setError('Please provide a reason.')
                return
              }
              requestReschedule(booking.id, viewerId, date, start, end, reason.trim())
              toast.success('Reschedule request sent.')
              onClose()
            }}
          >
            Send Request
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput label="New Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Start Time" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextInput label="End Time" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <TextArea label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        {error && <p className="text-xs text-danger-600">{error}</p>}
        <p className="text-[11px] text-neutral-400">The other party must accept this before the session time changes.</p>
      </div>
    </Modal>
  )
}

function RateModal({ bookingId, learnerId, onClose }: { bookingId: string; learnerId: string; onClose: () => void }) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  return (
    <Modal
      open
      onClose={onClose}
      title="Rate & Review"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              try {
                submitRating(bookingId, learnerId, stars, comment.trim())
                toast.success('Thanks for your feedback!')
                onClose()
              } catch (err) {
                setError(err instanceof BookingError ? err.message : 'Could not submit rating.')
              }
            }}
          >
            Submit Rating
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStars(s)}>
              <Star className={`size-8 ${s <= stars ? 'fill-gold-500 text-gold-500' : 'text-neutral-200'}`} />
            </button>
          ))}
        </div>
        <TextArea label="Comment" placeholder="How was your session?" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    </Modal>
  )
}

const INCIDENT_TYPES = ['No Show', 'Harassment', 'Payment Dispute', 'Inappropriate Conduct', 'Academic Dishonesty', 'Technical Issue', 'Other']

function ReportIncidentModal({
  booking,
  reporterId,
  reportedUserId,
  onClose,
}: {
  booking: Booking
  reporterId: string
  reportedUserId: string
  onClose: () => void
}) {
  const [type, setType] = useState(INCIDENT_TYPES[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  return (
    <Modal
      open
      onClose={onClose}
      title="Report an Issue"
      subtitle={`Booking ${booking.id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              try {
                submitIncident({
                  bookingId: booking.id,
                  reporterId,
                  reportedUserId,
                  incidentType: type as any,
                  description,
                  evidenceFileNames: [],
                })
                toast.success('Report submitted. Admin will review it shortly.')
                onClose()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not submit report.')
              }
            }}
          >
            Submit Report
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <SelectInput label="Incident Type" value={type} onChange={(e) => setType(e.target.value)}>
          {INCIDENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectInput>
        <TextArea label="Description" required rows={4} placeholder="Describe what happened…" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-xs text-danger-600">{error}</p>}
        <p className="text-[11px] text-neutral-400">Submitting a report does not automatically establish misconduct — Admin will review it.</p>
      </div>
    </Modal>
  )
}
