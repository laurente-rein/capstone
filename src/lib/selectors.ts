import { getDb } from '../store/db'
import type {
  AppRole,
  Booking,
  ClassSchedule,
  OsasCase,
  Service,
  UserAccount,
} from '../types'
import { dayOfWeekCode, timeRangesOverlap } from './utils'

export function getUser(id: string | null | undefined): UserAccount | undefined {
  if (!id) return undefined
  return getDb().users.find((u) => u.id === id)
}

export function fullName(u?: UserAccount): string {
  if (!u) return 'Unknown User'
  return `${u.firstName} ${u.lastName}`
}

export function hasRole(u: UserAccount | undefined, role: AppRole): boolean {
  return !!u?.roles.includes(role)
}

export function findUserByEmail(email: string): UserAccount | undefined {
  return getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

export function getTutorApplication(userId: string) {
  const apps = getDb().tutorApplications.filter((a) => a.userId === userId)
  return apps.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
}

export function getTutorProfile(tutorId: string) {
  return getDb().tutorProfiles.find((p) => p.userId === tutorId)
}

/** The single schedule tutors interact with "live": the latest CONFIRMED one,
 * or if none confirmed yet, the latest DRAFT awaiting review. */
export function getActiveClassSchedule(tutorId: string): ClassSchedule | undefined {
  const schedules = getDb().classSchedules.filter((s) => s.tutorId === tutorId)
  const confirmed = schedules.filter((s) => s.status === 'CONFIRMED')
  if (confirmed.length) {
    return confirmed.sort((a, b) => (b.confirmedAt ?? '').localeCompare(a.confirmedAt ?? ''))[0]
  }
  return undefined
}

export function getDraftClassSchedule(tutorId: string): ClassSchedule | undefined {
  const schedules = getDb().classSchedules.filter((s) => s.tutorId === tutorId && s.status === 'DRAFT')
  return schedules.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]
}

export function hasConfirmedClassSchedule(tutorId: string): boolean {
  return !!getActiveClassSchedule(tutorId)
}

export function getServicesForTutor(tutorId: string): Service[] {
  return getDb().services.filter((s) => s.tutorId === tutorId)
}

export function getActiveServices(): Service[] {
  return getDb().services.filter((s) => s.status === 'ACTIVE')
}

export interface TutorDiscoveryFilters {
  query?: string
  subject?: string
  level?: string
  sessionType?: string
  sort?: 'rating' | 'price_low' | 'price_high'
}

export function searchTutorServices(filters: TutorDiscoveryFilters) {
  let results = getActiveServices().filter((svc) => {
    const tutor = getUser(svc.tutorId)
    if (!tutor || tutor.status !== 'active') return false
    return true
  })
  if (filters.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.topics.some((t) => t.toLowerCase().includes(q)) ||
        fullName(getUser(s.tutorId)).toLowerCase().includes(q),
    )
  }
  if (filters.subject) results = results.filter((s) => s.category === filters.subject)
  if (filters.level) results = results.filter((s) => s.level === filters.level)
  if (filters.sessionType)
    results = results.filter((s) => s.sessionType === filters.sessionType || s.sessionType === 'BOTH')

  const withRating = results.map((s) => ({ service: s, rating: getTutorProfile(s.tutorId)?.averageRating ?? 0 }))
  if (filters.sort === 'rating') withRating.sort((a, b) => b.rating - a.rating)
  else if (filters.sort === 'price_low') withRating.sort((a, b) => a.service.hourlyRate - b.service.hourlyRate)
  else if (filters.sort === 'price_high') withRating.sort((a, b) => b.service.hourlyRate - a.service.hourlyRate)
  return withRating.map((w) => w.service)
}

/** Every booking for a tutor that currently occupies calendar time (blocks new bookings/availability). */
export function getOccupyingBookings(tutorId: string): Booking[] {
  return getDb().bookings.filter(
    (b) => b.tutorId === tutorId && (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING' || b.bookingStatus === 'COMPLETED'),
  )
}

export interface ConflictResult {
  conflict: boolean
  reason?: string
}

/** Core overlap engine used by both availability creation and booking creation.
 * requested_start < existing_end AND requested_end > existing_start */
export function checkTimeConflict(
  tutorId: string,
  date: string,
  startTime: string,
  endTime: string,
  opts: { excludeAvailabilityId?: string; excludeBookingId?: string } = {},
): ConflictResult {
  const schedule = getActiveClassSchedule(tutorId)
  const dow = dayOfWeekCode(date)
  if (schedule) {
    for (const entry of schedule.entries) {
      if (entry.day === dow && timeRangesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
        return {
          conflict: true,
          reason: `This overlaps your confirmed ${entry.courseCode} class from ${entry.startTime} to ${entry.endTime}.`,
        }
      }
    }
  }
  const bookings = getOccupyingBookings(tutorId).filter((b) => b.id !== opts.excludeBookingId)
  for (const b of bookings) {
    if (b.date === date && timeRangesOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return {
        conflict: true,
        reason: `This overlaps an existing ${b.bookingStatus.toLowerCase()} tutoring session from ${b.startTime} to ${b.endTime}.`,
      }
    }
  }
  const slots = getDb().availabilitySlots.filter(
    (s) => s.tutorId === tutorId && s.isActive && s.id !== opts.excludeAvailabilityId,
  )
  for (const s of slots) {
    if (s.date === date && timeRangesOverlap(startTime, endTime, s.startTime, s.endTime)) {
      return { conflict: true, reason: `This overlaps an existing availability block from ${s.startTime} to ${s.endTime}.` }
    }
  }
  return { conflict: false }
}

/** Bookable slot = active availability minus any part already occupied by a confirmed/pending booking. */
export function getBookableAvailability(tutorId: string) {
  const slots = getDb().availabilitySlots.filter((s) => s.tutorId === tutorId && s.isActive)
  const bookings = getOccupyingBookings(tutorId)
  return slots.filter((slot) => {
    const overlapped = bookings.some(
      (b) => b.date === slot.date && timeRangesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime),
    )
    return !overlapped
  })
}

