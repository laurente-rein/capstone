import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { AuthError, resendOtp, verifyOtp } from '../../lib/actions'
import { useSessionStore } from '../../store/session'
import { homePathForUser } from '../../routes/ProtectedRoute'
import { OTP_LENGTH } from '../../lib/constants'

export function OtpPage() {
  const navigate = useNavigate()
  const challenge = useSessionStore((s) => s.otpChallenge)
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [justSent, setJustSent] = useState(true)
  const [now, setNow] = useState(Date.now())
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    // Only guard on mount — a challenge that later goes null is the *expected*
    // result of a successful verification (see handleVerify), not a reason to
    // bounce back to login and stomp on the navigation that just happened.
    if (!useSessionStore.getState().otpChallenge) navigate('/login', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!challenge) return null

  const remainingMs = Math.max(0, challenge.expiresAt - now)
  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0')
  const expired = remainingMs <= 0
  const cooldownMs = Math.max(0, 30000 - (now - challenge.lastSentAt))

  function handleChange(idx: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1)
    setDigits((d) => {
      const next = [...d]
      next[idx] = v
      return next
    })
    if (v && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (text.length) {
      setDigits((d) => {
        const next = [...d]
        for (let i = 0; i < OTP_LENGTH; i++) next[i] = text[i] ?? ''
        return next
      })
      e.preventDefault()
    }
  }

  async function handleVerify() {
    setError('')
    const code = digits.join('')
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      const result = verifyOtp(code)
      if (result.status === 'LOGGED_IN') {
        navigate(homePathForUser(result.user))
      } else {
        navigate('/complete-profile')
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Verification failed.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  function handleResend() {
    try {
      resendOtp()
      setJustSent(true)
      setDigits(Array(OTP_LENGTH).fill(''))
      setError('')
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not resend code.')
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-100 bg-white p-7 text-center shadow-xl shadow-neutral-200/50">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-gold-50">
          <ShieldCheck className="size-7 text-gold-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Verify Your Email</h1>
        <p className="mt-1 text-sm text-neutral-500">We sent a 6-digit code to</p>
        <p className="text-sm font-semibold text-neutral-800">{challenge.email}</p>

        <div className="mt-6 flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el
              }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="size-11 rounded-lg border border-neutral-300 text-center text-lg font-semibold outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-neutral-400">
          {expired ? (
            <span className="font-medium text-danger-600">This code has expired.</span>
          ) : (
            <>This code will expire in <span className="font-semibold text-neutral-600">{mm}:{ss}</span></>
          )}
        </p>

        {error && <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

        <p className="mt-4 text-xs text-neutral-500">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={cooldownMs > 0}
            className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400"
          >
            {cooldownMs > 0 ? `Resend code (${Math.ceil(cooldownMs / 1000)}s)` : 'Resend code'}
          </button>
        </p>

        <div className="mt-5 space-y-2">
          <Button fullWidth onClick={handleVerify} loading={loading} disabled={expired}>
            Verify Code
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              useSessionStore.getState().setOtpChallenge(null)
              navigate('/login')
            }}
          >
            ← Use a Different Account
          </Button>
        </div>

        {justSent && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-success-50 p-3 text-left">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-600" />
            <div>
              <p className="text-sm font-medium text-success-800">Code sent successfully!</p>
              <p className="text-xs text-success-700">Please check your inbox and enter the 6-digit code.</p>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] text-neutral-400">Dev mode: check the browser console for the OTP code.</p>
      </div>
    </AuthLayout>
  )
}
