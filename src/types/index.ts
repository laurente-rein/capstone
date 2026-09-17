// Domain types mirroring the Supabase schema (see supabase/migrations).

export type AppRole = 'learner' | 'tutor' | 'admin' | 'osas'

export type ActiveRole = 'learner' | 'tutor'

export interface UserAccount {
  id: string
  firstName: string
  lastName: string
  studentId?: string
  email: string
  college?: string
  program?: string
  yearLevel?: string
  authProvider: 'google'
  emailVerified: boolean
  roles: AppRole[] // e.g. ['learner'] or ['learner','tutor'] or ['admin'] or ['osas']
  status: 'active' | 'suspended'
  suspensionReason?: string
  avatarUrl?: string
  createdAt: string
}

export type TutorApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'RESUBMISSION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'

export interface VerificationDocument {
  id: string
  applicationId: string
  fileName: string
  fileUrl: string
  ocrExtractedText?: string
  ocrFields?: Record<string, string>
  ocrConfidence?: number
  uploadedAt: string
}

export interface TutorApplication {
  id: string
  userId: string
  status: TutorApplicationStatus
  subjects: string[]
  motivation: string
  documents: VerificationDocument[]
  adminNotes?: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface TutorProfile {
  userId: string
  bio?: string
  averageRating: number
  ratingCount: number
  totalEarnings: number
}

export type ClassScheduleStatus = 'DRAFT' | 'CONFIRMED'

export interface ClassScheduleEntry {
  id: string
  courseCode: string
  courseName: string
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  startTime: string // HH:mm
  endTime: string // HH:mm
  room?: string
}

export interface ClassSchedule {
  id: string
  tutorId: string
  status: ClassScheduleStatus
  entries: ClassScheduleEntry[]
  sourceFileName: string
  ocrConfidence?: number
  uploadedAt: string
  confirmedAt?: string
}

export type SessionType = 'ONLINE' | 'IN_PERSON' | 'BOTH'

export interface Service {
  id: string
  tutorId: string
  title: string
  subject: string
  category: string
  level: string
  description: string
  topics: string[]
  hourlyRate: number
  sessionType: SessionType
  status: 'ACTIVE' | 'SUSPENDED' | 'DRAFT'
  createdAt: string
}

export interface AvailabilitySlot {
  id: string
  tutorId: string
  date: string // yyyy-MM-dd
  startTime: string // HH:mm
  endTime: string
  isActive: boolean
  createdAt: string
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface Booking {
  id: string
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
  meetingUrl?: string
  amount: number
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  createdAt: string
  cancelledBy?: string
  cancelReason?: string
}

export interface RescheduleRequest {
  id: string
  bookingId: string
  requestedBy: string
  newDate: string
  newStartTime: string
  newEndTime: string
  reason: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
}

export interface Payment {
  id: string
  bookingId: string
  provider: 'PayMongo'
  method: 'GCash'
  providerReferenceId: string
  grossAmount: number
  status: PaymentStatus
  createdAt: string
}

export interface PaymentAllocation {
  id: string
  paymentId: string
  tutorShare: number
  osasShare: number
  platformShare: number
  tutorSharePct: number
  osasSharePct: number
  platformSharePct: number
}

export interface Refund {
  id: string
  paymentId: string
  amount: number
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'DENIED' | 'COMPLETED'
  createdAt: string
}

export interface Rating {
  id: string
  bookingId: string
  learnerId: string
  tutorId: string
  stars: number
  comment: string
  createdAt: string
}

export interface Conversation {
  id: string
  participantIds: string[]
  contextBookingId?: string
  contextServiceId?: string
  lastMessageAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  readBy: string[]
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  type: string
  linkTo?: string
  read: boolean
  createdAt: string
}

export type IncidentType =
  | 'No Show'
  | 'Harassment'
  | 'Payment Dispute'
  | 'Inappropriate Conduct'
  | 'Academic Dishonesty'
  | 'Technical Issue'
  | 'Other'

export interface IncidentEvidence {
  id: string
  incidentId: string
  fileName: string
  fileUrl: string
  uploadedAt: string
}

export type IncidentStatus = 'SUBMITTED' | 'UNDER_ADMIN_REVIEW' | 'RESOLVED_PLATFORM' | 'REFERRED_TO_OSAS'

export interface IncidentReport {
  id: string
  bookingId?: string
  reporterId: string
  reportedUserId: string
  incidentType: IncidentType
  description: string
  evidence: IncidentEvidence[]
  status: IncidentStatus
  adminNotes?: string
  createdAt: string
}

export type CaseStatus = 'OPEN' | 'EVIDENCE_REVIEW' | 'DECIDED' | 'ARCHIVED'

export interface EvidenceValidation {
  id: string
  caseId: string
  evidenceId: string
  readability: boolean
  contextCompleteness: boolean
  relevance: boolean
  sourceVerification: boolean
  signsOfManipulation: boolean
  result: 'VALIDATED' | 'INSUFFICIENT' | 'REQUIRES_CLARIFICATION'
  notes?: string
  validatedBy: string
  validatedAt: string
}

export interface CaseAction {
  id: string
  caseId: string
  action: string
  notes: string
  actedBy: string
  createdAt: string
}

export type CaseDecisionType =
  | 'No Violation'
  | 'Case Dismissed'
  | 'Counseled'
  | 'Verbal Warning'
  | 'Written Warning'
  | 'Referred for Further Action'
  | 'Clearance Hold Recommended'

export interface CaseDecision {
  id: string
  caseId: string
  decision: CaseDecisionType
  details: string
  clearanceEffect?: string
  decidedBy: string
  decidedAt: string
}

export interface OsasCase {
  id: string
  incidentReportId: string
  bookingId?: string
  reporterId: string
  reportedUserId: string
  incidentType: IncidentType
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: CaseStatus
  assignedTo?: string
  description: string
  timeline: { id: string; label: string; at: string }[]
  notes?: string
  openedAt: string
  decision?: CaseDecision
}

export type ClearanceStatus = 'PENDING_REVIEW' | 'CLEARED' | 'ON_HOLD' | 'REQUIRES_RESOLUTION'

export interface ClearanceReview {
  id: string
  userId: string
  status: ClearanceStatus
  reason?: string
  relatedCaseIds: string[]
  updatedAt: string
}

export interface Policy {
  id: string
  title: string
  category: string
  body: string
  updatedAt: string
}

export interface AuditLogEntry {
  id: string
  actorId: string
  actorName: string
  action: string
  targetType: string
  targetId: string
  details?: string
  createdAt: string
}

export interface SystemSettings {
  ocrConfidenceThreshold: number
  automaticTutorApproval: boolean
  paymentProvider: string
  paymentMethod: string
  tutorSharePct: number
  osasSharePct: number
  platformSharePct: number
}

export interface SavedTutor {
  id: string
  learnerId: string
  tutorId: string
  createdAt: string
}

export interface NotificationPreferences {
  userId: string
  emailBookingUpdates: boolean
  emailMessages: boolean
  emailPayments: boolean
}
