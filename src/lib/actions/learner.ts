import { updateDb } from '../../store/db'
import type { NotificationPreferences } from '../../types'
import { isTutorSaved } from '../selectors'
import { makeId } from '../utils'

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
