import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { AuthError, completePasswordReset } from '../../lib/actions'
import { useSessionStore } from '../../store/session'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const challenge = useSessionStore((s) => s.otpChallenge)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!challenge && !done) {
    navigate('/forgot-password', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      completePasswordReset(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="rounded-2xl border border-neutral-100 bg-white p-7 text-center shadow-xl shadow-neutral-200/50">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="size-7 text-success-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Password reset successful</h1>
          <p className="mt-1 text-sm text-neutral-500">You can now sign in with your new password.</p>
          <Button fullWidth className="mt-5" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-xl shadow-neutral-200/50">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50">
          <Lock className="size-6 text-brand-700" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-500">Choose a strong password for your CampusTutor account.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <TextInput label="New Password" type="password" required hint="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextInput label="Confirm New Password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            Reset Password
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
