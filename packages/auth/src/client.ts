import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Get the Supabase client singleton
 * Lazily initializes the client on first call
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    )
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

  return supabaseClient
}

/**
 * Reset the client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null
}

// Re-export useful types from supabase-js
export type { SupabaseClient, User, Session } from '@supabase/supabase-js'
