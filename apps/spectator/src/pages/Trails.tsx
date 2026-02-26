import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Trail } from '../types/trail'
import { getAllTrails, saveImportedTrail, deleteImportedTrail } from '../utils/trailStorage'
import { parseGpxFile } from '../utils/gpxToGeojson'
import './Trails.css'

export default function Trails() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [trails, setTrails] = useState<Trail[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshTrails = async () => {
    const all = await getAllTrails()
    setTrails(all)
  }

  useEffect(() => {
    refreshTrails().finally(() => setLoading(false))
  }, [])

  const handleTrailClick = (trail: Trail) => {
    navigate(`/trail/${trail.id}`)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const parsed = await parseGpxFile(file)

      const trail: Trail = {
        id: `imported-${Date.now()}`,
        name: parsed.name,
        location: 'Imported',
        distance: parsed.distance,
        elevationGain: parsed.elevationGain,
        source: 'imported',
      }

      await saveImportedTrail(trail, parsed.geojson)
      await refreshTrails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import GPX file')
    } finally {
      setImporting(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (e: React.MouseEvent, trailId: string) => {
    e.stopPropagation()
    await deleteImportedTrail(trailId)
    await refreshTrails()
  }

  return (
    <div className="trails-page">
      <header className="trails-header">
        <h1>TrailRadar</h1>
        <p className="trails-subtitle">Select a trail to spectate</p>
      </header>

      <div className="trails-actions">
        <button
          className="import-btn"
          onClick={handleImportClick}
          disabled={importing}
        >
          {importing ? 'Importing...' : '+ Import GPX'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div className="trails-error">
          {error}
          <button onClick={() => setError(null)} className="error-dismiss">&times;</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading trails...</p>
      ) : (
        <div className="trails-list">
          {trails.map((trail) => (
            <div
              key={trail.id}
              className="trail-item"
              onClick={() => handleTrailClick(trail)}
            >
              <div className="trail-item-content">
                <div className="trail-item-header">
                  <span className="trail-name">{trail.name}</span>
                  {trail.source === 'imported' && (
                    <span className="trail-badge">imported</span>
                  )}
                </div>
                <div className="trail-meta">
                  <span>{trail.location}</span>
                  <span>{trail.distance} km</span>
                  {trail.elevationGain != null && (
                    <span>+{trail.elevationGain} m</span>
                  )}
                </div>
              </div>
              {trail.source === 'imported' && (
                <button
                  className="trail-delete"
                  onClick={(e) => handleDelete(e, trail.id)}
                  title="Delete imported trail"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
