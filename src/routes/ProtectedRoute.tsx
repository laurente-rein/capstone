import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AppRole } from '../types'
import { useCurrentUser } from '../hooks/useDb'

export function ProtectedRoute({ role, children }: { role: AppRole; children: ReactNode }) {
  const { user } = useCurrentUser()

  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'suspended') return <Navigate to="/login" replace />
  if (!user.roles.includes(role)) return <Navigate to="/unauthorized" replace />

  return <>{children}</>
}

export function homePathForUser(user: { roles: AppRole[] } | undefined | null): string {
  if (!user) return '/login'
  if (user.roles.includes('admin')) return '/admin/overview'
  if (user.roles.includes('osas')) return '/osas/overview'
  if (user.roles.includes('learner')) return '/learner/dashboard'
  if (user.roles.includes('tutor')) return '/tutor/dashboard'
  return '/login'
}
