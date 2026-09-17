import { useState } from 'react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { TextInput } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useDb } from '../../hooks/useDb'
import { getSettings } from '../../lib/selectors'
import { SettingsError, updateSettings } from '../../lib/actions'
import { toast } from '../../store/toast'

export function AdminSettingsPage() {
  const settings = useDb(getSettings)
  const [tutorPct, setTutorPct] = useState(settings.tutorSharePct * 100)
  const [osasPct, setOsasPct] = useState(settings.osasSharePct * 100)
  const [platformPct, setPlatformPct] = useState(settings.platformSharePct * 100)
  const [ocrThreshold, setOcrThreshold] = useState(settings.ocrConfidenceThreshold)
  const [error, setError] = useState('')

  const total = tutorPct + osasPct + platformPct

  function handleSave() {
    setError('')
    try {
      updateSettings({
        ...settings,
        ocrConfidenceThreshold: ocrThreshold,
        tutorSharePct: tutorPct / 100,
        osasSharePct: osasPct / 100,
        platformSharePct: platformPct / 100,
      })
      toast.success('Settings updated. Historical transactions are not affected.')
    } catch (err) {
      setError(err instanceof SettingsError ? err.message : 'Could not save settings.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">System Settings</h1>
        <p className="text-sm text-neutral-500">Core CampusTutor business rules.</p>
      </div>

      <Card>
        <CardHeader title="Tutor Verification" />
        <CardBody className="space-y-3">
          <TextInput
            label="OCR Confidence Threshold (%)"
            type="number"
            min={0}
            max={100}
            value={ocrThreshold}
            onChange={(e) => setOcrThreshold(Number(e.target.value))}
            hint="Decision support only — does not trigger automatic approval."
          />
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-700">Automatic Tutor Approval</p>
              <p className="text-xs text-neutral-400">Permanently disabled — every application requires manual Admin review.</p>
            </div>
            <span className="rounded-full bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700">Disabled</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payment" />
        <CardBody className="grid grid-cols-2 gap-3">
          <TextInput label="Provider" value={settings.paymentProvider} disabled />
          <TextInput label="Method" value={settings.paymentMethod} disabled />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payment Allocation" subtitle="Must total exactly 100%." />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <TextInput label="Tutor %" type="number" value={tutorPct} onChange={(e) => setTutorPct(Number(e.target.value))} />
            <TextInput label="OSAS %" type="number" value={osasPct} onChange={(e) => setOsasPct(Number(e.target.value))} />
            <TextInput label="Platform %" type="number" value={platformPct} onChange={(e) => setPlatformPct(Number(e.target.value))} />
          </div>
          <p className={`text-xs font-medium ${total === 100 ? 'text-success-600' : 'text-danger-600'}`}>Total: {total}%</p>
          {error && <p className="text-xs text-danger-600">{error}</p>}
          <p className="text-[11px] text-neutral-400">Changes only apply to future transactions — historical records keep the percentages applied at the time.</p>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardBody>
      </Card>
    </div>
  )
}
