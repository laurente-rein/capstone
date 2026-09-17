import type { ReactNode } from 'react'
import { GraduationCap, ShieldCheck, Trophy, Users } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Learn Together', desc: 'Connect with fellow CSU students and share knowledge.' },
  { icon: GraduationCap, title: 'Excel Together', desc: 'Ace your subjects with personalized peer support.' },
  { icon: Trophy, title: 'Grow Together', desc: 'Build confidence and achieve your academic goals.' },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-950 px-10 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div>
          <div className="mb-10 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold-500">
              <GraduationCap className="size-6 text-brand-950" />
            </div>
            <span className="text-xl font-bold">
              Campus<span className="text-gold-400">Tutor</span>
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Welcome to
            <br />
            Campus<span className="text-gold-400">Tutor</span>
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Your peer-to-peer tutoring platform for Caraga State University students.
          </p>

          <div className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <f.icon className="size-5 text-gold-300" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-brand-800/80 to-brand-950 p-5">
          <ShieldCheck className="mb-2 size-5 text-gold-400" />
          <p className="font-semibold text-gold-300">Caraga State University</p>
          <p className="text-xs text-white/50">Excellence. Service. Commitment.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
