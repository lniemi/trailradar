# @sportradar/utils

Shared utilities for SportRadar applications, primarily geographic calculations.

## Installation

This package is included in the monorepo. Import directly:

```typescript
import {
  haversineDistance,
  calculateTotalDistance,
  getPositionAtDistance
} from '@sportradar/utils/geo'
```

## Geographic Utilities

### haversineDistance

Calculate the distance between two geographic points using the Haversine formula.

```typescript
import { haversineDistance } from '@sportradar/utils/geo'

const distance = haversineDistance(
  { lat: 45.5231, lng: 7.2341 },
  { lat: 45.5300, lng: 7.2400 }
)

console.log(distance) // Distance in meters
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| point1 | `{ lat: number, lng: number }` | First coordinate |
| point2 | `{ lat: number, lng: number }` | Second coordinate |

#### Returns

`number` - Distance in meters.

### calculateTotalDistance

Calculate the total distance of a route (array of coordinates).

```typescript
import { calculateTotalDistance } from '@sportradar/utils/geo'

const route = [
  [7.2341, 45.5231, 1500], // [lng, lat, elevation]
  [7.2400, 45.5300, 1550],
  [7.2500, 45.5400, 1600],
]

const totalDistance = calculateTotalDistance(route)
console.log(totalDistance) // Total distance in meters
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| coordinates | `[number, number, number][]` | Array of [lng, lat, elevation] |

#### Returns

`number` - Total distance in meters.

### getPositionAtDistance

Get the interpolated position at a specific distance along a route.

```typescript
import { getPositionAtDistance } from '@sportradar/utils/geo'

const route = [
  [7.2341, 45.5231, 1500],
  [7.2400, 45.5300, 1550],
  [7.2500, 45.5400, 1600],
]

const position = getPositionAtDistance(route, 500) // 500 meters along route

console.log(position)
// {
//   lng: 7.2370,
//   lat: 45.5265,
//   elevation: 1525,
//   bearing: 45.2
// }
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| coordinates | `[number, number, number][]` | Route coordinates |
| distance | `number` | Distance in meters |

#### Returns

```typescript
{
  lng: number      // Longitude
  lat: number      // Latitude
  elevation: number // Elevation in meters
  bearing: number  // Heading in degrees
}
```

## Usage in Simulation

These utilities power the athlete simulation system:

```typescript
// In AthleteSimulation class
const position = getPositionAtDistance(
  this.routeCoordinates,
  this.currentDistance
)

// Update athlete position on map
map.updateAthletePosition(position.lng, position.lat)
```

## Coordinate Format

SportRadar uses the GeoJSON coordinate format:

```
[longitude, latitude, elevation]
```

Note that longitude comes before latitude, following the GeoJSON specification.
