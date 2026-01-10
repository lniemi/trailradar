/**
 * Predefined camera positions for street-level viewing along the TOR330 route
 * Each position represents a strategic viewpoint for spectators
 */

export const cameraPositions = [
  {
    id: 'start',
    name: 'Start Line - Cormayeur',
    description: 'View from the starting point in Cormayeur',
    lng: 7.0013,
    lat: 45.7969,
    estimatedElevation: 1224,
    lookDirection: 45 // Initial bearing in degrees
  },
  {
    id: 'col_checroui',
    name: 'Col Checroui',
    description: 'Mountain pass with panoramic views',
    lng: 7.0234,
    lat: 45.7812,
    estimatedElevation: 1956,
    lookDirection: 90
  },
  {
    id: 'val_veny',
    name: 'Val Veny Aid Station',
    description: 'Valley checkpoint with athlete support',
    lng: 6.9876,
    lat: 45.7654,
    estimatedElevation: 1660,
    lookDirection: 180
  },
  {
    id: 'col_seigne',
    name: 'Col de la Seigne',
    description: 'High mountain pass at Italy-France border',
    lng: 6.8012,
    lat: 45.7456,
    estimatedElevation: 2516,
    lookDirection: 270
  },
  {
    id: 'les_chapieux',
    name: 'Les Chapieux',
    description: 'Valley village checkpoint',
    lng: 6.7345,
    lat: 45.7012,
    estimatedElevation: 1549,
    lookDirection: 0
  },
  {
    id: 'col_bonhomme',
    name: 'Col du Bonhomme',
    description: 'Challenging mountain pass',
    lng: 6.7123,
    lat: 45.7234,
    estimatedElevation: 2329,
    lookDirection: 45
  },
  {
    id: 'les_houches',
    name: 'Les Houches',
    description: 'Major aid station in the valley',
    lng: 6.7987,
    lat: 45.8901,
    estimatedElevation: 1008,
    lookDirection: 90
  },
  {
    id: 'chamonix',
    name: 'Chamonix Valley',
    description: 'Iconic valley crossing',
    lng: 6.8693,
    lat: 45.9237,
    estimatedElevation: 1035,
    lookDirection: 135
  },
  {
    id: 'argentiere',
    name: 'Argentière',
    description: 'Village checkpoint',
    lng: 6.9234,
    lat: 45.9876,
    estimatedElevation: 1252,
    lookDirection: 180
  },
  {
    id: 'vallorcine',
    name: 'Vallorcine',
    description: 'Border crossing to Switzerland',
    lng: 6.9345,
    lat: 46.0345,
    estimatedElevation: 1260,
    lookDirection: 225
  },
  {
    id: 'trient',
    name: 'Trient',
    description: 'Swiss valley checkpoint',
    lng: 7.0012,
    lat: 46.0567,
    estimatedElevation: 1279,
    lookDirection: 270
  },
  {
    id: 'champex',
    name: 'Champex-Lac',
    description: 'Lakeside aid station',
    lng: 7.1123,
    lat: 46.0234,
    estimatedElevation: 1466,
    lookDirection: 315
  },
  {
    id: 'finish',
    name: 'Finish Line - Cormayeur',
    description: 'Final stretch back to Cormayeur',
    lng: 7.0013,
    lat: 45.7969,
    estimatedElevation: 1224,
    lookDirection: 0
  }
]

/**
 * Get camera position by ID
 * @param {string} id - Position identifier
 * @returns {Object|null} Camera position object or null if not found
 */
export function getCameraPosition(id) {
  return cameraPositions.find(pos => pos.id === id) || null
}

/**
 * Get nearest camera position to given coordinates
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Object} Nearest camera position
 */
export function getNearestCameraPosition(lng, lat) {
  let nearest = cameraPositions[0]
  let minDistance = Infinity

  cameraPositions.forEach(pos => {
    // Simple distance calculation (not accurate for large distances)
    const distance = Math.sqrt(
      Math.pow(pos.lng - lng, 2) +
      Math.pow(pos.lat - lat, 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      nearest = pos
    }
  })

  return nearest
}

/**
 * Get camera positions within a certain distance
 * @param {number} lng - Center longitude
 * @param {number} lat - Center latitude
 * @param {number} maxDistance - Maximum distance in degrees (rough approximation)
 * @returns {Array} Array of camera positions within range
 */
export function getCameraPositionsInRange(lng, lat, maxDistance = 0.1) {
  return cameraPositions.filter(pos => {
    const distance = Math.sqrt(
      Math.pow(pos.lng - lng, 2) +
      Math.pow(pos.lat - lat, 2)
    )
    return distance <= maxDistance
  })
}

/**
 * Get strategic viewpoints for race progression
 * Returns positions that represent key stages of the race
 */
export function getKeyViewpoints() {
  return [
    getCameraPosition('start'),
    getCameraPosition('col_seigne'),
    getCameraPosition('les_houches'),
    getCameraPosition('chamonix'),
    getCameraPosition('champex'),
    getCameraPosition('finish')
  ].filter(Boolean)
}