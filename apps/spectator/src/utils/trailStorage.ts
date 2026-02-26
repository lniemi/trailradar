import type { Trail } from '../types/trail'
import { BUILTIN_TRAILS } from '../data/trails'

const STORAGE_KEY = 'trailradar_imported_trails'

export function getImportedTrails(): Trail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Trail[]
  } catch {
    return []
  }
}

export function saveImportedTrail(trail: Trail): void {
  const trails = getImportedTrails()
  // Replace if same id exists, otherwise append
  const index = trails.findIndex((t) => t.id === trail.id)
  if (index >= 0) {
    trails[index] = trail
  } else {
    trails.push(trail)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trails))
}

export function deleteImportedTrail(id: string): void {
  const trails = getImportedTrails().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trails))
}

export function getAllTrails(): Trail[] {
  return [...BUILTIN_TRAILS, ...getImportedTrails()]
}

export function getTrailById(id: string): Trail | null {
  const builtin = BUILTIN_TRAILS.find((t) => t.id === id)
  if (builtin) return builtin

  const imported = getImportedTrails().find((t) => t.id === id)
  return imported ?? null
}
