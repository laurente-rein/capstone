import { NavLink } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import type { NavItem } from '../../lib/navigation'
import { cn } from '../../lib/utils'
import { logout } from '../../lib/actions'
import { useNavigate } from 'react-router-dom'

export function Sidebar({
  navItems,
  roleSwitcher,
}: {
  navItems: NavItem[]
  roleSwitcher?: { active: 'learner' | 'tutor'; onSwitch: (role: 'learner' | 'tutor') => void }
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
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
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

      <div className="relative mt-1 overflow-hidden border-t border-white/10 bg-gradient-to-br from-brand-800 to-brand-950 px-5 py-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <p className="relative text-sm font-semibold text-gold-300">Caraga State University</p>
        <p className="relative text-[11px] text-white/60">Excellence. Service. Commitment.</p>
      </div>
    </aside>
  )
}
