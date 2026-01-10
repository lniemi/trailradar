import { haversineDistance } from './haversine'

/** A coordinate point with longitude, latitude, and optional elevation */
export type Coordinate = [lon: number, lat: number, elevation?: number]

/** Position along a route */
export interface RoutePosition {
  lng: number
  lat: number
  elevation: number
  segmentIndex: number
}

/**
 * Calculate total distance along a route
 * @param coordinates - Array of [lon, lat, elevation] coordinates
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(coordinates: Coordinate[]): number {
  let totalDistance = 0

  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1]
    const [lon2, lat2] = coordinates[i]
    totalDistance += haversineDistance(lat1, lon1, lat2, lon2)
  }

  return totalDistance
}

/**
 * Find position along route at a given distance
 * @param coordinates - Array of [lon, lat, elevation] coordinates
 * @param targetDistance - Distance along route in kilometers
 * @returns Position with lng, lat, elevation, and segmentIndex
 */
export function getPositionAtDistance(
  coordinates: Coordinate[],
  targetDistance: number
): RoutePosition {
  let accumulatedDistance = 0

  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1, elev1 = 0] = coordinates[i - 1]
    const [lon2, lat2, elev2 = 0] = coordinates[i]

    const segmentDistance = haversineDistance(lat1, lon1, lat2, lon2)

    if (accumulatedDistance + segmentDistance >= targetDistance) {
      // Target is in this segment
      const remainingDistance = targetDistance - accumulatedDistance
      const ratio = remainingDistance / segmentDistance

      // Linear interpolation
      const lng = lon1 + (lon2 - lon1) * ratio
      const lat = lat1 + (lat2 - lat1) * ratio
      const elevation = elev1 + (elev2 - elev1) * ratio

      return { lng, lat, elevation, segmentIndex: i - 1 }
    }

    accumulatedDistance += segmentDistance
  }

  // If we've gone past the end, return the last point
  const lastCoord = coordinates[coordinates.length - 1]
  return {
    lng: lastCoord[0],
    lat: lastCoord[1],
    elevation: lastCoord[2] ?? 0,
    segmentIndex: coordinates.length - 1,
  }
}
