# Architecture Overview

SportRadar is designed as a modern, scalable web application for real-time event tracking.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Spectator  │  │   Website   │  │    Docs     │         │
│  │    App      │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                                   │
│  ┌──────┴────────────────┴──────────────────────┐          │
│  │           Shared Packages                     │          │
│  │  @sportradar/auth  @sportradar/ui            │          │
│  │  @sportradar/utils @sportradar/config        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Supabase                          │   │
│  │  • PostgreSQL Database                               │   │
│  │  • Authentication                                    │   │
│  │  • Real-time Subscriptions                          │   │
│  │  • Storage                                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │   Mapbox    │  │   Vercel    │                          │
│  │  (Maps/3D)  │  │  (Hosting)  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Monorepo Architecture

All code lives in a single repository, enabling:
- Shared code between apps via packages
- Consistent tooling and configuration
- Atomic changes across multiple packages
- Simplified dependency management

### 2. Real-Time First

The application is built around real-time data:
- Supabase provides real-time database subscriptions
- Map updates happen instantly as positions change
- Cross-window communication enables multi-window workflows

### 3. Offline-Capable

Key features work offline:
- Route data is bundled with the app
- Simulation system works without backend
- Progressive enhancement for connected features

### 4. Modular UI

Components are designed for reusability:
- Shared UI package for common components
- Consistent styling via Tailwind CSS
- Z-index management for overlay components

## Data Flow

### Live Tracking (Production)

```
GPS Device → Backend API → Supabase → Real-time Subscription → Map Update
```

### Simulation (Development)

```
SimulationManager → localStorage → Home Window → Map Update
                         ↑               │
                         └───────────────┘
                         (State sync)
```

## Technology Choices

| Concern | Technology | Rationale |
|---------|------------|-----------|
| Frontend | React 19 | Modern features, ecosystem |
| Build | Vite | Fast development, optimized builds |
| Styling | Tailwind CSS v4 | Utility-first, consistent design |
| Maps | Mapbox GL JS | High-performance, 3D terrain support |
| 3D | Three.js + geo-three | WebGL terrain visualization |
| Backend | Supabase | Real-time, auth, storage in one |
| Monorepo | pnpm + Turborepo | Fast installs, smart caching |
