import { updateDb } from '../../store/db'
import { useSessionStore, type OtpChallenge } from '../../store/session'
import type { UserAccount } from '../../types'
import { OTP_EXPIRY_SECONDS, OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../constants'
import { findUserByEmail } from '../selectors'
import { isCsuEmail, makeId } from '../utils'

export class AuthError extends Error {}

function generateOtp(): string {
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) code += Math.floor(Math.random() * 10)
  return code
}

/** Step 1 of the sign-in flow: the user has just picked a Google account from the
 * simulated account chooser. We only accept CSU institutional emails, then send an
 * OTP to that address before trusting the identity — Google alone does not
 * establish CSU affiliation for a personal Gmail-style account. */
export function startGoogleSignIn(email: string, displayName: string): OtpChallenge {
  if (!isCsuEmail(email)) {
    throw new AuthError('Only @csu.edu.ph CSU institutional Google accounts can access CampusTutor.')
  }
  const user = findUserByEmail(email)
  if (user?.status === 'suspended') {
    throw new AuthError(`Your account has been suspended. Reason: ${user.suspensionReason ?? 'Contact OSAS/Admin.'}`)
  }
  const challenge: OtpChallenge = {
    email,
    displayName,
    code: generateOtp(),
    expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    purpose: 'GOOGLE_SIGNIN',
    attempts: 0,
    lastSentAt: Date.now(),
  }
  useSessionStore.getState().setOtpChallenge(challenge)
  // eslint-disable-next-line no-console
  console.info(`[CampusTutor DEV] OTP for ${email}: ${challenge.code}`)
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

export type VerifyOtpResult =
  | { status: 'LOGGED_IN'; user: UserAccount }
  | { status: 'NEEDS_PROFILE'; email: string; displayName: string }

/** Verifies the OTP. An existing account is logged straight in; a brand-new CSU
 * email needs a short profile-completion step next (see completeGoogleProfile) —
 * Google only gives us a name and a verified email, not a Student ID/college/etc. */
export function verifyOtp(code: string): VerifyOtpResult {
  const challenge = useSessionStore.getState().otpChallenge
  if (!challenge) throw new AuthError('No verification in progress.')
  if (Date.now() > challenge.expiresAt) throw new AuthError('This code has expired. Please request a new one.')
  if (challenge.attempts >= 5) throw new AuthError('Too many attempts. Please request a new code.')
  if (challenge.code !== code) {
    useSessionStore.getState().setOtpChallenge({ ...challenge, attempts: challenge.attempts + 1 })
    throw new AuthError('Invalid code. Please try again.')
  }

  const existing = findUserByEmail(challenge.email)
  if (existing) {
    useSessionStore.getState().setOtpChallenge(null)
    const activeRole = existing.roles.includes('learner') ? 'learner' : existing.roles.includes('tutor') ? 'tutor' : null
    useSessionStore.getState().login(existing.id, activeRole as any)
    return { status: 'LOGGED_IN', user: existing }
  }

  // Keep the challenge around (cleared once completeGoogleProfile runs) so a page
  // refresh mid-onboarding doesn't silently drop the verified-email guarantee.
  useSessionStore.getState().setOtpChallenge({ ...challenge, attempts: 0 })
  return { status: 'NEEDS_PROFILE', email: challenge.email, displayName: challenge.displayName }
}

export interface CompleteProfileInput {
  firstName: string
  lastName: string
  studentId: string
  college: string
  program: string
  yearLevel: string
}

/** Creates the account for a first-time CSU Google sign-in. Only reachable after
 * verifyOtp has already confirmed the email, so no further verification is needed. */
export function completeGoogleProfile(input: CompleteProfileInput): UserAccount {
  const challenge = useSessionStore.getState().otpChallenge
  if (!challenge || challenge.purpose !== 'GOOGLE_SIGNIN') {
    throw new AuthError('Your sign-in session expired. Please continue with Google again.')
  }
  if (!input.firstName.trim() || !input.lastName.trim()) throw new AuthError('First and last name are required.')
  if (!input.studentId.trim()) throw new AuthError('Student ID is required.')
  if (!input.college || !input.program || !input.yearLevel) throw new AuthError('College, program, and year level are required.')

  const newUser: UserAccount = {
    id: makeId('u'),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    studentId: input.studentId.trim(),
    email: challenge.email,
    college: input.college,
    program: input.program,
    yearLevel: input.yearLevel,
    authProvider: 'google',
    emailVerified: true,
    roles: ['learner'],
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.users = [...db.users, newUser]
  })
  useSessionStore.getState().setOtpChallenge(null)
  useSessionStore.getState().login(newUser.id, 'learner')
  return newUser
}

export function logout() {
  useSessionStore.getState().logout()
}
