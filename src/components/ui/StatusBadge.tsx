import { cn } from '../../lib/utils'

type Tone = 'green' | 'gold' | 'red' | 'blue' | 'neutral'

const TONE_MAP: Record<string, Tone> = {
  // Booking / generic
  CONFIRMED: 'green',
  PENDING: 'gold',
  COMPLETED: 'blue',
  CANCELLED: 'red',
  // Payment
  PAID: 'green',
  UNPAID: 'neutral',
  PROCESSING: 'gold',
  FAILED: 'red',
  REFUNDED: 'blue',
  // Tutor application
  APPROVED: 'green',
  UNDER_REVIEW: 'gold',
  RESUBMISSION_REQUIRED: 'red',
  REJECTED: 'red',
  // Service / user
  ACTIVE: 'green',
  SUSPENDED: 'red',
  DRAFT: 'neutral',
  // Incident / case
  SUBMITTED: 'gold',
  UNDER_ADMIN_REVIEW: 'gold',
  RESOLVED_PLATFORM: 'green',
  REFERRED_TO_OSAS: 'blue',
  OPEN: 'gold',
  EVIDENCE_REVIEW: 'blue',
  DECIDED: 'green',
  ARCHIVED: 'neutral',
  // Clearance
  CLEARED: 'green',
  ON_HOLD: 'red',
  REQUIRES_RESOLUTION: 'gold',
  PENDING_REVIEW: 'neutral',
  // Evidence
  VALIDATED: 'green',
  INSUFFICIENT: 'red',
  REQUIRES_CLARIFICATION: 'gold',
}

const toneClasses: Record<Tone, string> = {
  green: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20',
  gold: 'bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-600/30',
  red: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-600/20',
  blue: 'bg-info-50 text-info-700 ring-1 ring-inset ring-info-600/20',
  neutral: 'bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-400/20',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONE_MAP[status] ?? 'neutral'
  const text = label ?? status.replace(/_/g, ' ')
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize whitespace-nowrap', toneClasses[tone])}>
      {text.toLowerCase()}
    </span>
  )
}
