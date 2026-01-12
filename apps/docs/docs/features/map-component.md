# Map Component

The Map component is the core visualization element of the Spectator app.

## Overview

Located at `apps/spectator/src/components/Map.tsx`, this component:
- Initializes Mapbox GL with globe projection
- Renders terrain with DEM exaggeration
- Displays the race route
- Manages athlete markers

## Initialization

```tsx
import Map from './components/Map'

function Home() {
  const mapRef = useRef(null)

  return (
    <Map
      ref={mapRef}
      routeGeojson={routeData}
    />
  )
}
```

## Configuration

### Mapbox Setup

The map uses these Mapbox features:
- **Projection**: Globe
- **Style**: Mapbox Outdoors
- **Terrain**: DEM with 1.5x exaggeration

### Route Layer

The race route is rendered as a line layer:

```javascript
{
  id: 'route',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#FFD700', // Yellow
    'line-width': 4
  }
}
```

## Ref Methods

Access map functionality via ref:

### Single-Athlete Mode

```typescript
// Update athlete position
mapRef.current.updateAthletePosition(longitude, latitude)

// Remove athlete marker
mapRef.current.removeAthleteMarker()
```

### Multi-Athlete Mode

```typescript
// Update multiple athletes
mapRef.current.updateAthletePositions([
  { id: '1', name: 'John', position: 1, lng: 7.23, lat: 45.52 },
  { id: '2', name: 'Jane', position: 2, lng: 7.24, lat: 45.53 },
])

// Remove specific athlete
mapRef.current.removeAthleteMarkerById('1')

// Clear all markers
mapRef.current.clearAllAthleteMarkers()

// Fit map to show all athletes
mapRef.current.fitToAthletes()
```

## Marker Styling

Athletes are displayed with color-coded markers:

| Position | Color |
|----------|-------|
| 1st | Gold |
| 2nd | Silver |
| 3rd | Bronze |
| 4th+ | Red |

## Implementation Notes

### Naming Convention

The component is named `MapComponent` internally to avoid conflict with JavaScript's built-in `Map` constructor:

```tsx
// In Map.tsx
function MapComponent({ routeGeojson }, ref) {
  // ...
}

export default forwardRef(MapComponent)
```

When using JavaScript's Map inside this component:

```javascript
// Use window.Map() instead of Map()
const markers = new window.Map()
```

### Route Data Format

Route coordinates use GeoJSON MultiLineString:

```javascript
// Access coordinates
const coords = geojson.features[0].geometry.coordinates[0]
// Each coordinate: [longitude, latitude, elevation]
```

## Performance

- Map state is managed via refs to prevent unnecessary re-renders
- Markers are updated individually rather than re-rendering all
- Route is loaded once and cached
