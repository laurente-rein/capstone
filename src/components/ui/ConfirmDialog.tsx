import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  requireReason?: boolean
  reasonLabel?: string
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  requireReason,
  reasonLabel = 'Reason',
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (requireReason && !reason.trim()) {
      setError('This field is required.')
      return
    }
    setLoading(true)
    try {
      await onConfirm(reason.trim() || undefined)
      setReason('')
      setError('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className={variant === 'danger' ? 'size-4 text-danger-600' : 'size-4 text-brand-600'} />
          {title}
        </span>
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-neutral-600">{description}</p>}
      {requireReason && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-neutral-700">{reasonLabel}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
