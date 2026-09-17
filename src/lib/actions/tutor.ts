import { getDb, updateDb } from '../../store/db'
import type { ClassSchedule, ClassScheduleEntry, Service, SessionType, TutorApplication, VerificationDocument } from '../../types'
import {
  checkTimeConflict,
  getTutorApplication,
  getUser,
  hasConfirmedClassSchedule,
} from '../selectors'
import { makeId } from '../utils'
import { addAuditLog, notify } from './common'

export class TutorActionError extends Error {}

// ---------------- Tutor Application ----------------

export interface TutorApplicationInput {
  subjects: string[]
  motivation: string
  documents: Omit<VerificationDocument, 'id' | 'applicationId' | 'uploadedAt'>[]
}

export function submitTutorApplication(userId: string, input: TutorApplicationInput): TutorApplication {
  const existing = getTutorApplication(userId)
  if (existing && ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(existing.status)) {
    throw new TutorActionError('You already have an active or approved tutor application.')
  }
  if (!input.subjects.length) throw new TutorActionError('Select at least one subject you can tutor.')
  if (!input.documents.length) throw new TutorActionError('Upload at least one verification document.')

  const appId = makeId('ta')
  const application: TutorApplication = {
    id: appId,
    userId,
    status: 'PENDING',
    subjects: input.subjects,
    motivation: input.motivation,
    documents: input.documents.map((d) => ({
      ...d,
      id: makeId('doc'),
      applicationId: appId,
      uploadedAt: new Date().toISOString(),
    })),
    submittedAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.tutorApplications = existing
      ? [...db.tutorApplications.filter((a) => a.id !== existing.id), application]
      : [...db.tutorApplications, application]
  })
  getDb()
    .users.filter((u) => u.roles.includes('admin'))
    .forEach((admin) => {
      notify(
        admin.id,
        'New tutor application',
        `${getUser(userId)?.firstName} ${getUser(userId)?.lastName} submitted a tutor application.`,
        'APPLICATION',
        '/admin/tutor-verification',
      )
    })
  return application
}

export function resubmitTutorApplication(applicationId: string, input: TutorApplicationInput) {
  updateDb((db) => {
    db.tutorApplications = db.tutorApplications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'PENDING',
            subjects: input.subjects,
            motivation: input.motivation,
            documents: input.documents.map((d) => ({
              ...d,
              id: makeId('doc'),
              applicationId,
              uploadedAt: new Date().toISOString(),
            })),
            submittedAt: new Date().toISOString(),
            adminNotes: undefined,
          }
        : a,
    )
  })
}

export function adminStartReview(applicationId: string) {
  updateDb((db) => {
    db.tutorApplications = db.tutorApplications.map((a) =>
      a.id === applicationId && a.status === 'PENDING' ? { ...a, status: 'UNDER_REVIEW' } : a,
    )
  })
}

function findApplication(id: string): TutorApplication | undefined {
  return getDb().tutorApplications.find((a) => a.id === id)
}

export function adminApproveTutor(applicationId: string, adminId: string, notes: string) {
  const app = findApplication(applicationId)
  if (!app) throw new TutorActionError('Application not found.')
  updateDb((db) => {
    db.tutorApplications = db.tutorApplications.map((a) =>
      a.id === applicationId
        ? { ...a, status: 'APPROVED', adminNotes: notes, reviewedAt: new Date().toISOString(), reviewedBy: adminId }
        : a,
    )
    db.users = db.users.map((u) =>
      u.id === app.userId && !u.roles.includes('tutor') ? { ...u, roles: [...u.roles, 'tutor'] } : u,
    )
    if (!db.tutorProfiles.find((p) => p.userId === app.userId)) {
      db.tutorProfiles = [...db.tutorProfiles, { userId: app.userId, averageRating: 0, ratingCount: 0, totalEarnings: 0 }]
    }
  })
  notify(app.userId, 'Tutor application approved', 'Congratulations! Your tutor application has been approved. Upload your class schedule to start creating services.', 'APPLICATION', '/tutor/availability')
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'TUTOR_APPROVED', 'TutorApplication', applicationId, notes)
}

export function adminRequestResubmission(applicationId: string, adminId: string, notes: string) {
  const app = findApplication(applicationId)
  if (!app) throw new TutorActionError('Application not found.')
  updateDb((db) => {
    db.tutorApplications = db.tutorApplications.map((a) =>
      a.id === applicationId
        ? { ...a, status: 'RESUBMISSION_REQUIRED', adminNotes: notes, reviewedAt: new Date().toISOString(), reviewedBy: adminId }
        : a,
    )
  })
  notify(app.userId, 'Resubmission requested', `Admin requested changes to your tutor application: ${notes}`, 'APPLICATION', '/learner/apply-tutor')
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'RESUBMISSION_REQUESTED', 'TutorApplication', applicationId, notes)
}

