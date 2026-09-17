import { Outlet, useNavigate } from 'react-router-dom'
import type { NavItem } from '../../lib/navigation'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useCurrentUser } from '../../hooks/useDb'
import { useSessionStore } from '../../store/session'

export function AppShell({
  navItems,
  role,
  searchPlaceholder,
}: {
  navItems: NavItem[]
  role: 'learner' | 'tutor' | 'admin' | 'osas'
  searchPlaceholder?: string
}) {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const setActiveRole = useSessionStore((s) => s.setActiveRole)

  const showSwitcher = (role === 'learner' || role === 'tutor') && !!user?.roles.includes('tutor')

  function handleSwitch(next: 'learner' | 'tutor') {
    setActiveRole(next)
    navigate(`/${next}/dashboard`)
  }

  const basePath = role === 'learner' ? '/learner' : role === 'tutor' ? '/tutor' : role === 'admin' ? '/admin' : '/osas'

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar
        navItems={navItems}
        roleSwitcher={showSwitcher ? { active: role as 'learner' | 'tutor', onSwitch: handleSwitch } : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          searchPlaceholder={searchPlaceholder}
          messagesPath={role === 'admin' || role === 'osas' ? `${basePath}/overview` : `${basePath}/messages`}
          notificationsPath={role === 'admin' || role === 'osas' ? `${basePath}/overview` : `${basePath}/notifications`}
          profilePath={role === 'admin' || role === 'osas' ? `${basePath}/settings` : `${basePath}/profile`}
          helpPath={role === 'admin' || role === 'osas' ? `${basePath}/settings` : `${basePath}/help`}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
