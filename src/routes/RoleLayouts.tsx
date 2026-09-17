import { AppShell } from '../components/layout/AppShell'
import { adminNav, learnerAccountNav, learnerNav, osasNav, tutorNav } from '../lib/navigation'
import { ProtectedRoute } from './ProtectedRoute'

export function LearnerLayout() {
  return (
    <ProtectedRoute role="learner">
      <AppShell navItems={learnerNav} accountItems={learnerAccountNav} role="learner" searchPlaceholder="Search tutors, subjects, or sessions…" />
    </ProtectedRoute>
  )
}

export function TutorLayout() {
  return (
    <ProtectedRoute role="tutor">
      <AppShell navItems={tutorNav} role="tutor" searchPlaceholder="Search students, subjects, or sessions…" />
    </ProtectedRoute>
  )
}

export function AdminLayout() {
  return (
    <ProtectedRoute role="admin">
      <AppShell navItems={adminNav} role="admin" searchPlaceholder="Search users, tutors, bookings, reports, or settings…" />
    </ProtectedRoute>
  )
}

export function OsasLayout() {
  return (
    <ProtectedRoute role="osas">
      <AppShell navItems={osasNav} role="osas" portalLabel="OSAS Portal" searchPlaceholder="Search cases, reports, documents, or students…" />
    </ProtectedRoute>
  )
}
