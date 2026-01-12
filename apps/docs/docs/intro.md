# Introduction

Welcome to **SportRadar** - an ultra-trail event spectator application that displays participant locations on a map in real-time.

## What is SportRadar?

SportRadar allows spectators to:

- **Follow participants** on an interactive map with live position updates
- **Track progress** including distance covered, elapsed time, and current position
- **Use AR technology** to locate nearby participants when viewing events physically along the route
- **View 3D terrain** with the race route overlaid on realistic elevation data

## Quick Links

- [Installation Guide](/docs/getting-started/installation) - Set up the development environment
- [Development Guide](/docs/getting-started/development) - Learn how to run and develop the apps
- [Architecture Overview](/docs/architecture/overview) - Understand the system design
- [Spectator App](/docs/apps/spectator) - Main spectator application documentation

## Project Structure

SportRadar is organized as a **pnpm monorepo** with multiple apps and shared packages:

```
sportradar/
├── apps/
│   ├── spectator/    # Main spectator app
│   ├── website/      # Company website
│   └── docs/         # This documentation
├── packages/
│   ├── auth/         # Authentication
│   ├── ui/           # Shared UI components
│   ├── utils/        # Shared utilities
│   └── config/       # Shared configurations
└── supabase/         # Backend configuration
```

## Additional Resources

- [Technical Architecture Presentation](/files/TrailRadar_Technical_Architecture.pptx) - PowerPoint overview of the system architecture
