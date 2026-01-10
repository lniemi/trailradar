import { createContext, useContext, type ReactNode } from 'react'
import { useAuth, type UseAuthReturn } from '../hooks/useAuth'

const AuthContext = createContext<UseAuthReturn | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provider component for authentication context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
