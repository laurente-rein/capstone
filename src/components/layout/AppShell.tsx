import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { NavItem } from '../../lib/navigation'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { useSessionStore } from '../../store/session'
import { getUnreadMessageCount } from '../../lib/selectors'

export function AppShell({
  navItems,
  accountItems,
  portalLabel,
  role,
  searchPlaceholder,
}: {
  navItems: NavItem[]
  accountItems?: NavItem[]
  portalLabel?: string
  role: 'learner' | 'tutor' | 'admin' | 'osas'
  searchPlaceholder?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userId } = useCurrentUser()
  const setActiveRole = useSessionStore((s) => s.setActiveRole)

  // Every learner account can click into "Tutor" — where that lands depends on
  // where they are in the apply-as-tutor pipeline (see ApplyAsTutorPage).
  const showSwitcher = role === 'learner' || role === 'tutor'
  const isApprovedTutor = !!user?.roles.includes('tutor')
  const onApplyPage = location.pathname === '/learner/apply-tutor'
  const switcherActive: 'learner' | 'tutor' = role === 'tutor' || onApplyPage ? 'tutor' : 'learner'

  function handleSwitch(next: 'learner' | 'tutor') {
    if (next === 'tutor' && !isApprovedTutor) {
      navigate('/learner/apply-tutor')
      return
    }
    setActiveRole(next)
    navigate(`/${next}/dashboard`)
  }

  const basePath = role === 'learner' ? '/learner' : role === 'tutor' ? '/tutor' : role === 'admin' ? '/admin' : '/osas'
  const messagesPath = role === 'admin' || role === 'osas' ? `${basePath}/overview` : `${basePath}/messages`
  const unreadMsgs = useDb(() => (userId ? getUnreadMessageCount(userId) : 0))

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar
        navItems={navItems}
        accountItems={accountItems}
        portalLabel={portalLabel}
        roleSwitcher={showSwitcher ? { active: switcherActive, onSwitch: handleSwitch } : undefined}
        badges={role === 'learner' || role === 'tutor' ? { [messagesPath]: unreadMsgs } : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          searchPlaceholder={searchPlaceholder}
          messagesPath={messagesPath}
          notificationsPath={role === 'admin' || role === 'osas' ? `${basePath}/overview` : `${basePath}/notifications`}
          profilePath={role === 'admin' || role === 'osas' ? `${basePath}/settings` : `${basePath}/profile`}
          settingsPath={role === 'learner' ? '/learner/settings' : undefined}
          helpPath={role === 'admin' || role === 'osas' ? `${basePath}/settings` : `${basePath}/help`}
          helpLabel={role === 'learner' ? 'Help & Support' : 'Help & Safety'}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
