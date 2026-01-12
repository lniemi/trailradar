# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sport Radar is an ultra-trail event spectator application that displays participant locations on a map in real-time. The app allows spectators to follow specific participants, track their progress, and use AR technology to locate nearby participants when viewing events physically along the route.

## Monorepo Structure

This is a **pnpm monorepo** with Turborepo for build orchestration:

```
sportradar/
├── apps/
│   ├── spectator/          # Main spectator app (React + Vite + TypeScript)
│   └── website/            # Company website (React + Vite + TypeScript)
├── packages/
│   ├── auth/               # Supabase authentication (@sportradar/auth)
│   ├── ui/                 # Shared UI components (@sportradar/ui)
│   ├── utils/              # Shared utilities (@sportradar/utils)
│   ├── config/             # Shared ESLint/Tailwind configs (@sportradar/config)
│   └── typescript-config/  # Shared TypeScript configs (@sportradar/typescript-config)
├── supabase/               # Supabase configuration
├── data/                   # Shared data files (GPX, etc.)
├── los_module/             # Python research module (separate)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Tech Stack

- **Frontend**: React 19 with Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **Mapping**: Mapbox GL JS
- **3D**: Three.js, @react-three/fiber, geo-three
- **Routing**: React Router v7
- **Backend**: Supabase (local for dev, hosted for production)
- **Build**: pnpm workspaces + Turborepo
- **Deployment**: Vercel

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                  # Run all apps in dev mode
pnpm dev:spectator        # Run spectator app only (port 5173)
pnpm dev:website          # Run website only (port 5174)

# Build
pnpm build                # Build all apps
pnpm build:spectator      # Build spectator app only
pnpm build:website        # Build website only

# Other
pnpm lint                 # Lint all packages
pnpm typecheck            # TypeScript type checking
pnpm clean                # Clean all build artifacts

# Supabase
pnpm supabase:start       # Start local Supabase
pnpm supabase:stop        # Stop local Supabase
pnpm supabase:reset       # Reset local database
```

## Environment Configuration

Copy `.env.example` to `.env` in the root and/or app folders:

