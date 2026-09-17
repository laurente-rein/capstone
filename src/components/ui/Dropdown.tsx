import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
}: {
  trigger: (opts: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-neutral-50',
        danger ? 'text-danger-600' : 'text-neutral-700',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
