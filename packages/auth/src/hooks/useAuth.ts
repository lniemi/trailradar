import { useState, useEffect } from 'react'
import { getSupabaseClient, type User, type Session } from '../client'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export type UseAuthReturn = AuthState & AuthActions

/**
 * Hook for authentication state and actions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign in failed'))
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign up failed'))
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign out failed'))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Password reset failed'))
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