```env
# Supabase (from `supabase start` output)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

## Shared Packages

### @sportradar/utils
Geo utilities for distance calculations:
```typescript
import { haversineDistance, calculateTotalDistance, getPositionAtDistance } from '@sportradar/utils/geo'
```

### @sportradar/auth
Supabase authentication:
```typescript
import { AuthProvider, useAuth, getSupabaseClient } from '@sportradar/auth'
```

### @sportradar/ui
Shared UI components:
```typescript
import { Button, Card } from '@sportradar/ui'
```

## Spectator App Architecture

### Route Structure

- **Entry point**: [apps/spectator/src/main.tsx](apps/spectator/src/main.tsx) - Sets up React, Router, and Mapbox CSS
- **Router**: [apps/spectator/src/App.tsx](apps/spectator/src/App.tsx) - Defines application routes
- **Pages**:
  - [apps/spectator/src/pages/Home.tsx](apps/spectator/src/pages/Home.tsx) - Main map view with race UI components (timer, leaderboard, athlete info)
  - [apps/spectator/src/pages/SimulationManager.tsx](apps/spectator/src/pages/SimulationManager.tsx) - Control panel for athlete simulation (separate window)

### Cross-Window Communication Pattern

The app uses a **localStorage-based message passing system** for communication between the Home (map) window and SimulationManager window:

**SimulationManager → Home (commands)**:
- Writes to `localStorage.setItem('simulation_command', JSON.stringify({ command, data }))`
- Single-athlete commands: `start_single_athlete`, `start`, `pause`, `resume`, `stop`, `reset`, `set_speed`
- Multi-athlete commands: `start_multiple_athletes`, `pause_athlete`, `resume_athlete`, `stop_athlete`, `set_athlete_speed`
- Home listens via `storage` event handler

**Home → SimulationManager (state updates)**:
- Writes to `localStorage.setItem('simulation_state', JSON.stringify(state))`
- Single-athlete mode: Broadcasts state with `mode: 'single'` every 100ms (position, distance, progress, speed, etc.)
- Multi-athlete mode: Broadcasts state with `mode: 'multiple'` containing array of all athlete states
- SimulationManager listens via `storage` event handler

This pattern enables real-time synchronization between windows without a backend.

### Map Component

[apps/spectator/src/components/Map.tsx](apps/spectator/src/components/Map.tsx) is the core component that:
- Initializes Mapbox GL with globe projection and terrain (DEM exaggeration: 1.5)
- Loads the TOR330 route from [apps/spectator/public/TOR330.geojson](apps/spectator/public/TOR330.geojson)
- Renders the route as a yellow line layer
- Auto-fits the map bounds to the route extent
- **Single-athlete mode methods** (via ref):
  - `updateAthletePosition(lng, lat)` - Updates single athlete marker position
  - `removeAthleteMarker()` - Removes single athlete marker
- **Multi-athlete mode methods** (via ref):
  - `updateAthletePositions(athletes)` - Updates multiple athlete markers (array of {id, name, position, lng, lat})
  - `removeAthleteMarkerById(athleteId)` - Removes specific athlete marker
  - `clearAllAthleteMarkers()` - Removes all athlete markers
  - `fitToAthletes()` - Adjusts map bounds to show all athletes
- **Marker styling**: Color-coded by position (gold for 1st, silver for 2nd, bronze for 3rd, red for others)
- **Implementation note**: Component named `MapComponent` internally to avoid conflict with JavaScript's built-in `Map` constructor

### Athlete Simulation System

The simulation system allows virtual athletes to traverse routes for testing and development. It supports both **single-athlete** and **multi-athlete** simulation modes:

#### Single-Athlete Simulation

**Core module**: [apps/spectator/src/simulations/athleteSimulation.ts](apps/spectator/src/simulations/athleteSimulation.ts)
- `AthleteSimulation` class manages simulated athlete movement along the route
- Loads route coordinates from GeoJSON and calculates total distance
- Supports initial positioning (athletes can start at any distance along route)
- Provides controls: start, pause, resume, stop, reset, and speed adjustment
- Returns current state including position (lng/lat/elevation), distance covered, progress %, elapsed time, and finish status

#### Multi-Athlete Simulation

**Core module**: [apps/spectator/src/simulations/multiAthleteSimulation.ts](apps/spectator/src/simulations/multiAthleteSimulation.ts)
- `MultiAthleteSimulation` class manages multiple concurrent `AthleteSimulation` instances
- Each athlete runs independently with their own simulation instance
- **Global controls**: `start()`, `pause()`, `resume()`, `stop()`, `reset()`, `setGlobalSpeed(speed)`
- **Individual controls**: `pauseAthlete(id)`, `resumeAthlete(id)`, `stopAthlete(id)`, `setAthleteSpeed(id, speed)`
- **State methods**:
  - `getAllStates()` - Returns array of all athlete states
  - `getAthleteState(id)` - Returns specific athlete state
  - `areAllFinished()` - Checks if all athletes have completed the route

#### Shared Utilities

**Module**: [packages/utils/src/geo/](packages/utils/src/geo/) (shared package)
- `haversineDistance()` - Calculates distance between two geographic points
- `calculateTotalDistance()` - Sums distances along an entire route
- `getPositionAtDistance()` - Interpolates position at a specific distance along the route

#### Simulation Architecture

- **Single-athlete mode**: Home.jsx maintains one `AthleteSimulation` instance in `simulationRef`
- **Multi-athlete mode**: Home.jsx maintains one `MultiAthleteSimulation` instance in `multiSimulationRef` that manages multiple athlete simulations internally
- Both modes are mutually exclusive - starting one mode stops the other
- All athletes share the same route data (loaded once per simulation instance for efficiency)
- Map displays update every 100ms with current positions
- Leaderboard automatically sorts athletes by distance in real-time

### UI Components

All spectator UI components use fixed positioning to overlay the map with semi-transparent backgrounds and backdrop blur:

**RaceTimer**: [apps/spectator/src/components/RaceTimer.tsx](apps/spectator/src/components/RaceTimer.tsx)
- Live race timer with pulsing "LIVE" indicator
- Displays elapsed time in HH:MM:SS or MM:SS format
- Fixed position top-left, below navbar

**Leaderboard**: [apps/spectator/src/components/Leaderboard.tsx](apps/spectator/src/components/Leaderboard.tsx)
- Toggle button with star icon (fixed position below race timer)
- Expandable side panel that slides in from the left
- Shows ranked list of athletes sorted by distance covered
- Top 3 positions have medal-colored position badges

**AthleteInfoSheet**: [apps/spectator/src/components/AthleteInfoSheet.tsx](apps/spectator/src/components/AthleteInfoSheet.tsx)
- Search bar positioned at bottom center of screen
- Search functionality by athlete name or bib number
- Selected athlete info panel displays athlete details (age, club, nationality, photo)
- Expandable section shows previous race experiences and sponsors
- Auto-selects simulated athlete when simulation starts
- Notifies parent component of selection and expansion state changes

**ARButton**: [apps/spectator/src/components/ARButton.tsx](apps/spectator/src/components/ARButton.tsx)
- Fixed position button for AR view toggle
- Dynamically shifts position based on athlete info sheet state
- Eye icon design for AR functionality

### Z-Index Layer Management

All fixed-position UI components use carefully managed z-index values to ensure proper layering. The stacking order from top to bottom is:

**Z-Index Hierarchy:**
1. **Leaderboard panel (open)**: `z-index: 60` - Highest priority when expanded
2. **Search results dropdown**: `z-index: 50` - Must appear above all buttons
3. **AthleteInfoSheet container**: `z-index: 45` - Creates stacking context for search
4. **Leaderboard & AR buttons**: `z-index: 35` - Above athlete info panel
5. **Athlete info panel**: `z-index: -1` (relative) - Below buttons, inside sheet container

**Critical Design Notes:**
- The AthleteInfoSheet container has `z-index: 45` to create a stacking context that allows the search results dropdown (inside it) to appear above the buttons (z-index: 35)
- The athlete-info-panel inside AthleteInfoSheet has `z-index: -1` to ensure it renders below the buttons
- The leaderboard panel has the highest z-index (60) to appear above all elements when opened
- Search results have `z-index: 50` within their container to appear above buttons

**Button Position Shifting:**

Both Leaderboard and AR buttons dynamically adjust their vertical position based on the AthleteInfoSheet state:

```css
/* Base position when no athlete selected */
bottom: 100px;

