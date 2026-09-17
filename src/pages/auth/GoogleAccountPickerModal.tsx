import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Avatar'
import { DEMO_ACCOUNTS } from '../../lib/seed'
import { AuthError, startGoogleSignIn } from '../../lib/actions'

function GoogleG() {
  return (
    <svg className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

export function GoogleAccountPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [useOther, setUseOther] = useState(false)
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  function reset() {
    setUseOther(false)
    setCustomEmail('')
    setCustomName('')
    setError('')
    setLoading(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function pick(email: string, displayName: string) {
    setError('')
    setLoading(email)
    try {
      await new Promise((r) => setTimeout(r, 500))
      startGoogleSignIn(email, displayName)
      reset()
      onClose()
      navigate('/verify-otp')
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className="-mx-5 -mt-4">
        <div className="flex flex-col items-center gap-3 border-b border-neutral-100 px-6 pb-5 pt-2 text-center">
          <GoogleG />
          <div>
            <h2 className="text-lg font-medium text-neutral-800">Choose an account</h2>
            <p className="text-sm text-neutral-500">to continue to CampusTutor</p>
          </div>
        </div>

        {!useOther ? (
          <div className="py-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const [firstName, ...rest] = acc.name.split(' ')
              return (
                <button
                  key={acc.email}
                  onClick={() => pick(acc.email, acc.name)}
                  disabled={!!loading}
                  className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-neutral-50 disabled:opacity-60"
                >
                  <Avatar firstName={firstName} lastName={rest.join(' ')} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">{acc.name}</p>
                    <p className="truncate text-xs text-neutral-500">{acc.email}</p>
                  </div>
                  {loading === acc.email && <span className="text-xs text-neutral-400">Signing in…</span>}
                </button>
              )
            })}
            <button
              onClick={() => setUseOther(true)}
              className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-neutral-50"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <User className="size-4" />
              </span>
              <span className="text-sm font-medium text-neutral-700">Use another account</span>
            </button>

            {error && <p className="px-6 pt-2 text-xs text-danger-600">{error}</p>}

            <p className="px-6 pt-4 text-[11px] text-neutral-400">
              Only official Caraga State University Google accounts (@csu.edu.ph) can access CampusTutor.
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-6 py-5">
            <button onClick={() => setUseOther(false)} className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700">
              <ArrowLeft className="size-3.5" /> Back to accounts
            </button>
            <TextInput label="Full Name" placeholder="Juan Dela Cruz" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            <TextInput label="CSU Google Email" type="email" placeholder="name@csu.edu.ph" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} />
            {error && <p className="text-xs text-danger-600">{error}</p>}
            <Button
              fullWidth
              loading={!!loading}
              onClick={() => {
                if (!customName.trim()) {
                  setError('Please enter your name.')
                  return
                }
                pick(customEmail.trim(), customName.trim())
              }}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
