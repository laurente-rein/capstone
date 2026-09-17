import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { AuthError, startPasswordReset } from '../../lib/actions'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      startPasswordReset(email)
      navigate('/verify-otp', { state: { purpose: 'RESET' } })
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-xl shadow-neutral-200/50">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50">
          <KeyRound className="size-6 text-brand-700" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-neutral-500">Enter your CSU email and we'll send you a verification code.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <TextInput label="CSU Email" type="email" required placeholder="name@csu.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            Send Reset Code
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
