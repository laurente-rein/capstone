import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-600 disabled:bg-brand-300',
  secondary: 'bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 focus-visible:ring-brand-600',
  outline: 'bg-transparent text-neutral-700 border border-neutral-300 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-600 disabled:bg-danger-300',
  gold: 'bg-gold-500 text-brand-950 hover:bg-gold-600 focus-visible:ring-gold-500 font-semibold',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-lg',
  lg: 'text-base px-5 py-3 gap-2 rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