export function adminRejectTutor(applicationId: string, adminId: string, notes: string) {
  const app = findApplication(applicationId)
  if (!app) throw new TutorActionError('Application not found.')
  updateDb((db) => {
    db.tutorApplications = db.tutorApplications.map((a) =>
      a.id === applicationId
        ? { ...a, status: 'REJECTED', adminNotes: notes, reviewedAt: new Date().toISOString(), reviewedBy: adminId }
        : a,
    )
  })
  notify(app.userId, 'Tutor application rejected', notes || 'Your tutor application was not approved.', 'APPLICATION', '/learner/apply-tutor')
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'TUTOR_REJECTED', 'TutorApplication', applicationId, notes)
}

// ---------------- Class Schedule ----------------

export function uploadClassSchedule(
  tutorId: string,
  fileName: string,
  entries: ClassScheduleEntry[],
  ocrConfidence: number | undefined,
): ClassSchedule {
  const schedule: ClassSchedule = {
    id: makeId('cs'),
    tutorId,
    status: 'DRAFT',
    entries,
    sourceFileName: fileName,
    ocrConfidence,
    uploadedAt: new Date().toISOString(),
  }
  updateDb((db) => {
    // Remove any prior un-confirmed draft (superseded by this new upload).
    db.classSchedules = [...db.classSchedules.filter((s) => !(s.tutorId === tutorId && s.status === 'DRAFT')), schedule]
  })
  return schedule
}

export function updateDraftScheduleEntries(scheduleId: string, entries: ClassScheduleEntry[]) {
  updateDb((db) => {
    db.classSchedules = db.classSchedules.map((s) =>
      s.id === scheduleId && s.status === 'DRAFT' ? { ...s, entries } : s,
    )
  })
}

export function confirmClassSchedule(scheduleId: string, tutorId: string) {
  updateDb((db) => {
    db.classSchedules = db.classSchedules.map((s) =>
      s.id === scheduleId ? { ...s, status: 'CONFIRMED', confirmedAt: new Date().toISOString() } : s,
    )
  })
  notify(tutorId, 'Class schedule confirmed', 'Your class schedule was successfully confirmed. You can now create tutoring services.', 'SCHEDULE', '/tutor/availability')
}

export function discardDraftSchedule(scheduleId: string) {
  updateDb((db) => {
    db.classSchedules = db.classSchedules.filter((s) => s.id !== scheduleId)
  })
}

// ---------------- Services ----------------

export interface ServiceInput {
  title: string
  subject: string
  category: string
  level: string
  description: string
  topics: string[]
  hourlyRate: number
  sessionType: SessionType
}

export function createService(tutorId: string, input: ServiceInput): Service {
  const tutor = getUser(tutorId)
  if (!tutor?.roles.includes('tutor')) throw new TutorActionError('Only approved tutors can create services.')
  if (!hasConfirmedClassSchedule(tutorId)) {
    throw new TutorActionError('CLASS_SCHEDULE_REQUIRED')
  }
  if (!input.title.trim() || !input.subject.trim() || input.hourlyRate <= 0) {
    throw new TutorActionError('Please complete all required service fields.')
  }
  const service: Service = {
    id: makeId('svc'),
    tutorId,
    ...input,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.services = [...db.services, service]
  })
  return service
}

export function updateService(serviceId: string, input: Partial<ServiceInput>) {
  updateDb((db) => {
    db.services = db.services.map((s) => (s.id === serviceId ? { ...s, ...input } : s))
  })
}

export function tutorSuspendOwnService(serviceId: string) {
  updateDb((db) => {
    db.services = db.services.map((s) => (s.id === serviceId ? { ...s, status: 'SUSPENDED' } : s))
  })
}

export function tutorReactivateOwnService(serviceId: string) {
  updateDb((db) => {
    db.services = db.services.map((s) => (s.id === serviceId ? { ...s, status: 'ACTIVE' } : s))
  })
}

export function adminSuspendService(serviceId: string, adminId: string, reason: string) {
  updateDb((db) => {
    db.services = db.services.map((s) => (s.id === serviceId ? { ...s, status: 'SUSPENDED' } : s))
  })
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'SERVICE_SUSPENDED', 'Service', serviceId, reason)
}

export function adminRequestServiceChanges(serviceId: string, tutorId: string, adminId: string, notes: string) {
  notify(tutorId, 'Service change requested', notes, 'SERVICE', '/tutor/services')
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'SERVICE_CHANGE_REQUESTED', 'Service', serviceId, notes)
}

// ---------------- Availability ----------------

export function createAvailability(tutorId: string, date: string, startTime: string, endTime: string) {
  if (startTime >= endTime) throw new TutorActionError('End time must be after start time.')
  const conflict = checkTimeConflict(tutorId, date, startTime, endTime)
  if (conflict.conflict) {
    throw new TutorActionError(conflict.reason ?? 'This availability conflicts with an existing commitment.')
  }
  updateDb((db) => {
    db.availabilitySlots = [
      ...db.availabilitySlots,
      { id: makeId('avail'), tutorId, date, startTime, endTime, isActive: true, createdAt: new Date().toISOString() },
    ]
  })
}

export function deleteAvailability(slotId: string) {
  updateDb((db) => {
    db.availabilitySlots = db.availabilitySlots.filter((s) => s.id !== slotId)
  })
}
