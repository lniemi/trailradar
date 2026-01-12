# Simulation System

The simulation system allows virtual athletes to traverse routes for testing and development.

## Overview

The system supports two modes:
- **Single-Athlete**: One athlete simulation for focused testing
- **Multi-Athlete**: Multiple concurrent athletes for realistic scenarios

## Architecture

### Core Modules

| Module | Location | Purpose |
|--------|----------|---------|
| AthleteSimulation | `src/simulations/athleteSimulation.ts` | Single athlete movement |
| MultiAthleteSimulation | `src/simulations/multiAthleteSimulation.ts` | Multiple athlete coordination |
| mockAthletes | `src/simulations/mockAthletes.ts` | Test athlete data |

### Class: AthleteSimulation

Manages a single simulated athlete:

```typescript
const sim = new AthleteSimulation(routeCoordinates, {
  initialDistance: 5000, // Start 5km into route
  baseSpeed: 12 // km/h
})

sim.start()

// Get current state
const state = sim.getState()
// {
//   position: { lng, lat, elevation },
//   distance: 5500,
//   progress: 1.67, // percentage
//   elapsedTime: 180000, // ms
//   isFinished: false
// }
```

#### Methods

| Method | Description |
|--------|-------------|
| `start()` | Begin simulation |
| `pause()` | Pause movement |
| `resume()` | Resume movement |
| `stop()` | Stop simulation |
| `reset()` | Reset to initial position |
| `setSpeed(speed)` | Change speed (km/h) |
| `getState()` | Get current state |

### Class: MultiAthleteSimulation

Manages multiple AthleteSimulation instances:

```typescript
const multiSim = new MultiAthleteSimulation(routeCoordinates, athletes)

// Global controls
multiSim.start()
multiSim.pause()
multiSim.setGlobalSpeed(15)

// Individual controls
multiSim.pauseAthlete('athlete-1')
multiSim.setAthleteSpeed('athlete-1', 10)

// State
const allStates = multiSim.getAllStates()
const oneState = multiSim.getAthleteState('athlete-1')
const allDone = multiSim.areAllFinished()
```

## Cross-Window Communication

### Command Flow (SimulationManager → Home)

```javascript
// SimulationManager sends command
localStorage.setItem('simulation_command', JSON.stringify({
  command: 'start_multiple_athletes',
  data: {
    athletes: [
      { id: '1', name: 'John', baseSpeed: 12, initialDistance: 0 },
      { id: '2', name: 'Jane', baseSpeed: 14, initialDistance: 1000 }
    ]
  }
}))

// Home listens
window.addEventListener('storage', (e) => {
  if (e.key === 'simulation_command') {
    const { command, data } = JSON.parse(e.newValue)
    // Handle command
  }
})
```

### State Flow (Home → SimulationManager)

```javascript
// Home broadcasts state every 100ms
localStorage.setItem('simulation_state', JSON.stringify({
  mode: 'multiple',
  athletes: [
    {
      id: '1',
      name: 'John',
      distance: 5500,
      progress: 1.67,
      speed: 12,
      isPaused: false,
      isFinished: false
    },
    // ...
  ]
}))
```

### Available Commands

| Command | Data | Description |
|---------|------|-------------|
| `start_single_athlete` | `{ athlete }` | Start single mode |
| `start_multiple_athletes` | `{ athletes }` | Start multi mode |
| `pause` | - | Pause all |
| `resume` | - | Resume all |
| `stop` | - | Stop all |
| `reset` | - | Reset all |
| `set_speed` | `{ speed }` | Set global speed |
| `pause_athlete` | `{ athleteId }` | Pause one |
| `resume_athlete` | `{ athleteId }` | Resume one |
| `stop_athlete` | `{ athleteId }` | Stop one |
| `set_athlete_speed` | `{ athleteId, speed }` | Set speed for one |

## Mock Athletes

Predefined test athletes in `mockAthletes.ts`:

```typescript
interface MockAthlete {
  id: string
  name: string
  bib: string
  baseSpeed: number      // km/h
  initialDistance: number // meters
  age: number
  nationality: string
  club: string
  previousRaces: Array<{
    name: string
    year: number
    position: number
  }>
  sponsors: Array<{
    name: string
    logo: string
  }>
}
```

### Helper Functions

```typescript
import { getAthleteById, getAthleteByBib } from './mockAthletes'

const athlete = getAthleteById('athlete-1')
const athlete2 = getAthleteByBib('101')
```

## Usage Guide

### Development Testing

1. Open Home (`/`) in one browser window
2. Open SimulationManager (`/simulation`) in another
3. In SimulationManager:
   - Single mode: Select athlete, click "Start Single Athlete Simulation"
   - Multi mode: Check athletes, click "Start Multiple Athletes"
4. Use controls to manage simulation
5. Observe updates on map in real-time

### Simulation Manager Features

- Speed control (1-99999 km/h for single, 1-50 km/h for multi)
- Play/Pause/Stop/Reset buttons
- Individual athlete controls in multi mode
- Live status display with distance, time, progress
- Scrollable athlete list sorted by position
