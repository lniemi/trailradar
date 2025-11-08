# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sport Radar is an ultra-trail event spectator application that displays participant locations on a map in real-time. The app allows spectators to follow specific participants, track their progress, and use AR technology to locate nearby participants when viewing events physically along the route.

## Tech Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS v4
- **Mapping**: Mapbox GL JS
- **Routing**: React Router v7
- **Backend** (planned): Supabase (config present but not yet integrated)

## Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Configuration

The application requires a Mapbox access token. Copy [.env.example](.env.example) to `.env` and add your Mapbox token:

```
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

## Application Architecture

### Route Structure

- **Entry point**: [src/main.jsx](src/main.jsx) - Sets up React, Router, and Mapbox CSS
- **Router**: [src/App.jsx](src/App.jsx) - Defines application routes
- **Pages**: Currently only [src/pages/Home.jsx](src/pages/Home.jsx) which renders the map with an overlay title

### Map Component

[src/components/Map.jsx](src/components/Map.jsx) is the core component that:
- Initializes Mapbox GL with globe projection and terrain (DEM exaggeration: 1.5)
- Loads the TOR330 route from [public/TOR330.geojson](public/TOR330.geojson) (converted from the GPX file in the root)
- Renders the route as a yellow line layer
- Auto-fits the map bounds to the route extent

The map uses Mapbox's standard style and terrain visualization.

### Athlete Simulation System

The simulation system allows virtual athletes to traverse routes for testing and development:

**Core module**: [src/simulations/athleteSimulation.js](src/simulations/athleteSimulation.js)
- `AthleteSimulation` class manages simulated athlete movement along the route
- Loads route coordinates from GeoJSON and calculates total distance
- Provides controls: start, pause, resume, stop, reset, and speed adjustment
- Returns current state including position (lng/lat/elevation), distance covered, progress %, elapsed time, and finish status

**Utilities**: [src/simulations/utils.js](src/simulations/utils.js)
- `haversineDistance()` - Calculates distance between two geographic points
- `calculateTotalDistance()` - Sums distances along an entire route
- `getPositionAtDistance()` - Interpolates position at a specific distance along the route

### Data Files

Route data is stored in [public/](public/):
- `TOR330.geojson` - Full race route (converted from GPX)
- `TOR330_waypoints.geojson` - Key waypoints along the route

The root directory contains source files:
- `TOR330-CERT-2025.gpx` - Original GPX route file
- `TOE330.qmd` and `TOR330_waypoints.qmd` - QMD files (likely for documentation/analysis)

## Code Patterns

- All components use functional React with hooks
- Map state managed via refs to prevent re-renders
- Route coordinates format: `[longitude, latitude, elevation]`
- GeoJSON features use MultiLineString geometry (access via `features[0].geometry.coordinates[0]`)
