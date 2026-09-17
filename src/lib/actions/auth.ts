import { updateDb } from '../../store/db'
import { useSessionStore, type OtpChallenge } from '../../store/session'
import type { UserAccount } from '../../types'
import { OTP_EXPIRY_SECONDS, OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../constants'
import { findUserByEmail } from '../selectors'
import { isCsuEmail, makeId, simpleHash } from '../utils'

export interface RegisterInput {
  firstName: string
  lastName: string
  studentId: string
  email: string
  college: string
  program: string
  yearLevel: string
  password: string
}

function generateOtp(): string {
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) code += Math.floor(Math.random() * 10)
  return code
}

export class AuthError extends Error {}

export function validateRegistration(input: RegisterInput) {
  if (!input.firstName.trim() || !input.lastName.trim()) throw new AuthError('First and last name are required.')
  if (!input.studentId.trim()) throw new AuthError('Student ID is required.')
  if (!isCsuEmail(input.email)) throw new AuthError('Only @csu.edu.ph institutional emails can register.')
  if (findUserByEmail(input.email)) throw new AuthError('An account with this email already exists.')
  if (!input.college || !input.program || !input.yearLevel) throw new AuthError('College, program, and year level are required.')
  if (input.password.length < 8) throw new AuthError('Password must be at least 8 characters.')
}

/** Step 1 of registration — does NOT create the account yet. The account is only created
 * once the OTP is verified (see verifyOtp). */
export function startRegistration(input: RegisterInput): OtpChallenge {
  validateRegistration(input)
  const challenge: OtpChallenge = {
    email: input.email,
    code: generateOtp(),
    expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    purpose: 'REGISTER',
    attempts: 0,
    lastSentAt: Date.now(),
  }
  ;(challenge as any).payload = input
  useSessionStore.getState().setOtpChallenge(challenge)
  // eslint-disable-next-line no-console
  console.info(`[CampusTutor DEV] OTP for ${input.email}: ${challenge.code}`)
  return challenge
}

export function startPasswordReset(email: string): OtpChallenge {
  const user = findUserByEmail(email)
  if (!user) throw new AuthError('No account found with that email.')
  const challenge: OtpChallenge = {
    email,
    code: generateOtp(),
    expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    purpose: 'RESET',
    pendingUserId: user.id,
    attempts: 0,
    lastSentAt: Date.now(),
  }
  useSessionStore.getState().setOtpChallenge(challenge)
  // eslint-disable-next-line no-console
  console.info(`[CampusTutor DEV] Password reset OTP for ${email}: ${challenge.code}`)
  return challenge
}

export function resendOtp(): OtpChallenge {
  const current = useSessionStore.getState().otpChallenge
  if (!current) throw new AuthError('No verification in progress.')
  if (Date.now() - current.lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    throw new AuthError('Please wait before requesting another code.')
  }
  const refreshed: OtpChallenge = {
    ...current,
    code: generateOtp(),
    expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    attempts: 0,
    lastSentAt: Date.now(),
  }
  useSessionStore.getState().setOtpChallenge(refreshed)
  // eslint-disable-next-line no-console
  console.info(`[CampusTutor DEV] Resent OTP for ${refreshed.email}: ${refreshed.code}`)
  return refreshed
}

/** Verifies the OTP. For REGISTER purpose this also creates the user account.
 * For RESET purpose it just unlocks the reset-password step. */
export function verifyOtp(code: string): { purpose: OtpChallenge['purpose']; user?: UserAccount } {
  const challenge = useSessionStore.getState().otpChallenge
  if (!challenge) throw new AuthError('No verification in progress.')
  if (Date.now() > challenge.expiresAt) throw new AuthError('This code has expired. Please request a new one.')
  if (challenge.attempts >= 5) throw new AuthError('Too many attempts. Please request a new code.')
  if (challenge.code !== code) {
    useSessionStore.getState().setOtpChallenge({ ...challenge, attempts: challenge.attempts + 1 })
    throw new AuthError('Invalid code. Please try again.')
  }

  if (challenge.purpose === 'REGISTER') {
    const payload = (challenge as any).payload as RegisterInput
    const newUser: UserAccount = {
      id: makeId('u'),
      firstName: payload.firstName,
      lastName: payload.lastName,
      studentId: payload.studentId,
      email: payload.email,
      college: payload.college,
      program: payload.program,
      yearLevel: payload.yearLevel,
      passwordHash: simpleHash(payload.password),
      emailVerified: true,
      roles: ['learner'],
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    updateDb((db) => {
      db.users = [...db.users, newUser]
    })
    useSessionStore.getState().setOtpChallenge(null)
    return { purpose: 'REGISTER', user: newUser }
  }

  useSessionStore.getState().setOtpChallenge({ ...challenge, attempts: 0 })
  return { purpose: challenge.purpose }
}

export function completePasswordReset(newPassword: string) {
  const challenge = useSessionStore.getState().otpChallenge
  if (!challenge || challenge.purpose !== 'RESET' || !challenge.pendingUserId) {
    throw new AuthError('Password reset session expired. Please start again.')
  }
  if (newPassword.length < 8) throw new AuthError('Password must be at least 8 characters.')
  updateDb((db) => {
    db.users = db.users.map((u) =>
      u.id === challenge.pendingUserId ? { ...u, passwordHash: simpleHash(newPassword) } : u,
    )
  })
  useSessionStore.getState().setOtpChallenge(null)
}

export function loginWithPassword(email: string, password: string): UserAccount {
  const user = findUserByEmail(email)
  if (!user) throw new AuthError('No account found with that email.')
  if (user.passwordHash !== simpleHash(password)) throw new AuthError('Incorrect password.')
  if (user.status === 'suspended') {
    throw new AuthError(`Your account has been suspended. Reason: ${user.suspensionReason ?? 'Contact OSAS/Admin.'}`)
  }
  const activeRole = user.roles.includes('learner') ? 'learner' : user.roles.includes('tutor') ? 'tutor' : null
  useSessionStore.getState().login(user.id, activeRole as any)
  return user
}

export function logout() {
  useSessionStore.getState().logout()
}
