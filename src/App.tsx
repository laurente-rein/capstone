import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import { useCurrentUser } from './hooks/useDb'
import { homePathForUser } from './routes/ProtectedRoute'
import { reconcileSessionStatuses } from './lib/actions'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OtpPage } from './pages/auth/OtpPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { UnauthorizedPage } from './pages/misc/UnauthorizedPage'
import { NotFoundPage } from './pages/misc/NotFoundPage'

import { LearnerLayout, TutorLayout, AdminLayout, OsasLayout } from './routes/RoleLayouts'
import { LearnerDashboard } from './pages/learner/LearnerDashboard'
import { FindTutorPage } from './pages/learner/FindTutorPage'
import { LearnerSessionsPage } from './pages/learner/LearnerSessionsPage'
import { LearnerMessagesPage } from './pages/learner/LearnerMessagesPage'
import { LearnerNotificationsPage } from './pages/learner/LearnerNotificationsPage'
import { ApplyAsTutorPage } from './pages/learner/ApplyAsTutorPage'
import { LearnerProfilePage } from './pages/learner/LearnerProfilePage'
import { LearnerHelpPage } from './pages/learner/LearnerHelpPage'

import { TutorDashboard } from './pages/tutor/TutorDashboard'
import { TutorServicesPage } from './pages/tutor/TutorServicesPage'
import { TutorAvailabilityPage } from './pages/tutor/TutorAvailabilityPage'
import { TutorSessionsPage } from './pages/tutor/TutorSessionsPage'
import { TutorMessagesPage } from './pages/tutor/TutorMessagesPage'
import { TutorEarningsPage } from './pages/tutor/TutorEarningsPage'
import { TutorNotificationsPage } from './pages/tutor/TutorNotificationsPage'
import { TutorProfilePage } from './pages/tutor/TutorProfilePage'
import { TutorHelpPage } from './pages/tutor/TutorHelpPage'

import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminUserManagementPage } from './pages/admin/AdminUserManagementPage'
import { AdminTutorVerificationPage } from './pages/admin/AdminTutorVerificationPage'
import { AdminServiceManagementPage } from './pages/admin/AdminServiceManagementPage'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage'
import { AdminIncidentsPage } from './pages/admin/AdminIncidentsPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

import { OsasOverviewPage } from './pages/osas/OsasOverviewPage'
import { OsasCaseReviewPage } from './pages/osas/OsasCaseReviewPage'
import { OsasEvidenceValidationPage } from './pages/osas/OsasEvidenceValidationPage'
import { OsasIncidentMonitoringPage } from './pages/osas/OsasIncidentMonitoringPage'
import { OsasClearancePage } from './pages/osas/OsasClearancePage'
import { OsasPoliciesPage } from './pages/osas/OsasPoliciesPage'
import { OsasArchivePage } from './pages/osas/OsasArchivePage'
import { OsasReportsPage } from './pages/osas/OsasReportsPage'
import { OsasSettingsPage } from './pages/osas/OsasSettingsPage'

function RootRedirect() {
  const { user } = useCurrentUser()
  return <Navigate to={homePathForUser(user)} replace />
}

export default function App() {
  useEffect(() => {
    reconcileSessionStatuses()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<LearnerLayout />}>
          <Route path="/learner/dashboard" element={<LearnerDashboard />} />
          <Route path="/learner/find-tutor" element={<FindTutorPage />} />
          <Route path="/learner/sessions" element={<LearnerSessionsPage />} />
          <Route path="/learner/messages" element={<LearnerMessagesPage />} />
          <Route path="/learner/notifications" element={<LearnerNotificationsPage />} />
          <Route path="/learner/apply-tutor" element={<ApplyAsTutorPage />} />
          <Route path="/learner/profile" element={<LearnerProfilePage />} />
          <Route path="/learner/help" element={<LearnerHelpPage />} />
        </Route>

        <Route element={<TutorLayout />}>
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/services" element={<TutorServicesPage />} />
          <Route path="/tutor/availability" element={<TutorAvailabilityPage />} />
          <Route path="/tutor/sessions" element={<TutorSessionsPage />} />
          <Route path="/tutor/messages" element={<TutorMessagesPage />} />
          <Route path="/tutor/earnings" element={<TutorEarningsPage />} />
          <Route path="/tutor/notifications" element={<TutorNotificationsPage />} />
          <Route path="/tutor/profile" element={<TutorProfilePage />} />
          <Route path="/tutor/help" element={<TutorHelpPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin/overview" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/tutor-verification" element={<AdminTutorVerificationPage />} />
          <Route path="/admin/services" element={<AdminServiceManagementPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        <Route element={<OsasLayout />}>
          <Route path="/osas/overview" element={<OsasOverviewPage />} />
          <Route path="/osas/case-review" element={<OsasCaseReviewPage />} />
          <Route path="/osas/evidence-validation" element={<OsasEvidenceValidationPage />} />
          <Route path="/osas/incident-monitoring" element={<OsasIncidentMonitoringPage />} />
          <Route path="/osas/clearance" element={<OsasClearancePage />} />
          <Route path="/osas/policies" element={<OsasPoliciesPage />} />
          <Route path="/osas/archive" element={<OsasArchivePage />} />
          <Route path="/osas/reports" element={<OsasReportsPage />} />
          <Route path="/osas/settings" element={<OsasSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
