import { getDb, updateDb } from '../../store/db'
import type { Booking, Payment, PaymentAllocation } from '../../types'
import { PAYMENT_ALLOCATION, PAYMENT_METHOD, PAYMENT_PROVIDER } from '../constants'
import { checkTimeConflict, fullName, getBooking, getPaymentForBooking, getRatingForBooking, getUser } from '../selectors'
import { makeId, todayStr } from '../utils'
import { addAuditLog, notify } from './common'

export class BookingError extends Error {}

export interface CreateBookingInput {
  learnerId: string
  tutorId: string
  serviceId: string
  specificTopic: string
  date: string
  startTime: string
  endTime: string
  sessionType: 'ONLINE' | 'IN_PERSON'
  location?: string
  meetingPlatform?: string
  amount: number
}

export function createBooking(input: CreateBookingInput): Booking {
  const conflict = checkTimeConflict(input.tutorId, input.date, input.startTime, input.endTime)
  if (conflict.conflict) {
    throw new BookingError(conflict.reason ?? 'This slot is no longer available.')
  }
  const booking: Booking = {
    id: `CTB-${new Date().getFullYear()}-${makeId('').replace(/\D/g, '').slice(-4)}`,
    learnerId: input.learnerId,
    tutorId: input.tutorId,
    serviceId: input.serviceId,
    specificTopic: input.specificTopic,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    sessionType: input.sessionType,
    location: input.location,
    meetingPlatform: input.meetingPlatform,
    amount: input.amount,
    bookingStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.bookings = [...db.bookings, booking]
  })
  return booking
}

export interface PayMongoResult {
  success: boolean
  referenceId: string
  message: string
}

/** Simulates a PayMongo GCash checkout in dev/test mode. Structured so a real
 * implementation (POST to a Supabase Edge Function that calls the PayMongo API)
 * can be swapped in behind this same function signature. */
export async function simulatePayMongoCheckout(_amount: number, simulateFailure = false): Promise<PayMongoResult> {
  await new Promise((r) => setTimeout(r, 1400))
  if (simulateFailure) {
    return { success: false, referenceId: '', message: 'GCash payment declined. Please try again.' }
  }
  return { success: true, referenceId: `pm_${makeId('ref')}`, message: 'Payment successful.' }
}

export function confirmBookingPayment(bookingId: string, referenceId: string) {
  const booking = getBooking(bookingId)
  if (!booking) throw new BookingError('Booking not found.')
  // Re-check for race conditions right before confirming.
  const conflict = checkTimeConflict(booking.tutorId, booking.date, booking.startTime, booking.endTime, {
    excludeBookingId: booking.id,
  })
  if (conflict.conflict) {
    throw new BookingError('This slot was just booked by someone else. Please choose another time.')
  }

  const payment: Payment = {
    id: makeId('pay'),
    bookingId,
    provider: PAYMENT_PROVIDER as 'PayMongo',
    method: PAYMENT_METHOD as 'GCash',
    providerReferenceId: referenceId,
    grossAmount: booking.amount,
    status: 'PAID',
    createdAt: new Date().toISOString(),
  }
  const allocation: PaymentAllocation = {
    id: makeId('alloc'),
    paymentId: payment.id,
    tutorShare: Math.round(booking.amount * PAYMENT_ALLOCATION.TUTOR_SHARE),
    osasShare: Math.round(booking.amount * PAYMENT_ALLOCATION.OSAS_SHARE),
    platformShare: Math.round(booking.amount * PAYMENT_ALLOCATION.PLATFORM_SHARE),
    tutorSharePct: PAYMENT_ALLOCATION.TUTOR_SHARE,
    osasSharePct: PAYMENT_ALLOCATION.OSAS_SHARE,
    platformSharePct: PAYMENT_ALLOCATION.PLATFORM_SHARE,
  }
  updateDb((db) => {
    db.payments = [...db.payments, payment]
    db.paymentAllocations = [...db.paymentAllocations, allocation]
    db.bookings = db.bookings.map((b) =>
      b.id === bookingId ? { ...b, paymentStatus: 'PAID', bookingStatus: 'CONFIRMED' } : b,
    )
  })
  notify(booking.learnerId, 'Booking confirmed', `Your session with ${fullName(getUser(booking.tutorId))} is confirmed.`, 'BOOKING', '/learner/sessions')
  notify(booking.tutorId, 'Payment received', `Payment received for ${fullName(getUser(booking.learnerId))} — ₱${booking.amount}.`, 'PAYMENT', '/tutor/sessions')
}

export function markBookingPaymentFailed(bookingId: string) {
  updateDb((db) => {
    db.bookings = db.bookings.map((b) => (b.id === bookingId ? { ...b, paymentStatus: 'FAILED' } : b))
  })
}

