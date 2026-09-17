import { useState } from 'react'
import { Briefcase, MapPin, Pause, Play, Pencil, Plus, Video, Layers } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getServicesForTutor, hasConfirmedClassSchedule } from '../../lib/selectors'
import { formatCurrency } from '../../lib/utils'
import { ClassScheduleRequiredModal } from '../../components/tutor/ClassScheduleRequiredModal'
import { ServiceFormModal } from '../../components/tutor/ServiceFormModal'
import { tutorReactivateOwnService, tutorSuspendOwnService } from '../../lib/actions'
import type { Service } from '../../types'
import { toast } from '../../store/toast'

const TYPE_ICON = { ONLINE: Video, IN_PERSON: MapPin, BOTH: Layers }

export function TutorServicesPage() {
  const { userId } = useCurrentUser()
  const services = useDb(() => (userId ? getServicesForTutor(userId) : []))
  const hasSchedule = useDb(() => (userId ? hasConfirmedClassSchedule(userId) : false))
  const [showLocked, setShowLocked] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>()

  if (!userId) return null

  function handleCreateClick() {
    if (!hasSchedule) {
      setShowLocked(true)
      return
    }
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Services</h1>
          <p className="text-sm text-neutral-500">Manage the tutoring services you offer.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={handleCreateClick}>
          Create Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Briefcase className="size-6" />}
            title="No services yet"
            description={hasSchedule ? 'Create your first tutoring service to appear in Find a Tutor.' : 'Confirm your class schedule to unlock service creation.'}
            action={
              <Button size="sm" onClick={handleCreateClick}>
                Create Service
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = TYPE_ICON[s.sessionType]
            return (
              <Card key={s.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{s.title}</p>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">{s.level}</p>
                <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{s.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.topics.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Icon className="size-3.5" /> {s.sessionType === 'BOTH' ? 'Online or In-Person' : s.sessionType === 'ONLINE' ? 'Online' : 'In-Person'}
                  </span>
                  <span className="font-bold text-brand-700">{formatCurrency(s.hourlyRate)}/hr</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    icon={<Pencil className="size-3.5" />}
                    onClick={() => {
                      setEditing(s)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  {s.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      icon={<Pause className="size-3.5" />}
                      onClick={() => {
                        tutorSuspendOwnService(s.id)
                        toast.success('Service paused.')
                      }}
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      fullWidth
                      icon={<Play className="size-3.5" />}
                      onClick={() => {
                        tutorReactivateOwnService(s.id)
                        toast.success('Service reactivated.')
                      }}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ClassScheduleRequiredModal open={showLocked} onClose={() => setShowLocked(false)} />
      {formOpen && <ServiceFormModal open tutorId={userId} existing={editing} onClose={() => setFormOpen(false)} />}
    </div>
  )
}
