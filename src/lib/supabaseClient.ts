import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Live mode is only enabled when real project credentials are configured.
 * Without them the app runs entirely on the in-browser mock backend
 * (src/store/db.ts + src/lib/actions) seeded with realistic sample data —
 * see supabase/migrations for the schema this mirrors. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url as string, anonKey as string) : null
