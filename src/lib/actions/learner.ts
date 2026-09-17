import { updateDb } from '../../store/db'
import type { LearnerDocumentType, NotificationPreferences } from '../../types'
import { isTutorSaved } from '../selectors'
import { makeId } from '../utils'
import { notify } from './common'

export function toggleSaveTutor(learnerId: string, tutorId: string) {
  const alreadySaved = isTutorSaved(learnerId, tutorId)
  updateDb((db) => {
    db.savedTutors = alreadySaved
      ? db.savedTutors.filter((s) => !(s.learnerId === learnerId && s.tutorId === tutorId))
      : [...db.savedTutors, { id: makeId('saved'), learnerId, tutorId, createdAt: new Date().toISOString() }]
  })
}

export function updateNotificationPreferences(userId: string, prefs: Omit<NotificationPreferences, 'userId'>) {
  updateDb((db) => {
    const existing = db.notificationPreferences.find((p) => p.userId === userId)
    db.notificationPreferences = existing
      ? db.notificationPreferences.map((p) => (p.userId === userId ? { userId, ...prefs } : p))
      : [...db.notificationPreferences, { userId, ...prefs }]
  })
}

export function submitLearnerVerification(
  learnerId: string,
  input: {
    documentType: LearnerDocumentType
    fileName: string
    ocrExtractedName?: string
    ocrExtractedStudentId?: string
    ocrConfidence?: number
  },
) {
  updateDb((db) => {
    db.learnerVerifications = [
      ...db.learnerVerifications.filter((v) => v.learnerId !== learnerId),
      { id: makeId('lv'), learnerId, ...input, verifiedAt: new Date().toISOString() },
    ]
  })
  notify(learnerId, 'Account verified', 'Your account is now verified — you can book tutoring sessions.', 'VERIFICATION', '/learner/find-tutor')
}
