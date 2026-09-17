import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useCurrentUser } from '../../hooks/useDb'
import { homePathForUser } from '../../routes/ProtectedRoute'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-neutral-50 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-danger-50">
        <ShieldAlert className="size-8 text-danger-600" />
      </div>
      <h1 className="text-xl font-bold text-neutral-900">Access restricted</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        You don't have permission to view this page with your current role.
      </p>
      <Button onClick={() => navigate(homePathForUser(user))}>Go to my dashboard</Button>
    </div>
  )
}
