import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { AuthTabs } from './AuthTabs'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { loginWithPassword, AuthError } from '../../lib/actions'
import { homePathForUser } from '../../routes/ProtectedRoute'
import { DEMO_ACCOUNTS } from '../../lib/seed'
import { toast } from '../../store/toast'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      const user = loginWithPassword(email, password)
      navigate(homePathForUser(user))
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-4 flex items-center justify-end gap-3 text-sm">
        <span className="text-neutral-500">New to CampusTutor?</span>
        <Link to="/register">
          <Button variant="secondary" size="sm">
            Register
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-xl shadow-neutral-200/50">
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back!</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to continue your learning journey.</p>

        <div className="mt-5">
          <AuthTabs active="login" />
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <TextInput
            label="CSU Email"
            type="email"
            required
            icon={<Mail className="size-4" />}
            placeholder="name@csu.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <TextInput
              type="password"
              required
              icon={<Lock className="size-4" />}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>

          {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            Continue with CSU Email
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          or
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={() => toast.info('Google sign-in is disabled in this demo — CampusTutor accounts require a verified @csu.edu.ph email.')}
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-gold-50 p-3.5">
          <div className="mt-0.5 text-gold-600">🛡️</div>
          <div>
            <p className="text-sm font-medium text-neutral-800">Only CSU student email accounts can register.</p>
            <p className="text-xs text-neutral-500">Use your @csu.edu.ph email to access CampusTutor.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 text-xs text-neutral-400">
        <button onClick={() => setShowDemo((v) => !v)} className="font-medium text-brand-600 hover:underline">
          Need Help?
        </button>
        <span>·</span>
        <button onClick={() => setShowDemo((v) => !v)} className="hover:underline">Visit our Help Center</button>
        <span>·</span>
        <a href="mailto:support@campustutor.csu.edu.ph" className="hover:underline">Contact Support</a>
      </div>

      {showDemo && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
          <p className="mb-2 font-semibold text-neutral-700">Demo accounts (password: Passw0rd!)</p>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email} className="flex items-center justify-between gap-2">
                <span>{acc.role}</span>
                <button
                  className="font-mono text-brand-600 hover:underline"
                  onClick={() => {
                    setEmail(acc.email)
                    setPassword(acc.password)
                  }}
                >
                  {acc.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthLayout>
  )
}
