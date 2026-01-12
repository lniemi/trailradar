# Tech Stack

A comprehensive overview of the technologies used in SportRadar.

## Frontend

### React 19

The latest version of React with modern features:
- Concurrent rendering
- Automatic batching
- Transitions

### Vite

Fast build tool and development server:
- Near-instant hot module replacement (HMR)
- Optimized production builds
- Native ES modules in development

### TypeScript

Type-safe JavaScript:
- Shared type definitions across packages
- Enhanced IDE support
- Compile-time error catching

### Tailwind CSS v4

Utility-first CSS framework:
- Rapid UI development
- Consistent design system
- Small production bundles

## Mapping & 3D

### Mapbox GL JS

High-performance map rendering:
- Vector tile maps
- Globe projection
- Terrain (DEM) support
- Custom layers and markers

### Three.js

3D graphics library:
- WebGL rendering
- Scene management
- Camera controls

### @react-three/fiber

React renderer for Three.js:
- Declarative 3D scenes
- React hooks integration
- Component-based 3D

### geo-three

Geographic 3D terrain:
- Mapbox terrain tiles
- Height-based terrain mesh
- Multiple map projections

## Routing

### React Router v7

Client-side routing:
- Declarative routes
- Nested layouts
- Data loading

## Backend

### Supabase

Backend-as-a-service:
- **PostgreSQL**: Relational database
- **Auth**: User authentication
- **Realtime**: WebSocket subscriptions
- **Storage**: File storage

## Build Tools

### pnpm

Fast, disk-efficient package manager:
- Content-addressable storage
- Strict dependency resolution
- Workspace support

### Turborepo

Monorepo build system:
- Task caching
- Parallel execution
- Dependency-aware builds

## Deployment

### Vercel

Hosting and deployment:
- Automatic deployments
- Preview environments
- Edge network

## Development Tools

### ESLint

Code linting:
- Consistent code style
- Error prevention
- Shared configurations

### Prettier

Code formatting:
- Automatic formatting
- Consistent style
- Editor integration

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| vite | ^6.0.0 | Build tool |
| mapbox-gl | ^3.0.0 | Map rendering |
| three | ^0.170.0 | 3D graphics |
| @react-three/fiber | ^9.0.0 | React + Three.js |
| geo-three | ^0.1.0 | Geographic terrain |
| @supabase/supabase-js | ^2.0.0 | Supabase client |
| tailwindcss | ^4.0.0 | CSS framework |
| react-router-dom | ^7.0.0 | Routing |
