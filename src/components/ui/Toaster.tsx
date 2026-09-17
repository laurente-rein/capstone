import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore } from '../../store/toast'
import { cn } from '../../lib/utils'

const ICONS = {
  success: <CheckCircle2 className="size-4 text-success-600" />,
  error: <XCircle className="size-4 text-danger-600" />,
  info: <Info className="size-4 text-info-600" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-2 rounded-lg border bg-white px-3.5 py-3 text-sm shadow-lg',
            t.type === 'success' && 'border-success-200',
            t.type === 'error' && 'border-danger-200',
            t.type === 'info' && 'border-info-200',
          )}
        >
          {ICONS[t.type]}
          <p className="flex-1 text-neutral-700">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-neutral-400 hover:text-neutral-600">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
