import { NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import type { NavItem } from '../../lib/navigation'
import { cn } from '../../lib/utils'
import { logout } from '../../lib/actions'

function NavRow({ item, badgeCount }: { item: NavItem; badgeCount?: number }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white',
        )
      }
    >
      <item.icon className="size-4.5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!!badgeCount && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger-600 text-[11px] font-bold text-white">
          {badgeCount}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar({
  navItems,
  accountItems,
  portalLabel,
  roleSwitcher,
  badges,
}: {
  navItems: NavItem[]
  accountItems?: NavItem[]
  portalLabel?: string
  roleSwitcher?: { active: 'learner' | 'tutor'; onSwitch: (role: 'learner' | 'tutor') => void }
  /** Path -> live badge count, e.g. unread messages, computed by the caller. */
  badges?: Record<string, number>
}) {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-brand-900 to-brand-950 text-white">
      <div className="flex items-center gap-2 px-5 pt-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-gold-500">
          <GraduationCap className="size-5 text-brand-950" />
        </div>
        <span className="text-lg font-bold">
          Campus<span className="text-gold-400">Tutor</span>
        </span>
      </div>

      {portalLabel && <p className="mt-3 px-5 text-[11px] font-bold uppercase tracking-widest text-gold-400">{portalLabel}</p>}

      {roleSwitcher && (
        <div className="mx-5 mt-5 flex rounded-lg bg-white/10 p-1 text-sm font-semibold">
          <button
            onClick={() => roleSwitcher.onSwitch('learner')}
            className={cn(
              'flex-1 rounded-md py-1.5 transition-colors',
              roleSwitcher.active === 'learner' ? 'bg-white text-brand-900' : 'text-white/70 hover:text-white',
            )}
          >
            Learner
          </button>
          <button
            onClick={() => roleSwitcher.onSwitch('tutor')}
            className={cn(
              'flex-1 rounded-md py-1.5 transition-colors',
              roleSwitcher.active === 'tutor' ? 'bg-gold-500 text-brand-950' : 'text-white/70 hover:text-white',
            )}
          >
            Tutor
          </button>
        </div>
      )}

      <nav className="sidebar-scroll mt-5 flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => (
          <NavRow key={item.path} item={item} badgeCount={badges?.[item.path]} />
        ))}

        {accountItems && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-widest text-white/40">Account</p>
            {accountItems.map((item) => (
              <NavRow key={item.path} item={item} badgeCount={badges?.[item.path]} />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4.5 shrink-0" />
          Logout
        </button>
      </div>

      <div className="relative mt-1 h-28 shrink-0 overflow-hidden border-t-2 border-gold-500">
        <img src="/campus.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-950/10" />
        <div className="absolute inset-x-0 bottom-0 px-5 py-3">
          <p className="text-sm font-semibold text-gold-300">Caraga State University</p>
          <p className="text-[11px] text-white/70">Excellence. Service. Commitment.</p>
        </div>
      </div>
    </aside>
  )
}
