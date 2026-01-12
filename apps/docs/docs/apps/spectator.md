# Spectator App

The main SportRadar application for spectators to track race participants.

## Overview

The Spectator app displays participant locations on an interactive map in real-time. It includes features like:

- Interactive map with route visualization
- Real-time athlete position tracking
- Leaderboard with live rankings
- Athlete search and information display
- 3D terrain view with AR capabilities
- Simulation system for development/testing

## Application Structure

### Entry Points

- **Main entry**: `apps/spectator/src/main.tsx`
- **Router**: `apps/spectator/src/App.tsx`

### Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Main map view with race UI |
| SimulationManager | `/simulation` | Control panel for athlete simulation |

## Key Components

### Map Component

`apps/spectator/src/components/Map.tsx`

The core map component that:
- Initializes Mapbox GL with globe projection
- Renders terrain with DEM exaggeration (1.5)
- Displays the race route as a yellow line
- Manages athlete markers (single and multi-athlete modes)

#### Map Ref Methods

```typescript
// Single-athlete mode
mapRef.current.updateAthletePosition(lng, lat)
mapRef.current.removeAthleteMarker()

// Multi-athlete mode
mapRef.current.updateAthletePositions(athletes)
mapRef.current.removeAthleteMarkerById(athleteId)
mapRef.current.clearAllAthleteMarkers()
mapRef.current.fitToAthletes()
```

### UI Components

#### RaceTimer
`apps/spectator/src/components/RaceTimer.tsx`

Live race timer with "LIVE" indicator. Displays elapsed time in HH:MM:SS format.

#### Leaderboard
`apps/spectator/src/components/Leaderboard.tsx`

Expandable side panel showing ranked athletes sorted by distance. Top 3 positions have medal-colored badges.

#### AthleteInfoSheet
`apps/spectator/src/components/AthleteInfoSheet.tsx`

Bottom sheet with:
- Search bar for finding athletes
- Selected athlete information card
- Expandable details section

#### ARButton
`apps/spectator/src/components/ARButton.tsx`

Toggle button for AR view mode.

### ARView Component

`apps/spectator/src/components/ARView.tsx`

3D terrain visualization using:
- geo-three for Mapbox terrain rendering
- Three.js for 3D scene management
- Route rendering as 3D tube geometry
- Billboard athlete markers

## Z-Index Layer Management

UI overlays use carefully managed z-index values:

| Layer | Z-Index | Component |
|-------|---------|-----------|
| Leaderboard (open) | 60 | Expanded side panel |
| Search results | 50 | Dropdown menu |
| AthleteInfoSheet | 45 | Container |
| Buttons | 35 | Leaderboard, AR buttons |
| Athlete info panel | -1 (relative) | Info panel |

## Cross-Window Communication

The app uses localStorage for communication between windows:

### SimulationManager → Home (Commands)

```javascript
localStorage.setItem('simulation_command', JSON.stringify({
  command: 'start_single_athlete' | 'start_multiple_athletes' | 'pause' | 'resume' | 'stop' | 'reset' | 'set_speed',
  data: { /* command-specific data */ }
}))
```

### Home → SimulationManager (State Updates)

```javascript
localStorage.setItem('simulation_state', JSON.stringify({
  mode: 'single' | 'multiple',
  // State data
}))
```

## Data Files

### Route Data

- `public/TOR330.geojson` - Full race route
- `public/TOR330_waypoints.geojson` - Key waypoints

### Mock Athletes

Defined in `src/simulations/mockAthletes.ts`:

```typescript
interface MockAthlete {
  id: string
  name: string
  bib: string
  baseSpeed: number
  initialDistance: number
  age: number
  nationality: string
  club: string
  previousRaces: PreviousRace[]
  sponsors: Sponsor[]
}
```

## Development

### Running the App

```bash
pnpm dev:spectator
```

Opens at [http://localhost:5173](http://localhost:5173)

### Using the Simulation

1. Open the app in one browser window
2. Open `/simulation` in another window
3. Select athlete(s) and start simulation
4. Control simulation from the manager window
5. View real-time updates on the map
