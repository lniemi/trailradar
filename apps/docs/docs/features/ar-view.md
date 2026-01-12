# AR View (3D Terrain)

The ARView component provides 3D terrain visualization using geo-three and Three.js.

## Overview

Located at `apps/spectator/src/components/ARView.tsx`, this component:
- Renders 3D terrain using Mapbox elevation data
- Displays the race route as a 3D tube
- Shows athlete positions with billboard markers
- Uses camera controls for navigation

## Technology Stack

| Library | Purpose |
|---------|---------|
| Three.js | 3D rendering engine |
| @react-three/fiber | React renderer for Three.js |
| geo-three | Geographic terrain tiles |

## Geo-Three Integration

### Map View Configuration

```typescript
import { MapView, MapBoxProvider, UnitsUtils } from 'geo-three'

// Use HEIGHT mode for 3D terrain
const mapView = new MapView(
  MapView.HEIGHT,
  mapBoxProvider,
  heightProvider
)
```

### MapView Modes

| Mode | Description |
|------|-------------|
| `MapView.PLANAR` | Flat 2D plane |
| `MapView.HEIGHT` | **3D terrain with elevation** |
| `MapView.HEIGHT_SHADER` | Shader-based displacement |
| `MapView.SPHERICAL` | Globe view |
| `MapView.MARTINI` | MARTINI mesh simplification |

### MapBox Providers

```typescript
// Satellite imagery
const mapProvider = new MapBoxProvider(
  token,
  'mapbox/satellite-v9',
  MapBoxProvider.STYLE,
  'png',
  false
)

// Terrain height data
const heightProvider = new MapBoxProvider(
  token,
  'mapbox.terrain-rgb',
  MapBoxProvider.MAP_ID,
  'pngraw',
  false
)
```

## Coordinate System

Geo-three uses EPSG:900913 (Spherical Mercator):

```typescript
import { UnitsUtils } from 'geo-three'

// Convert lat/lng to world coordinates
const coords = UnitsUtils.datumsToSpherical(lat, lng)

// Camera target
controls.target.set(coords.x, 0, -coords.y)

// Map origin positioning
mapView.position.set(-originCoords.x, 0, originCoords.y)
```

## Route Rendering

### Important: Use GeoJSON Elevation

**Do NOT use raycasting** for route positioning. Terrain tiles load asynchronously and raycasting returns incorrect heights.

**Use GeoJSON elevation directly:**

```typescript
// Route coordinates already have elevation
// Format: [longitude, latitude, elevation]
const coords = geojson.features[0].geometry.coordinates[0]

// Create 3D points
const points = coords.map(coord => {
  const pos = coordsToWorld(coord[1], coord[0]) // lat, lng
  const elevation = coord[2] // Use directly from GeoJSON
  return new THREE.Vector3(pos.x, elevation + 10, pos.z)
})
```

### Tube Geometry

```typescript
const curve = new THREE.CatmullRomCurve3(points)
const geometry = new THREE.TubeGeometry(
  curve,
  Math.min(points.length * 2, 1000), // segments
  20, // radius (meters)
  8,  // radial segments
  false // closed
)

const material = new THREE.MeshStandardMaterial({
  color: 0xffd700, // Yellow
  emissive: 0xffd700,
  emissiveIntensity: 0.3
})
```

## Athlete Markers

### Positioning

Like routes, use elevation from athlete state:

```typescript
// Home.jsx passes elevation
const athletePositions = [
  {
    id: '1',
    name: 'John',
    position: 1,
    lng: 7.23,
    lat: 45.52,
    elevation: 1500 // From getPositionAtDistance()
  }
]

// In AthleteMarker component
const pos = coordsToWorld(athlete.lat, athlete.lng)
const markerPosition = new THREE.Vector3(
  pos.x,
  athlete.elevation + 100, // Offset above terrain
  pos.z
)
```

### Billboard Effect

Markers always face the camera:

```typescript
useFrame(({ camera }) => {
  if (meshRef.current) {
    meshRef.current.quaternion.copy(camera.quaternion)
  }
})
```

## Performance Optimization

### LOD (Level of Detail)

```typescript
import { LODRaycast } from 'geo-three'

const lod = new LODRaycast()
mapView.onBeforeRender = (renderer, scene, camera) => {
  lod.update(mapView, camera, renderer, scene)
}
```

### Route Sampling

Sample route points to reduce geometry:

```typescript
// Use every 10th point
const sampledCoords = coords.filter((_, i) => i % 10 === 0)
```

### Geometry Limits

```typescript
const segments = Math.min(points.length * 2, 1000)
```

### Memory Management

Dispose old geometry before creating new:

```typescript
if (routeGeometry.current) {
  routeGeometry.current.dispose()
}
routeGeometry.current = new THREE.TubeGeometry(...)
```

## Integration with Home

```tsx
// Home.tsx
const [showARView, setShowARView] = useState(false)
const [athletePositions, setAthletePositions] = useState([])

// Update positions from simulation
useEffect(() => {
  const states = multiSimulationRef.current.getAllStates()
  setAthletePositions(states.map(s => ({
    id: s.id,
    name: s.name,
    position: s.position,
    lng: s.lng,
    lat: s.lat,
    elevation: s.elevation
  })))
}, [simulationTick])

return (
  <>
    {showARView ? (
      <ARView
        routeGeojson={routeData}
        athletePositions={athletePositions}
      />
    ) : (
      <Map ref={mapRef} routeGeojson={routeData} />
    )}
    <ARButton onClick={() => setShowARView(!showARView)} />
  </>
)
```
