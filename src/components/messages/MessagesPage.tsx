import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { EmptyState } from '../ui/EmptyState'
import { MessageSquare } from 'lucide-react'
import { useDb } from '../../hooks/useDb'
import { fullName, getConversationsForUser, getMessages, getOtherParticipant } from '../../lib/selectors'
import { markConversationRead, sendMessage } from '../../lib/actions'
import { formatDateTime, timeAgo } from '../../lib/utils'

export function MessagesPage({ userId }: { userId: string }) {
  const conversations = useDb(() => getConversationsForUser(userId))
  const [params, setParams] = useSearchParams()
  const activeId = params.get('conversation') || conversations[0]?.id || null
  const messages = useDb(() => (activeId ? getMessages(activeId) : []))
  const otherUser = useDb(() => (activeId ? getOtherParticipant(activeId, userId) : undefined))
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeId) markConversationRead(activeId, userId)
  }, [activeId, userId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    if (!activeId || !draft.trim()) return
    sendMessage(activeId, userId, draft)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
        <p className="text-sm text-neutral-500">Chat with your tutors and learners.</p>
      </div>

      <Card className="grid h-[calc(100vh-13rem)] grid-cols-1 overflow-hidden sm:grid-cols-3">
        <div className="border-r border-neutral-100 sm:col-span-1">
          <div className="border-b border-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Conversations
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
            {conversations.length === 0 ? (
              <EmptyState icon={<MessageSquare className="size-6" />} title="No conversations" description="Messages from your sessions will appear here." />
            ) : (
              conversations.map((c) => {
                const other = getOtherParticipant(c.id, userId)
                const msgs = getMessages(c.id)
                const last = msgs[msgs.length - 1]
                const unread = last && last.senderId !== userId && !last.readBy.includes(userId)
                if (!other) return null
                return (
                  <button
                    key={c.id}
                    onClick={() => setParams({ conversation: c.id })}
                    className={`flex w-full items-start gap-2.5 border-b border-neutral-50 px-4 py-3 text-left hover:bg-neutral-50 ${
                      activeId === c.id ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <Avatar firstName={other.firstName} lastName={other.lastName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-sm ${unread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>{fullName(other)}</p>
                        {last && <span className="shrink-0 text-[10px] text-neutral-400">{timeAgo(last.createdAt)}</span>}
                      </div>
                      <p className="truncate text-xs text-neutral-500">{last?.body ?? 'No messages yet'}</p>
                    </div>
                    {unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-600" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col sm:col-span-2">
          {otherUser ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-3">
                <Avatar firstName={otherUser.firstName} lastName={otherUser.lastName} size="sm" />
                <p className="text-sm font-semibold text-neutral-800">{fullName(otherUser)}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.senderId === userId ? 'bg-brand-700 text-white' : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      <p>{m.body}</p>
                      <p className={`mt-0.5 text-[10px] ${m.senderId === userId ? 'text-white/60' : 'text-neutral-400'}`}>{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-neutral-100 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                />
                <button onClick={handleSend} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800">
                  <Send className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <EmptyState icon={<MessageSquare className="size-6" />} title="Select a conversation" />
          )}
        </div>
      </Card>
    </div>
  )
}
