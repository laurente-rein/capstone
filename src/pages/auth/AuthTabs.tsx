import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function AuthTabs({ active }: { active: 'login' | 'register' }) {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-2 rounded-lg bg-neutral-100 p-1 text-sm font-semibold">
      <button
        onClick={() => navigate('/login')}
        className={cn('rounded-md py-2 transition-colors', active === 'login' ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500')}
      >
        Login
      </button>
      <button
        onClick={() => navigate('/register')}
        className={cn('rounded-md py-2 transition-colors', active === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500')}
      >
        Register
      </button>
    </div>
  )
}
