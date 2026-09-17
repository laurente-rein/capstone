import { Bell, ChevronDown, HelpCircle, LogOut, MessageSquare, Search, Settings, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { useCurrentUser, useDb } from '../../hooks/useDb'
import { getNotifications, getUnreadCount, getUnreadMessageCount } from '../../lib/selectors'
import { markAllNotificationsRead, markNotificationRead, logout } from '../../lib/actions'
import { timeAgo } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'

export function Navbar({
  searchPlaceholder = 'Search…',
  onSearch,
  messagesPath,
  notificationsPath,
  profilePath,
  helpPath,
}: {
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  messagesPath: string
  notificationsPath: string
  profilePath: string
  helpPath: string
}) {
  const navigate = useNavigate()
  const { user, userId } = useCurrentUser()
  const notifications = useDb(() => (userId ? getNotifications(userId) : []))
  const unread = useDb(() => (userId ? getUnreadCount(userId) : 0))
  const unreadMsgs = useDb(() => (userId ? getUnreadMessageCount(userId) : 0))
  const [query, setQuery] = useState('')

  if (!user) return null

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-6">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearch?.(e.target.value)
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => navigate(messagesPath)}
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          <MessageSquare className="size-5" />
          {unreadMsgs > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white">
              {unreadMsgs}
            </span>
          )}
        </button>

        <Dropdown
          width="w-80"
          trigger={({ toggle }) => (
            <button onClick={toggle} className="relative flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          )}
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between px-3.5 py-2">
                <p className="text-sm font-semibold text-neutral-800">Notifications</p>
                {unread > 0 && (
                  <button
                    className="text-xs font-medium text-brand-600 hover:underline"
                    onClick={() => userId && markAllNotificationsRead(userId)}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto border-t border-neutral-100">
                {notifications.length === 0 ? (
                  <EmptyState title="No notifications" description="You're all caught up." />
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id)
                        close()
                        if (n.linkTo) navigate(n.linkTo)
                      }}
                      className={`flex w-full flex-col gap-0.5 border-b border-neutral-50 px-3.5 py-2.5 text-left hover:bg-neutral-50 ${
                        !n.read ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-neutral-800">{n.title}</span>
                      <span className="text-xs text-neutral-500">{n.body}</span>
                      <span className="text-[11px] text-neutral-400">{timeAgo(n.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  close()
                  navigate(notificationsPath)
                }}
                className="block w-full border-t border-neutral-100 py-2 text-center text-xs font-medium text-brand-600 hover:bg-neutral-50"
              >
                View all notifications
              </button>
            </div>
          )}
        </Dropdown>

        <Dropdown
          trigger={({ toggle }) => (
            <button onClick={toggle} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-neutral-100">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold text-neutral-800">{user.firstName} {user.lastName}</span>
                <span className="block text-[11px] capitalize text-neutral-400">{user.roles.join(' · ')}</span>
              </span>
              <ChevronDown className="size-3.5 text-neutral-400" />
            </button>
          )}
        >
          {(close) => (
            <div>
              <DropdownItem icon={<UserIcon className="size-4" />} onClick={() => { close(); navigate(profilePath) }}>
                Profile
              </DropdownItem>
              <DropdownItem icon={<Settings className="size-4" />} onClick={() => { close(); navigate(profilePath) }}>
                Settings
              </DropdownItem>
              <DropdownItem icon={<HelpCircle className="size-4" />} onClick={() => { close(); navigate(helpPath) }}>
                Help & Safety
              </DropdownItem>
              <div className="my-1 border-t border-neutral-100" />
              <DropdownItem
                icon={<LogOut className="size-4" />}
                danger
                onClick={() => {
                  close()
                  logout()
                  navigate('/login')
                }}
              >
                Logout
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