export function getBookingsForLearner(learnerId: string): Booking[] {
  return getDb().bookings.filter((b) => b.learnerId === learnerId).sort((a, b) => b.date.localeCompare(a.date))
}

export function getBookingsForTutor(tutorId: string): Booking[] {
  return getDb().bookings.filter((b) => b.tutorId === tutorId).sort((a, b) => b.date.localeCompare(a.date))
}

export function getBooking(id: string) {
  return getDb().bookings.find((b) => b.id === id)
}

export function getPaymentForBooking(bookingId: string) {
  return getDb().payments.find((p) => p.bookingId === bookingId)
}

export function getAllocationForPayment(paymentId: string) {
  return getDb().paymentAllocations.find((a) => a.paymentId === paymentId)
}

export function getRatingForBooking(bookingId: string) {
  return getDb().ratings.find((r) => r.bookingId === bookingId)
}

export function getRatingsForTutor(tutorId: string) {
  return getDb().ratings.filter((r) => r.tutorId === tutorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function computeTutorEarnings(tutorId: string) {
  const bookings = getDb().bookings.filter((b) => b.tutorId === tutorId && b.paymentStatus === 'PAID')
  let gross = 0
  let tutorShare = 0
  let osasShare = 0
  let platformShare = 0
  const rows = bookings.map((b) => {
    const payment = getPaymentForBooking(b.id)
    const alloc = payment ? getAllocationForPayment(payment.id) : undefined
    gross += b.amount
    tutorShare += alloc?.tutorShare ?? 0
    osasShare += alloc?.osasShare ?? 0
    platformShare += alloc?.platformShare ?? 0
    return { booking: b, payment, alloc }
  })
  return { gross, tutorShare, osasShare, platformShare, completedPaidCount: bookings.length, rows }
}

export function getConversationsForUser(userId: string) {
  return getDb()
    .conversations.filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
}

export function getConversation(id: string) {
  return getDb().conversations.find((c) => c.id === id)
}

export function getMessages(conversationId: string) {
  return getDb()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getOtherParticipant(conversationId: string, userId: string) {
  const conv = getConversation(conversationId)
  const otherId = conv?.participantIds.find((id) => id !== userId)
  return getUser(otherId)
}

export function getNotifications(userId: string) {
  return getDb()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getUnreadCount(userId: string) {
  return getNotifications(userId).filter((n) => !n.read).length
}

export function getUnreadMessageCount(userId: string) {
  return getConversationsForUser(userId).filter((c) => {
    const msgs = getMessages(c.id)
    const last = msgs[msgs.length - 1]
    return last && last.senderId !== userId && !last.readBy.includes(userId)
  }).length
}

export function getIncidents() {
  return getDb().incidentReports.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getIncident(id: string) {
  return getDb().incidentReports.find((i) => i.id === id)
}

export function getOsasCases(): OsasCase[] {
  return getDb().osasCases.slice().sort((a, b) => b.openedAt.localeCompare(a.openedAt))
}

export function getOsasCase(id: string) {
  return getDb().osasCases.find((c) => c.id === id)
}

export function getEvidenceValidations(caseId: string) {
  return getDb().evidenceValidations.filter((v) => v.caseId === caseId)
}

export function getCaseActions(caseId: string) {
  return getDb()
    .caseActions.filter((a) => a.caseId === caseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getClearance(userId: string) {
  return getDb().clearanceReviews.find((c) => c.userId === userId)
}

export function getAllClearanceReviews() {
  return getDb().clearanceReviews.slice()
}

export function getAuditLogs() {
  return getDb().auditLogs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getSettings() {
  return getDb().settings
}

export function getAllTutorApplications() {
  return getDb()
    .tutorApplications.slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function getAllUsers() {
  return getDb().users.slice()
}

export function getAllServices() {
  return getDb().services.slice()
}

export function getAllBookings() {
  return getDb().bookings.slice().sort((a, b) => b.date.localeCompare(a.date))
}

export function getAllPaymentsWithAllocation() {
  return getDb().payments.map((p) => ({
    payment: p,
    allocation: getAllocationForPayment(p.id),
    booking: getBooking(p.bookingId),
  }))
}
