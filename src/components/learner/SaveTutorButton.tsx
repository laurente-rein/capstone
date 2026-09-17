import { Heart } from 'lucide-react'
import { useDb } from '../../hooks/useDb'
import { isTutorSaved } from '../../lib/selectors'
import { toggleSaveTutor } from '../../lib/actions'
import { cn } from '../../lib/utils'

export function SaveTutorButton({ learnerId, tutorId, className }: { learnerId: string; tutorId: string; className?: string }) {
  const saved = useDb(() => isTutorSaved(learnerId, tutorId))
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleSaveTutor(learnerId, tutorId)
      }}
      title={saved ? 'Remove from saved tutors' : 'Save tutor'}
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm transition-colors hover:text-danger-500',
        saved && 'text-danger-500',
        className,
      )}
    >
      <Heart className={cn('size-4', saved && 'fill-danger-500')} />
    </button>
  )
}
