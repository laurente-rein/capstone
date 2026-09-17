import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">{icon}</div>}
      <p className="text-sm font-semibold text-neutral-700">{title}</p>
      {description && <p className="max-w-xs text-xs text-neutral-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
