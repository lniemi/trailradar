// Client
export { getSupabaseClient, resetSupabaseClient, type SupabaseClient, type User, type Session } from './client'

// Hooks
export { useAuth, type AuthState, type AuthActions, type UseAuthReturn } from './hooks'

// Provider
export { AuthProvider, useAuthContext } from './providers/AuthProvider'
