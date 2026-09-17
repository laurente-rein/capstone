import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { AuthTabs } from './AuthTabs'
import { Button } from '../../components/ui/Button'
import { TextInput, SelectInput } from '../../components/ui/Field'
import { COLLEGES, PROGRAMS, YEAR_LEVELS } from '../../lib/constants'
import { AuthError, startRegistration } from '../../lib/actions'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    college: '',
    program: '',
    yearLevel: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'college' ? { program: '' } : {}) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      startRegistration(form)
      navigate('/verify-otp', { state: { purpose: 'REGISTER' } })
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const programs = form.college ? PROGRAMS[form.college] ?? [] : []

  return (
    <AuthLayout>
      <div className="mb-4 flex items-center justify-end gap-3 text-sm">
        <span className="text-neutral-500">Already have an account?</span>
        <Link to="/login">
          <Button variant="secondary" size="sm">
            Login
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-xl shadow-neutral-200/50">
        <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">Register with your official CSU student email.</p>

        <div className="mt-5">
          <AuthTabs active="register" />
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="First Name" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            <TextInput label="Last Name" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <TextInput label="Student ID" required placeholder="2022-00145" value={form.studentId} onChange={(e) => set('studentId', e.target.value)} />
          <TextInput
            label="CSU Email"
            type="email"
            required
            placeholder="name@csu.edu.ph"
            hint="Only @csu.edu.ph institutional emails can register."
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
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
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Password" type="password" required hint="At least 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
            <TextInput label="Confirm Password" type="password" required value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
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