/* Shifted when athlete is selected (not expanded) */
bottom: 340px;  /* .shifted class */

/* Shifted when athlete info is expanded */
bottom: 640px;  /* .shifted-expanded class */
```

The buttons receive two props from Home.jsx:
- `hasSelectedAthlete`: Boolean indicating if an athlete is selected
- `isAthleteInfoExpanded`: Boolean indicating if the athlete info is expanded

This ensures buttons always appear above the athlete info sheet in all states.

**State Management Pattern:**

Home.jsx tracks both selection and expansion states:
```javascript
const [selectedAthlete, setSelectedAthlete] = useState(null)
const [isAthleteInfoExpanded, setIsAthleteInfoExpanded] = useState(false)
```

AthleteInfoSheet notifies the parent via callbacks:
- `onSelectionChange(athlete)` - Called when athlete is selected/deselected
- `onExpandChange(isExpanded)` - Called when info panel expands/collapses

### Simulation Manager UI

[apps/spectator/src/pages/SimulationManager.tsx](apps/spectator/src/pages/SimulationManager.tsx) provides a control panel for managing both single and multiple athlete simulations:

#### Single-Athlete Mode
- Dropdown to select individual athlete
- "Start Single Athlete Simulation" button (disabled when simulation is active)
- Shows athlete's base speed and initial distance position

#### Multi-Athlete Mode
- "Start Multiple Athletes" button to simulate selected athletes
- Athlete selection UI with checkboxes (only visible when no simulation is active)
- "Select All" / "Clear" buttons for bulk selection
- Counter showing `selectedAthletes.length / total` athletes selected

#### Controls Panel

**Single-Athlete Controls:**
- Speed slider (1-99999 km/h)
- Play/Pause/Stop/Reset buttons
- Live status showing progress %, distance, time, elevation, GPS coordinates
- Athlete info card (name, bib)

**Multi-Athlete Controls:**
- Global speed slider (applies to all athletes)
- Global play/pause/stop/reset buttons
- Individual athlete cards sorted by distance, showing:
  - Position rank, name, bib number
  - Current distance and speed
  - Status indicators (⏸ Paused, 🏁 Finished)
  - Individual pause/resume/stop buttons
  - Individual speed slider (1-50 km/h)
- Overall status panel showing total athletes and completion state
- Scrollable list (max-height: 384px) for many athletes

#### Usage Instructions

1. Open SimulationManager in one browser window/tab
2. Open Home (map view) in another window/tab
3. **For single-athlete**: Select athlete from dropdown, click "Start Single Athlete Simulation"
4. **For multi-athlete**: Check desired athletes, click "Start Multiple Athletes"
5. Use controls to manage simulation (pause, speed changes, etc.)
6. View real-time updates on both windows

### Data Files

Route data is stored in [apps/spectator/public/](apps/spectator/public/):
- `TOR330.geojson` - Full race route (converted from GPX)
- `TOR330_waypoints.geojson` - Key waypoints along the route

Mock athlete data is defined in [apps/spectator/src/simulations/mockAthletes.ts](apps/spectator/src/simulations/mockAthletes.ts):
- 10 athletes with unique IDs, names, bib numbers
- Each has `baseSpeed`, `initialDistance`, age, nationality, club
- Includes previous race experiences and sponsors
- Helper functions: `getAthleteById(id)`, `getAthleteByBib(bib)`

The root directory contains source files including `TOR330-CERT-2025.gpx` (original GPX route file).

### 3D Terrain View (ARView)

[apps/spectator/src/components/ARView.tsx](apps/spectator/src/components/ARView.tsx) provides a 3D terrain visualization using geo-three library:

**Geo-Three Integration:**
- Uses `geo-three` library for 3D terrain rendering with Mapbox data
- **Critical**: Use `MapView.HEIGHT` mode to enable 3D terrain elevation (uses `MapHeightNode`)
- MapBox providers configuration:
  - **Satellite imagery**: `MapBoxProvider(token, 'mapbox/satellite-v9', MapBoxProvider.STYLE, 'png', false)`
  - **Terrain height data**: `MapBoxProvider(token, 'mapbox.terrain-rgb', MapBoxProvider.MAP_ID, 'pngraw', false)`
- MapView modes available:
  - `MapView.PLANAR` - Flat 2D plane (uses `MapPlaneNode`)
  - `MapView.HEIGHT` - **3D terrain with elevation** (uses `MapHeightNode`) ← Use this for terrain
  - `MapView.HEIGHT_SHADER` - 3D terrain with shader-based displacement
  - `MapView.SPHERICAL` - Globe view
  - `MapView.MARTINI` - MARTINI mesh simplification for height

**Coordinate System:**
- Uses EPSG:900913 (Spherical Mercator) coordinate format internally
- Convert lat/lng to world coordinates: `UnitsUtils.datumsToSpherical(lat, lng)`
- Camera target example: `controls.target.set(coords.x, 0, -coords.y)`
- Origin positioning: `mapView.position.set(-originCoords.x, 0, originCoords.y)`

**Route Rendering on 3D Terrain:**
- **IMPORTANT**: Do NOT use raycasting for route positioning - terrain tiles load asynchronously and raycasting returns 0 valid heights
- **Use GeoJSON elevation data directly**: Route coordinates format `[longitude, latitude, elevation]` already contains elevation from original GPX
- The MapBox terrain tiles and GeoJSON elevation use the same source data, so they match perfectly
- Route implementation:
  - Load route from GeoJSON and sample points (e.g., every 10th point) for performance
  - Convert each coordinate to world space using `coordsToWorld(lat, lng)`
  - Use elevation directly from `coord[2]` (third value in GeoJSON coordinate array)
  - Create `THREE.Vector3(pos.x, elevation + offset, pos.z)` for each point
  - Use `THREE.TubeGeometry` with `THREE.CatmullRomCurve3` for smooth 3D tube following terrain
  - Material: `MeshStandardMaterial` with emissive properties for better visibility
  - Tube radius: ~20m, offset: ~10m above terrain for visibility
- Route updates every frame via `useFrame()` to rebuild geometry as needed
- Dispose old geometry before creating new to prevent memory leaks

**Athlete Marker Positioning:**
- **IMPORTANT**: Like routes, do NOT use raycasting for athlete positioning - use elevation data directly
- Athletes have elevation data in their state from `getPositionAtDistance()` which interpolates from route GeoJSON
- Home.jsx passes elevation to ARView in `athletePositions` array: `{ id, name, position, lng, lat, elevation }`
- AthleteMarker uses `athlete.elevation` directly: `new THREE.Vector3(pos.x, elevation + 100, pos.z)`
- Offset markers above terrain (+100m) to ensure visibility above route
- Markers are billboarded (always face camera) for better visibility using `meshRef.quaternion.copy(camera.quaternion)`
- Position updates every frame via `useFrame()` to track moving athletes

**Performance:**
- Use `LODRaycast` for efficient level-of-detail management
- Sample route points (e.g., every 10th point) to reduce geometry complexity
- LOD updates automatically via `onBeforeRender` callback
- Limit tube geometry segments: `Math.min(points.length * 2, 1000)` to prevent excessive geometry

## Vite Dependency Optimization

The spectator app uses a specific `optimizeDeps` configuration in [apps/spectator/vite.config.ts](apps/spectator/vite.config.ts) to prevent "504 Outdated Optimize Dep" errors:

**Why this matters:**
- `@react-three/drei` has many lazy-loaded nested dependencies (three-stdlib, troika-three-text, etc.)
- Without explicit inclusion, Vite discovers these mid-session and triggers re-optimization
- This creates hash mismatches between the browser cache and server, causing 504 errors

**Configuration pattern:**
```typescript
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'react-router-dom',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    // Include drei's nested dependencies to prevent optimization issues
    '@react-three/drei > three-stdlib',
    '@react-three/drei > @monogrid/gainmap-js',
    '@react-three/drei > troika-three-text',
    'mapbox-gl',
    'geo-three',
  ],
  exclude: ['@sportradar/ui', '@sportradar/auth', '@sportradar/utils'],
}
```

**Key points:**
- Use `>` syntax to include nested dependencies (e.g., `@react-three/drei > three-stdlib`)
- Exclude monorepo packages (`@sportradar/*`) - they're symlinked and shouldn't be bundled
- Include core React packages for consistent module resolution

**If you encounter "Outdated Optimize Dep" errors:**
1. Stop the dev server
2. Delete the `.vite` cache: `rmdir /s /q apps/spectator/node_modules/.vite`
3. Clear browser cache or use incognito
4. Restart with `pnpm dev:spectator`

## Code Patterns

- All components use functional React with hooks
- Map state managed via refs to prevent re-renders
- Route coordinates format: `[longitude, latitude, elevation]`
- GeoJSON features use MultiLineString geometry (access via `features[0].geometry.coordinates[0]`)
- Simulation modes are mutually exclusive (starting one stops the other)
- Use `window.Map()` instead of `Map()` when JavaScript's Map constructor is needed in Map.jsx to avoid naming conflicts

## Research Modules

### LOS Module (`los_module/`)

The `los_module/` folder contains **research-only** code for developing Line of Sight (LOS) calculations. This is a Python-based exploration environment separate from the main React application.

**Important**: This folder is not part of the main application build. It uses its own Python virtual environment and dependencies.

See [los_module/CLAUDE.md](los_module/CLAUDE.md) for detailed instructions on working with this module.
