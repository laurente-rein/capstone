import { updateDb } from '../../store/db'
import type { AppNotification } from '../../types'
import { makeId } from '../utils'

export function notify(userId: string, title: string, body: string, type: string, linkTo?: string) {
  const n: AppNotification = {
    id: makeId('ntf'),
    userId,
    title,
    body,
    type,
    linkTo,
    read: false,
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.notifications = [n, ...db.notifications]
  })
}

export function addAuditLog(
  actorId: string,
  actorName: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string,
) {
  updateDb((db) => {
    db.auditLogs = [
      {
        id: makeId('log'),
        actorId,
        actorName,
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString(),
      },
      ...db.auditLogs,
    ]
  })
}

export function markNotificationRead(id: string) {
  updateDb((db) => {
    db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  })
}

export function markAllNotificationsRead(userId: string) {
  updateDb((db) => {
    db.notifications = db.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n))
  })
}
