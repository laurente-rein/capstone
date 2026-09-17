import { updateDb } from '../../store/db'
import type { SystemSettings } from '../../types'

export class SettingsError extends Error {}

export function updateSettings(next: SystemSettings) {
  const total = next.tutorSharePct + next.osasSharePct + next.platformSharePct
  if (Math.abs(total - 1) > 0.001) {
    throw new SettingsError('Allocation percentages must total exactly 100%.')
  }
  updateDb((db) => {
    db.settings = next
  })
}
