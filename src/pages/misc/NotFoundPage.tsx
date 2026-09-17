import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useCurrentUser } from '../../hooks/useDb'
import { homePathForUser } from '../../routes/ProtectedRoute'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-neutral-50 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
        <Compass className="size-8 text-neutral-400" />
      </div>
      <h1 className="text-xl font-bold text-neutral-900">Page not found</h1>
      <p className="max-w-sm text-sm text-neutral-500">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate(homePathForUser(user))}>Go home</Button>
    </div>
  )
}
