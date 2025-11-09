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
- **Pages**:
  - [src/pages/Home.jsx](src/pages/Home.jsx) - Main map view with race UI components (timer, leaderboard, athlete info)
  - [src/pages/SimulationManager.jsx](src/pages/SimulationManager.jsx) - Control panel for athlete simulation (separate window)

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

[src/components/Map.jsx](src/components/Map.jsx) is the core component that:
- Initializes Mapbox GL with globe projection and terrain (DEM exaggeration: 1.5)
- Loads the TOR330 route from [public/TOR330.geojson](public/TOR330.geojson)
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

**Core module**: [src/simulations/athleteSimulation.js](src/simulations/athleteSimulation.js)
- `AthleteSimulation` class manages simulated athlete movement along the route
- Loads route coordinates from GeoJSON and calculates total distance
- Supports initial positioning (athletes can start at any distance along route)
- Provides controls: start, pause, resume, stop, reset, and speed adjustment
- Returns current state including position (lng/lat/elevation), distance covered, progress %, elapsed time, and finish status

#### Multi-Athlete Simulation

**Core module**: [src/simulations/multiAthleteSimulation.js](src/simulations/multiAthleteSimulation.js)
- `MultiAthleteSimulation` class manages multiple concurrent `AthleteSimulation` instances
- Each athlete runs independently with their own simulation instance
- **Global controls**: `start()`, `pause()`, `resume()`, `stop()`, `reset()`, `setGlobalSpeed(speed)`
- **Individual controls**: `pauseAthlete(id)`, `resumeAthlete(id)`, `stopAthlete(id)`, `setAthleteSpeed(id, speed)`
- **State methods**:
  - `getAllStates()` - Returns array of all athlete states
  - `getAthleteState(id)` - Returns specific athlete state
  - `areAllFinished()` - Checks if all athletes have completed the route

#### Shared Utilities

**Module**: [src/simulations/utils.js](src/simulations/utils.js)
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

**RaceTimer**: [src/components/RaceTimer.jsx](src/components/RaceTimer.jsx)
- Live race timer with pulsing "LIVE" indicator
- Displays elapsed time in HH:MM:SS or MM:SS format
- Fixed position top-left, below navbar

**Leaderboard**: [src/components/Leaderboard.jsx](src/components/Leaderboard.jsx)
- Toggle button with star icon (fixed position below race timer)
- Expandable side panel that slides in from the left
- Shows ranked list of athletes sorted by distance covered
- Top 3 positions have medal-colored position badges

**AthleteInfoSheet**: [src/components/AthleteInfoSheet.jsx](src/components/AthleteInfoSheet.jsx)
- Search bar positioned at bottom center of screen
- Search functionality by athlete name or bib number
- Selected athlete info panel displays athlete details (age, club, nationality, photo)
- Expandable section shows previous race experiences and sponsors
- Auto-selects simulated athlete when simulation starts
- Notifies parent component of selection and expansion state changes

**ARButton**: [src/components/ARButton.jsx](src/components/ARButton.jsx)
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

[src/pages/SimulationManager.jsx](src/pages/SimulationManager.jsx) provides a control panel for managing both single and multiple athlete simulations:

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

Route data is stored in [public/](public/):
- `TOR330.geojson` - Full race route (converted from GPX)
- `TOR330_waypoints.geojson` - Key waypoints along the route

Mock athlete data is defined in [src/simulations/mockAthletes.js](src/simulations/mockAthletes.js):
- 10 athletes with unique IDs, names, bib numbers
- Each has `baseSpeed`, `initialDistance`, age, nationality, club
- Includes previous race experiences and sponsors
- Helper functions: `getAthleteById(id)`, `getAthleteByBib(bib)`

The root directory contains source files including `TOR330-CERT-2025.gpx` (original GPX route file).

### 3D Terrain View (ARView)

[src/components/ARView.jsx](src/components/ARView.jsx) provides a 3D terrain visualization using geo-three library:

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
- Athlete markers use raycasting for dynamic positioning (works for point objects)
- Raycast from high above (e.g., y: 10000) downward to get terrain elevation
- Use `useFrame()` to continuously raycast until terrain tiles are loaded
- Only position markers when `terrainHeight > 0` (successful raycast)
- Offset markers above terrain (+100m) to ensure visibility
- Markers are billboarded (always face camera) for better visibility

**Performance:**
- Use `LODRaycast` for efficient level-of-detail management
- Sample route points (e.g., every 10th point) to reduce geometry complexity
- LOD updates automatically via `onBeforeRender` callback
- Limit tube geometry segments: `Math.min(points.length * 2, 1000)` to prevent excessive geometry

## Code Patterns

- All components use functional React with hooks
- Map state managed via refs to prevent re-renders
- Route coordinates format: `[longitude, latitude, elevation]`
- GeoJSON features use MultiLineString geometry (access via `features[0].geometry.coordinates[0]`)
- Simulation modes are mutually exclusive (starting one stops the other)
- Use `window.Map()` instead of `Map()` when JavaScript's Map constructor is needed in Map.jsx to avoid naming conflicts
