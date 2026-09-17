import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function ClassScheduleRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal open={open} onClose={onClose} title="Class Schedule Required" size="sm">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gold-50">
          <CalendarClock className="size-6 text-gold-600" />
        </div>
        <p className="text-sm text-neutral-600">
          Upload and confirm your current CSU class schedule before creating a tutoring service. CampusTutor uses
          your class schedule to prevent tutoring availability from conflicting with your classes.
        </p>
        <div className="mt-2 flex w-full gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={() => {
              onClose()
              navigate('/tutor/availability')
            }}
          >
            Upload Class Schedule
          </Button>
        </div>
      </div>
    </Modal>
  )
}
