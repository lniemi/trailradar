import toGeoJSON from '@mapbox/togeojson'
import { calculateTotalDistance } from '../simulations/utils'

interface ParsedTrail {
  name: string
  geojson: object
  distance: number
  elevationGain: number
}

/**
 * Parse a GPX file and convert it to GeoJSON in the format expected by the app:
 * FeatureCollection with a single Feature containing MultiLineString geometry
 * with [lng, lat, elevation] coordinates.
 */
export async function parseGpxFile(file: File): Promise<ParsedTrail> {
  const text = await file.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Invalid GPX file: could not parse XML')
  }

  const geojsonRaw = toGeoJSON.gpx(xmlDoc)

  if (!geojsonRaw.features || geojsonRaw.features.length === 0) {
    throw new Error('GPX file contains no tracks or routes')
  }

  // Extract name from GPX metadata or first feature
  const name =
    geojsonRaw.features[0]?.properties?.name ||
    file.name.replace(/\.gpx$/i, '')

  // Collect all coordinates from all LineString/MultiLineString features
  const allCoords: number[][] = []
  for (const feature of geojsonRaw.features) {
    const geom = feature.geometry
    if (geom.type === 'LineString') {
      allCoords.push(...geom.coordinates)
    } else if (geom.type === 'MultiLineString') {
      for (const segment of geom.coordinates) {
        allCoords.push(...segment)
      }
    }
    // Skip Point features (waypoints) — we only want the track
  }

  if (allCoords.length === 0) {
    throw new Error('GPX file contains no track coordinates')
  }

  // Ensure coordinates have elevation (default to 0 if missing)
  const normalizedCoords = allCoords.map((coord) => [
    coord[0], // lng
    coord[1], // lat
    coord[2] ?? 0, // elevation
  ])

  // Calculate elevation gain
  let elevationGain = 0
  for (let i = 1; i < normalizedCoords.length; i++) {
    const diff = normalizedCoords[i][2] - normalizedCoords[i - 1][2]
    if (diff > 0) elevationGain += diff
  }

  // Build normalized GeoJSON in the format the app expects
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'MultiLineString',
          coordinates: [normalizedCoords],
        },
      },
    ],
  }

  // Calculate total distance
  const distance = calculateTotalDistance(normalizedCoords)

  return {
    name,
    geojson,
    distance: Math.round(distance * 10) / 10,
    elevationGain: Math.round(elevationGain),
  }
}
