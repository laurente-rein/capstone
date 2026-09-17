import { useState } from 'react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getNotificationPreferences } from '../../lib/selectors'
import { updateNotificationPreferences } from '../../lib/actions'
import { toast } from '../../store/toast'

export function LearnerSettingsPage() {
  const { userId } = useCurrentUser()
  const saved = useDb(() => (userId ? getNotificationPreferences(userId) : undefined))
  const [prefs, setPrefs] = useState(saved ?? { emailBookingUpdates: true, emailMessages: true, emailPayments: true })

  if (!userId) return null

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Manage how CampusTutor notifies you.</p>
      </div>

      <Card>
        <CardHeader title="Email Notifications" />
        <CardBody className="space-y-3">
          <ToggleRow
            label="Booking updates"
            description="Confirmations, cancellations, and reschedule requests."
            checked={prefs.emailBookingUpdates}
            onChange={() => toggle('emailBookingUpdates')}
          />
          <ToggleRow
            label="Messages"
            description="New messages from tutors."
            checked={prefs.emailMessages}
            onChange={() => toggle('emailMessages')}
          />
          <ToggleRow
            label="Payments"
            description="Payment confirmations and receipts."
            checked={prefs.emailPayments}
            onChange={() => toggle('emailPayments')}
          />
          <Button
            onClick={() => {
              updateNotificationPreferences(userId, prefs)
              toast.success('Settings saved.')
            }}
          >
            Save Settings
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3.5 py-3">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-700' : 'bg-neutral-200'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}