export function cancelBooking(bookingId: string, byUserId: string, reason: string) {
  const booking = getBooking(bookingId)
  if (!booking) throw new BookingError('Booking not found.')
  if (!['PENDING', 'CONFIRMED'].includes(booking.bookingStatus)) {
    throw new BookingError('This session can no longer be cancelled.')
  }
  updateDb((db) => {
    db.bookings = db.bookings.map((b) =>
      b.id === bookingId ? { ...b, bookingStatus: 'CANCELLED', cancelledBy: byUserId, cancelReason: reason } : b,
    )
  })
  const otherId = byUserId === booking.learnerId ? booking.tutorId : booking.learnerId
  notify(otherId, 'Session cancelled', `A session on ${booking.date} was cancelled: ${reason}`, 'BOOKING', '/learner/sessions')
}

export function requestReschedule(bookingId: string, requestedBy: string, newDate: string, newStartTime: string, newEndTime: string, reason: string) {
  const booking = getBooking(bookingId)
  if (!booking) throw new BookingError('Booking not found.')
  const request = {
    id: makeId('resched'),
    bookingId,
    requestedBy,
    newDate,
    newStartTime,
    newEndTime,
    reason,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.rescheduleRequests = [...db.rescheduleRequests, request]
  })
  const otherId = requestedBy === booking.learnerId ? booking.tutorId : booking.learnerId
  notify(otherId, 'Reschedule requested', `A reschedule was requested for booking ${bookingId}.`, 'RESCHEDULE', '/learner/sessions')
}

export function respondToReschedule(requestId: string, accept: boolean) {
  const request = getDb().rescheduleRequests.find((r) => r.id === requestId)
  if (!request) throw new BookingError('Reschedule request not found.')
  const booking = getBooking(request.bookingId)
  if (!booking) throw new BookingError('Booking not found.')
  if (accept) {
    const conflict = checkTimeConflict(booking.tutorId, request.newDate, request.newStartTime, request.newEndTime, {
      excludeBookingId: booking.id,
    })
    if (conflict.conflict) throw new BookingError(conflict.reason ?? 'New time conflicts with another commitment.')
    updateDb((db) => {
      db.bookings = db.bookings.map((b) =>
        b.id === booking.id ? { ...b, date: request.newDate, startTime: request.newStartTime, endTime: request.newEndTime } : b,
      )
      db.rescheduleRequests = db.rescheduleRequests.map((r) => (r.id === requestId ? { ...r, status: 'ACCEPTED' } : r))
    })
  } else {
    updateDb((db) => {
      db.rescheduleRequests = db.rescheduleRequests.map((r) => (r.id === requestId ? { ...r, status: 'DECLINED' } : r))
    })
  }
}

/** Marks any confirmed session whose end time has passed as COMPLETED. Runs on app load
 * so demo data stays consistent with "today". */
export function reconcileSessionStatuses() {
  const today = todayStr()
  const now = new Date()
  updateDb((db) => {
    db.bookings = db.bookings.map((b) => {
      if (b.bookingStatus !== 'CONFIRMED') return b
      const end = new Date(`${b.date}T${b.endTime}:00`)
      if (b.date < today || (b.date === today && end < now)) {
        return { ...b, bookingStatus: 'COMPLETED' }
      }
      return b
    })
  })
}

export function submitRating(bookingId: string, learnerId: string, stars: number, comment: string) {
  const booking = getBooking(bookingId)
  if (!booking) throw new BookingError('Booking not found.')
  if (booking.learnerId !== learnerId) throw new BookingError('Not authorized to rate this session.')
  if (booking.bookingStatus !== 'COMPLETED') throw new BookingError('You can only rate completed sessions.')
  if (getRatingForBooking(bookingId)) throw new BookingError('You already rated this session.')
  updateDb((db) => {
    db.ratings = [
      ...db.ratings,
      { id: makeId('rate'), bookingId, learnerId, tutorId: booking.tutorId, stars, comment, createdAt: new Date().toISOString() },
    ]
    const tutorRatings = db.ratings.filter((r) => r.tutorId === booking.tutorId)
    const avg = tutorRatings.reduce((s, r) => s + r.stars, 0) / tutorRatings.length
    db.tutorProfiles = db.tutorProfiles.map((p) =>
      p.userId === booking.tutorId ? { ...p, averageRating: Math.round(avg * 10) / 10, ratingCount: tutorRatings.length } : p,
    )
  })
  notify(booking.tutorId, 'New rating received', `${fullName(getUser(learnerId))} rated your session ${stars}/5.`, 'RATING', '/tutor/earnings')
}

export function adminSuspendUser(userId: string, adminId: string, reason: string) {
  if (!reason.trim()) throw new BookingError('A suspension reason is required.')
  updateDb((db) => {
    db.users = db.users.map((u) => (u.id === userId ? { ...u, status: 'suspended', suspensionReason: reason } : u))
  })
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'USER_SUSPENDED', 'User', userId, reason)
}

export function adminReactivateUser(userId: string, adminId: string) {
  updateDb((db) => {
    db.users = db.users.map((u) => (u.id === userId ? { ...u, status: 'active', suspensionReason: undefined } : u))
  })
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'USER_REACTIVATED', 'User', userId)
}

export function getPaymentInfo(bookingId: string) {
  return getPaymentForBooking(bookingId)
}
