import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/Field'
import { useDb } from '../../hooks/useDb'
import { getSettings } from '../../lib/selectors'

export function OsasSettingsPage() {
  const settings = useDb(getSettings)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Read-only — these platform settings are managed by Admin.</p>
      </div>

      <Card>
        <CardHeader title="Payment Allocation" />
        <CardBody className="grid grid-cols-3 gap-3">
          <TextInput label="Tutor %" value={`${Math.round(settings.tutorSharePct * 100)}%`} disabled />
          <TextInput label="OSAS %" value={`${Math.round(settings.osasSharePct * 100)}%`} disabled />
          <TextInput label="Platform %" value={`${Math.round(settings.platformSharePct * 100)}%`} disabled />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payment Provider" />
        <CardBody className="grid grid-cols-2 gap-3">
          <TextInput label="Provider" value={settings.paymentProvider} disabled />
          <TextInput label="Method" value={settings.paymentMethod} disabled />
        </CardBody>
      </Card>
    </div>
  )
}
