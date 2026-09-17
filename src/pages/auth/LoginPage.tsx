import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { GoogleAccountPickerModal } from './GoogleAccountPickerModal'

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

export function LoginPage() {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center shadow-xl shadow-neutral-200/50">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-50">
          <GraduationCap className="size-7 text-brand-700" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Welcome to CampusTutor</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-neutral-500">
          Sign in with your CSU Google account to access your tutoring sessions.
        </p>

        <Button variant="outline" fullWidth size="lg" className="mt-6 border-neutral-200" onClick={() => setPickerOpen(true)}>
          <GoogleG />
          Continue with Google
        </Button>

        <div className="mt-6 border-t border-neutral-100 pt-5">
          <p className="text-xs text-neutral-400">
            By signing in, you agree to our{' '}
            <button className="font-medium text-brand-600 hover:underline">Terms of Service</button> and{' '}
            <button className="font-medium text-brand-600 hover:underline">Privacy Policy</button>.
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-neutral-400">
        Only @csu.edu.ph institutional accounts can sign in. New accounts are created automatically on first sign-in.
      </p>

      <GoogleAccountPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </AuthLayout>
  )
}
