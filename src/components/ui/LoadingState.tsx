import { Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center text-neutral-500">
      <Loader2 className="size-6 animate-spin text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={className ?? 'size-4 animate-spin'} />
}
