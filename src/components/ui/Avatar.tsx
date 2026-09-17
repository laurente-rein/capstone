import { initials } from '../../lib/utils'
import { cn } from '../../lib/utils'

export function Avatar({ firstName, lastName, size = 'md' }: { firstName: string; lastName: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base' }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        sizeClasses[size],
      )}
    >
      {initials(firstName, lastName)}
    </div>
  )
}
