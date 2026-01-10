/**
 * Calculate the Haversine distance between two points on Earth
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate total distance along a route
 * @param {Array} coordinates - Array of [lon, lat, elevation] coordinates
 * @returns {number} Total distance in kilometers
 */
export function calculateTotalDistance(coordinates) {
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
 * @param {Array} coordinates - Array of [lon, lat, elevation] coordinates
 * @param {number} targetDistance - Distance along route in kilometers
 * @returns {Object} Position with {lng, lat, elevation, segmentIndex}
 */
export function getPositionAtDistance(coordinates, targetDistance) {
  let accumulatedDistance = 0

  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1, elev1] = coordinates[i - 1]
    const [lon2, lat2, elev2] = coordinates[i]

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
    elevation: lastCoord[2],
    segmentIndex: coordinates.length - 1
  }
}
