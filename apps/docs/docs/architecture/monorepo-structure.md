# Monorepo Structure

SportRadar uses a pnpm monorepo with Turborepo for build orchestration.

## Directory Layout

```
sportradar/
├── apps/
│   ├── spectator/          # Main spectator app
│   ├── website/            # Company website
│   └── docs/               # Documentation (Docusaurus)
├── packages/
│   ├── auth/               # @sportradar/auth
│   ├── ui/                 # @sportradar/ui
│   ├── utils/              # @sportradar/utils
│   ├── config/             # @sportradar/config
│   └── typescript-config/  # @sportradar/typescript-config
├── supabase/               # Supabase configuration
├── data/                   # Shared data files
├── los_module/             # Python research module
├── pnpm-workspace.yaml     # Workspace configuration
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

## Apps

### Spectator (`apps/spectator`)

The main application for spectators to track race participants.

- **Package name**: `@sportradar/spectator`
- **Port**: 5173
- **Tech**: React + Vite + TypeScript

### Website (`apps/website`)

The company marketing website.

- **Package name**: `@sportradar/website`
- **Port**: 5174
- **Tech**: React + Vite + TypeScript

### Docs (`apps/docs`)

This documentation site.

- **Package name**: `@sportradar/docs`
- **Port**: 3000
- **Tech**: Docusaurus

## Packages

### @sportradar/auth

Authentication utilities using Supabase.

```typescript
import { AuthProvider, useAuth, getSupabaseClient } from '@sportradar/auth'
```

### @sportradar/ui

Shared UI components.

```typescript
import { Button, Card } from '@sportradar/ui'
```

### @sportradar/utils

Shared utilities, primarily geo calculations.

```typescript
import {
  haversineDistance,
  calculateTotalDistance,
  getPositionAtDistance
} from '@sportradar/utils/geo'
```

### @sportradar/config

Shared ESLint and Tailwind configurations.

### @sportradar/typescript-config

Shared TypeScript configuration files.

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json

Defines the task pipeline:

- **build**: Depends on `^build` (builds dependencies first)
- **dev**: Runs in parallel, persistent
- **lint**: Can run in parallel
- **typecheck**: Can run in parallel

## Adding New Packages

1. Create directory under `apps/` or `packages/`
2. Add `package.json` with appropriate name (e.g., `@sportradar/new-package`)
3. The workspace will automatically recognize it
4. Run `pnpm install` to link dependencies
