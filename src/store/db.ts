import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DbState } from './dbTypes'
import { buildSeedData, SEED_VERSION } from '../lib/seed'

interface DbStore {
  data: DbState
  set: (updater: (draft: DbState) => void) => void
  resetToSeed: () => void
}

/** Produces a shallow-cloned draft, applies mutations, and commits — a tiny hand-rolled
 * immer substitute so action code can read like plain mutation. */
function mutate(state: DbState, updater: (draft: DbState) => void): DbState {
  const draft: DbState = { ...state }
  updater(draft)
  return draft
}

export const useDbStore = create<DbStore>()(
  persist(
    (set, get) => ({
      data: buildSeedData(),
      set: (updater) => set({ data: mutate(get().data, updater) }),
      resetToSeed: () => set({ data: buildSeedData() }),
    }),
    {
      name: 'campustutor-db',
      version: SEED_VERSION,
      migrate: () => ({ data: buildSeedData() }),
      onRehydrateStorage: () => (state) => {
        if (state && state.data.seedVersion !== SEED_VERSION) {
          state.data = buildSeedData()
        }
      },
    },
  ),
)

export function getDb(): DbState {
  return useDbStore.getState().data
}

export function updateDb(updater: (draft: DbState) => void) {
  useDbStore.getState().set(updater)
}
