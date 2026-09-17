import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveRole } from '../types'

export interface OtpChallenge {
  email: string
  displayName: string
  code: string
  expiresAt: number
  purpose: 'GOOGLE_SIGNIN'
  attempts: number
  lastSentAt: number
}

interface SessionStore {
  userId: string | null
  activeRole: ActiveRole | null
  otpChallenge: OtpChallenge | null
  login: (userId: string, activeRole: ActiveRole | null) => void
  logout: () => void
  setActiveRole: (role: ActiveRole) => void
  setOtpChallenge: (challenge: OtpChallenge | null) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      userId: null,
      activeRole: null,
      otpChallenge: null,
      login: (userId, activeRole) => set({ userId, activeRole }),
      logout: () => set({ userId: null, activeRole: null }),
      setActiveRole: (role) => set({ activeRole: role }),
      setOtpChallenge: (challenge) => set({ otpChallenge: challenge }),
    }),
    { name: 'campustutor-session' },
  ),
)
