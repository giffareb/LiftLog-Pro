import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/db'

// Fallback to placeholder strings to prevent app crash when environment variables are missing.
// Users must configure these variables in the AI Studio Settings (Secrets).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL'
  )
}
