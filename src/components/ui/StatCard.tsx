import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const toneClasses = {
  brand: 'bg-brand-700 text-white',
  gold: 'bg-gold-500 text-brand-950',
  success: 'bg-success-600 text-white',
  info: 'bg-info-600 text-white',
  neutral: 'bg-neutral-700 text-white',
  danger: 'bg-danger-600 text-white',
  purple: 'bg-violet-600 text-white',
}

export function StatCard({
  icon,
  value,
  label,
  sublabel,
  tone = 'brand',
  onClick,
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  sublabel?: string
  tone?: keyof typeof toneClasses
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
      )}
    >
      <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', toneClasses[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-neutral-900">{value}</p>
        <p className="truncate text-xs font-medium text-neutral-600" title={label}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-[11px] text-neutral-400" title={sublabel}>
            {sublabel}
          </p>
        )}
      </div>
    </Comp>
  )
}
