import { getDb, updateDb } from '../../store/db'
import { makeId } from '../utils'
import { notify } from './common'
import { fullName, getUser } from '../selectors'

export function getOrCreateConversation(userA: string, userB: string, contextBookingId?: string): string {
  const existing = getDb().conversations.find(
    (c) => c.participantIds.includes(userA) && c.participantIds.includes(userB),
  )
  if (existing) return existing.id
  const id = makeId('conv')
  updateDb((db) => {
    db.conversations = [
      ...db.conversations,
      { id, participantIds: [userA, userB], contextBookingId, lastMessageAt: new Date().toISOString() },
    ]
  })
  return id
}

export function sendMessage(conversationId: string, senderId: string, body: string) {
  if (!body.trim()) return
  const conv = getDb().conversations.find((c) => c.id === conversationId)
  updateDb((db) => {
    db.messages = [
      ...db.messages,
      { id: makeId('msg'), conversationId, senderId, body: body.trim(), createdAt: new Date().toISOString(), readBy: [senderId] },
    ]
    db.conversations = db.conversations.map((c) =>
      c.id === conversationId ? { ...c, lastMessageAt: new Date().toISOString() } : c,
    )
  })
  const recipientId = conv?.participantIds.find((id) => id !== senderId)
  if (recipientId) {
    notify(recipientId, 'New message', `${fullName(getUser(senderId))}: ${body.trim().slice(0, 60)}`, 'MESSAGE', '/messages')
  }
}

export function markConversationRead(conversationId: string, userId: string) {
  updateDb((db) => {
    db.messages = db.messages.map((m) =>
      m.conversationId === conversationId && !m.readBy.includes(userId) ? { ...m, readBy: [...m.readBy, userId] } : m,
    )
  })
}
