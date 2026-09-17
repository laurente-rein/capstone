import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle2 } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextInput, SelectInput } from '../../components/ui/Field'
import { COLLEGES, PROGRAMS, YEAR_LEVELS } from '../../lib/constants'
import { AuthError, completeGoogleProfile } from '../../lib/actions'
import { useSessionStore } from '../../store/session'
import { homePathForUser } from '../../routes/ProtectedRoute'

export function CompleteProfilePage() {
  const navigate = useNavigate()
  const challenge = useSessionStore((s) => s.otpChallenge)

  const [firstName, lastName] = challenge ? splitName(challenge.displayName) : ['', '']
  const [form, setForm] = useState({
    firstName,
    lastName,
    studentId: '',
    college: '',
    program: '',
    yearLevel: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Mount-only guard — see OtpPage for why this must not react to `challenge`
    // going null later, which happens on a *successful* submit right below.
    const c = useSessionStore.getState().otpChallenge
    if (!c || c.purpose !== 'GOOGLE_SIGNIN') navigate('/login', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!challenge) return null

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'college' ? { program: '' } : {}) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      const user = completeGoogleProfile(form)
      navigate(homePathForUser(user))
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const programs = form.college ? PROGRAMS[form.college] ?? [] : []

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-xl shadow-neutral-200/50">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50">
          <UserCircle2 className="size-6 text-brand-700" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Complete your profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your CSU Google account (<span className="font-medium text-neutral-700">{challenge.email}</span>) is verified. Just a few more details to set up CampusTutor.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="First Name" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            <TextInput label="Last Name" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <TextInput label="Student ID" required placeholder="2022-00145" value={form.studentId} onChange={(e) => set('studentId', e.target.value)} />
          <SelectInput label="College" required placeholder="Select college" value={form.college} onChange={(e) => set('college', e.target.value)}>
            {COLLEGES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Program"
              required
              placeholder={form.college ? 'Select program' : 'Select college first'}
              value={form.program}
              onChange={(e) => set('program', e.target.value)}
              disabled={!form.college}
            >
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Year Level" required placeholder="Select year" value={form.yearLevel} onChange={(e) => set('yearLevel', e.target.value)}>
              {YEAR_LEVELS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectInput>
          </div>

          {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            Create Account
          </Button>
          <p className="text-center text-[11px] text-neutral-400">
            Every new student account starts as a Learner. You can apply to become a Tutor anytime from your dashboard.
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

function splitName(displayName: string): [string, string] {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], '']
  return [parts[0], parts.slice(1).join(' ')]
}
