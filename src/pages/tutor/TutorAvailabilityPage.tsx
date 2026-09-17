import { useState } from 'react'
import { Tabs } from '../../components/ui/Tabs'
import { ClassScheduleSection } from '../../components/tutor/ClassScheduleSection'
import { AvailabilityCalendar } from '../../components/tutor/AvailabilityCalendar'
import { useCurrentUser } from '../../hooks/useDb'

export function TutorAvailabilityPage() {
  const { userId } = useCurrentUser()
  const [tab, setTab] = useState<'calendar' | 'schedule'>('calendar')
  if (!userId) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Availability & Schedule</h1>
        <p className="text-sm text-neutral-500">Manage your bookable hours and confirmed class schedule.</p>
      </div>

      <Tabs tabs={[{ key: 'calendar', label: 'Availability Calendar' }, { key: 'schedule', label: 'Class Schedule' }]} active={tab} onChange={(k) => setTab(k as any)} />

      {tab === 'calendar' ? <AvailabilityCalendar tutorId={userId} /> : <ClassScheduleSection tutorId={userId} />}
    </div>
  )
}
