import type {
  AppNotification,
  AuditLogEntry,
  AvailabilitySlot,
  Booking,
  CaseAction,
  ClassSchedule,
  ClearanceReview,
  Conversation,
  EvidenceValidation,
  IncidentReport,
  LearnerVerification,
  Message,
  NotificationPreferences,
  OsasCase,
  Payment,
  PaymentAllocation,
  Policy,
  Rating,
  Refund,
  RescheduleRequest,
  SavedTutor,
  Service,
  SystemSettings,
  TutorApplication,
  TutorProfile,
  UserAccount,
} from '../types'

export interface DbState {
  seedVersion: number
  users: UserAccount[]
  tutorApplications: TutorApplication[]
  tutorProfiles: TutorProfile[]
  classSchedules: ClassSchedule[]
  services: Service[]
  availabilitySlots: AvailabilitySlot[]
  bookings: Booking[]
  rescheduleRequests: RescheduleRequest[]
  payments: Payment[]
  paymentAllocations: PaymentAllocation[]
  refunds: Refund[]
  ratings: Rating[]
  conversations: Conversation[]
  messages: Message[]
  notifications: AppNotification[]
  incidentReports: IncidentReport[]
  evidenceValidations: EvidenceValidation[]
  caseActions: CaseAction[]
  osasCases: OsasCase[]
  clearanceReviews: ClearanceReview[]
  policies: Policy[]
  auditLogs: AuditLogEntry[]
  settings: SystemSettings
  savedTutors: SavedTutor[]
  notificationPreferences: NotificationPreferences[]
  learnerVerifications: LearnerVerification[]
}
