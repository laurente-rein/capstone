import { useDbStore } from '../store/db'
import type { DbState } from '../store/dbTypes'
import { useSessionStore } from '../store/session'

/**
 * `data` is only replaced (new reference) when an action actually mutates the store,
 * so subscribing to it directly gives React a stable snapshot. Deriving with an
 * arbitrary selector *inside* the zustand subscription (e.g. `(s) => selector(s.data)`)
 * would return a fresh array/object every call and break useSyncExternalStore's
 * snapshot caching, causing an infinite render loop — so we subscribe to the stable
 * `data` reference and compute the derived value separately.
 */
export function useDb<T>(selector: (db: DbState) => T): T {
  const data = useDbStore((s) => s.data)
  return selector(data)
}

export function useCurrentUser() {
  const userId = useSessionStore((s) => s.userId)
  const activeRole = useSessionStore((s) => s.activeRole)
  const user = useDb((db) => db.users.find((u) => u.id === userId))
  return { user, userId, activeRole }
}
