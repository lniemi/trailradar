import type { Trail } from '../types/trail'
import { BUILTIN_TRAILS } from '../data/trails'

/**
 * Fetch imported trails from the dev server.
 * The Vite plugin serves GET /api/trails which reads from public/imported-trails/index.json
 */
export async function getImportedTrails(): Promise<Trail[]> {
  try {
    const res = await fetch('/api/trails')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/**
 * Save an imported trail to the dev server.
 * Sends geojson + metadata via POST /api/trails.
 * The plugin writes the GeoJSON to public/imported-trails/<id>.geojson
 * and updates the index.
 */
export async function saveImportedTrail(
  trail: Trail,
  geojson: object
): Promise<Trail> {
  const res = await fetch('/api/trails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: trail.id,
      name: trail.name,
      location: trail.location,
      distance: trail.distance,
      elevationGain: trail.elevationGain,
      geojson,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Save failed' }))
    throw new Error(err.error || 'Failed to save trail')
  }

  // The server returns the trail metadata with geojsonUrl set
  return await res.json()
}

/**
 * Delete an imported trail from the dev server.
 */
export async function deleteImportedTrail(id: string): Promise<void> {
  await fetch(`/api/trails?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/**
 * Get all trails (built-in + imported from server).
 */
export async function getAllTrails(): Promise<Trail[]> {
  const imported = await getImportedTrails()
  return [...BUILTIN_TRAILS, ...imported]
}

/**
 * Find a trail by ID (checks built-in first, then fetches imported from server).
 */
export async function getTrailById(id: string): Promise<Trail | null> {
  const builtin = BUILTIN_TRAILS.find((t) => t.id === id)
  if (builtin) return builtin

  const imported = await getImportedTrails()
  return imported.find((t) => t.id === id) ?? null
}
