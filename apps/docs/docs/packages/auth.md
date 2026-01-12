# @sportradar/auth

Supabase authentication package for SportRadar applications.

## Installation

This package is included in the monorepo. Import directly:

```typescript
import { AuthProvider, useAuth, getSupabaseClient } from '@sportradar/auth'
```

## Usage

### AuthProvider

Wrap your application with the AuthProvider:

```tsx
import { AuthProvider } from '@sportradar/auth'

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  )
}
```

### useAuth Hook

Access authentication state and methods:

```tsx
import { useAuth } from '@sportradar/auth'

function Profile() {
  const { user, signIn, signOut, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) {
    return <button onClick={() => signIn()}>Sign In</button>
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### getSupabaseClient

Access the Supabase client directly:

```typescript
import { getSupabaseClient } from '@sportradar/auth'

const supabase = getSupabaseClient()

// Use for database operations
const { data, error } = await supabase
  .from('athletes')
  .select('*')
```

## Configuration

The package uses environment variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API Reference

### AuthProvider Props

| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | Child components |

### useAuth Return Value

| Property | Type | Description |
|----------|------|-------------|
| user | User \| null | Current user object |
| loading | boolean | Auth state loading |
| signIn | (options?) => Promise | Sign in method |
| signOut | () => Promise | Sign out method |
| session | Session \| null | Current session |
