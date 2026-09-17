import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { TextInput } from '../ui/Field'
import { useDb } from '../../hooks/useDb'
import { getActiveClassSchedule, getOccupyingBookings } from '../../lib/selectors'
import { createAvailability, deleteAvailability, TutorActionError } from '../../lib/actions'
import { addDaysToDateStr, cn, dayOfWeekCode, formatTime, todayStr } from '../../lib/utils'
import { toast } from '../../store/toast'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const START_HOUR = 7
const END_HOUR = 21
const ROW_HEIGHT = 36 // px per hour

function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  return addDaysToDateStr(dateStr, -day)
}

function minutesFromMidnight(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function topPx(time: string) {
  return ((minutesFromMidnight(time) - START_HOUR * 60) / 60) * ROW_HEIGHT
}
function heightPx(start: string, end: string) {
  return ((minutesFromMidnight(end) - minutesFromMidnight(start)) / 60) * ROW_HEIGHT
}

export function AvailabilityCalendar({ tutorId }: { tutorId: string }) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [anchor, setAnchor] = useState(todayStr())
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState(todayStr())

  const schedule = useDb(() => getActiveClassSchedule(tutorId))
  const bookings = useDb(() => getOccupyingBookings(tutorId))
  const slots = useDb((db) => db.availabilitySlots.filter((s) => s.tutorId === tutorId && s.isActive))

  const weekStart = startOfWeek(anchor)
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysToDateStr(weekStart, i)), [weekStart])
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), [])

  function navigate(dir: -1 | 1) {
    setAnchor((a) => addDaysToDateStr(a, dir * (view === 'week' ? 7 : 30)))
  }

  return (
    <Card>
      <CardHeader
        title="Availability Calendar"
        subtitle="Class blocks and confirmed sessions are shown automatically."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-neutral-200 p-0.5 text-xs font-medium">
              <button onClick={() => setView('week')} className={cn('rounded-md px-2.5 py-1', view === 'week' ? 'bg-brand-700 text-white' : 'text-neutral-500')}>
                Week
              </button>
              <button onClick={() => setView('month')} className={cn('rounded-md px-2.5 py-1', view === 'month' ? 'bg-brand-700 text-white' : 'text-neutral-500')}>
                Month
              </button>
            </div>
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setAddOpen(true)}>
              Add Availability
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-2.5">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="rounded-md p-1.5 hover:bg-neutral-100">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setAnchor(todayStr())} className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
            Today
          </button>
          <button onClick={() => navigate(1)} className="rounded-md p-1.5 hover:bg-neutral-100">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <p className="text-sm font-medium text-neutral-700">
          {view === 'week' ? `Week of ${weekDates[0]}` : anchor.slice(0, 7)}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
          <Legend color="bg-neutral-300" label="Class" />
          <Legend color="bg-success-400" label="Available" />
          <Legend color="bg-gold-400" label="Booked" />
        </div>
      </div>

      {view === 'week' ? (
        <div className="overflow-x-auto p-4">
          <div className="grid min-w-[720px] grid-cols-[50px_repeat(7,1fr)]">
            <div />
            {weekDates.map((d, i) => (
              <div key={d} className="pb-2 text-center text-xs font-medium text-neutral-500">
                {DAY_LABELS[i]}
                <div className={cn('mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-xs', d === todayStr() ? 'bg-brand-700 text-white' : 'text-neutral-700')}>
                  {Number(d.slice(8, 10))}
                </div>
              </div>
            ))}

            <div className="relative" style={{ height: hours.length * ROW_HEIGHT }}>
              {hours.map((h) => (
                <div key={h} className="absolute right-1 -translate-y-2 text-[10px] text-neutral-400" style={{ top: (h - START_HOUR) * ROW_HEIGHT }}>
                  {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'AM' : 'PM'}
                </div>
              ))}
            </div>

            {weekDates.map((date) => {
              const dow = dayOfWeekCode(date)
              const classBlocks = schedule?.entries.filter((e) => e.day === dow) ?? []
              const dayBookings = bookings.filter((b) => b.date === date)
              const daySlots = slots.filter((s) => s.date === date)
              return (
                <div key={date} className="relative border-l border-neutral-100" style={{ height: hours.length * ROW_HEIGHT }}>
                  {hours.map((h) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-neutral-50" style={{ top: (h - START_HOUR) * ROW_HEIGHT }} />
                  ))}
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="group absolute inset-x-0.5 rounded bg-success-100 px-1 text-[10px] text-success-700 ring-1 ring-inset ring-success-300"
                      style={{ top: topPx(s.startTime), height: Math.max(heightPx(s.startTime, s.endTime), 16) }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{formatTime(s.startTime)}</span>
                        <button
                          onClick={() => {
                            deleteAvailability(s.id)
                            toast.info('Availability removed.')
                          }}
                          className="hidden text-success-700 group-hover:block"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {classBlocks.map((c) => (
                    <div
                      key={c.id}
                      className="absolute inset-x-0.5 truncate rounded bg-neutral-300 px-1 text-[10px] font-medium text-neutral-700"
                      style={{ top: topPx(c.startTime), height: Math.max(heightPx(c.startTime, c.endTime), 16) }}
                      title={`${c.courseCode} ${c.startTime}-${c.endTime}`}
                    >
                      {c.courseCode}
                    </div>
                  ))}
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className="absolute inset-x-0.5 truncate rounded bg-gold-400 px-1 text-[10px] font-medium text-brand-950"
                      style={{ top: topPx(b.startTime), height: Math.max(heightPx(b.startTime, b.endTime), 16) }}
                      title={`Booked ${b.startTime}-${b.endTime}`}
                    >
                      Booked
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <MonthGrid
          anchor={anchor}
          tutorId={tutorId}
          onSelectDay={(d) => {
            setAnchor(d)
            setView('week')
          }}
        />
      )}

      <AddAvailabilityModal open={addOpen} onClose={() => setAddOpen(false)} tutorId={tutorId} initialDate={addDate} setInitialDate={setAddDate} />
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('size-2 rounded-full', color)} />
      {label}
    </span>
  )
}

function MonthGrid({ anchor, tutorId, onSelectDay }: { anchor: string; tutorId: string; onSelectDay: (d: string) => void }) {
  const schedule = useDb(() => getActiveClassSchedule(tutorId))
  const bookings = useDb(() => getOccupyingBookings(tutorId))
  const slots = useDb((db) => db.availabilitySlots.filter((s) => s.tutorId === tutorId && s.isActive))

  const [year, month] = anchor.split('-').map(Number)
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
  const gridStart = startOfWeek(firstOfMonth)
  const days = Array.from({ length: 42 }, (_, i) => addDaysToDateStr(gridStart, i))

  return (
    <div className="grid grid-cols-7 gap-1 p-4">
      {DAY_LABELS.map((d) => (
        <div key={d} className="pb-1 text-center text-xs font-medium text-neutral-400">
          {d}
        </div>
      ))}
      {days.map((date) => {
        const inMonth = Number(date.slice(5, 7)) === month
        const dow = dayOfWeekCode(date)
        const hasClass = schedule?.entries.some((e) => e.day === dow)
        const hasSlot = slots.some((s) => s.date === date)
        const hasBooking = bookings.some((b) => b.date === date)
        return (
          <button
            key={date}
            onClick={() => onSelectDay(date)}
            className={cn(
              'flex h-16 flex-col items-start rounded-lg border p-1.5 text-left text-xs hover:border-brand-300',
              inMonth ? 'border-neutral-100 bg-white' : 'border-transparent bg-neutral-50 text-neutral-300',
              date === todayStr() && 'ring-1 ring-brand-500',
            )}
          >
            <span className={cn('font-medium', inMonth ? 'text-neutral-700' : 'text-neutral-300')}>{Number(date.slice(8, 10))}</span>
            <div className="mt-auto flex gap-1">
              {hasClass && <span className="size-1.5 rounded-full bg-neutral-400" />}
              {hasSlot && <span className="size-1.5 rounded-full bg-success-500" />}
              {hasBooking && <span className="size-1.5 rounded-full bg-gold-500" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function AddAvailabilityModal({
  open,
  onClose,
  tutorId,
  initialDate,
  setInitialDate,
}: {
  open: boolean
  onClose: () => void
  tutorId: string
  initialDate: string
  setInitialDate: (d: string) => void
}) {
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('11:00')
  const [error, setError] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Availability"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setError('')
              try {
                createAvailability(tutorId, initialDate, start, end)
                toast.success('Availability added.')
                onClose()
              } catch (err) {
                setError(err instanceof TutorActionError ? err.message : 'This slot conflicts with an existing commitment.')
              }
            }}
          >
            Add
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput label="Date" type="date" value={initialDate} onChange={(e) => setInitialDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Start Time" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextInput label="End Time" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    </Modal>
  )
}
