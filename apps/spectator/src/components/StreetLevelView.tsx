import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import './StreetLevelView.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export default function StreetLevelView({ isOpen, onClose, athletePositions = [], currentPosition = null }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const athleteMarkers = useRef(new Map())
  const [viewPosition, setViewPosition] = useState(null)
  const [isRotating, setIsRotating] = useState(false)
  const rotationStart = useRef({ x: 0, bearing: 0 })

  useEffect(() => {
    if (!isOpen || map.current) return

    // Initialize map with 3D terrain
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: currentPosition?.lng ? [currentPosition.lng, currentPosition.lat] : [7.8, 45.9], // Default to TOR330 area
      zoom: 18,
      pitch: 85, // Maximum pitch for street-level view
      bearing: 0,
      antialias: true,
      terrain: { source: 'mapbox-dem', exaggeration: 1.5 }
    })

    map.current.on('style.load', () => {
      // Add terrain source
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14
      })

      // Set terrain
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // Add sky layer for realistic atmosphere
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      })

      // Load and display TOR330 route as 3D line
      fetch('/TOR330.geojson')
        .then(response => response.json())
        .then(data => {
          map.current.addSource('tor330', {
            type: 'geojson',
            data: data
          })

          // Add route as 3D line at ground level
          map.current.addLayer({
            id: 'tor330-3d',
            type: 'line',
            source: 'tor330',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ffff00',
              'line-width': 6,
              'line-opacity': 0.8
            }
          })

          // Position camera at street level if position provided
          if (currentPosition) {
            positionCamera(currentPosition.lng, currentPosition.lat)
          }
        })
    })

    // Handle mouse rotation for 360° view
    const handleMouseDown = (e) => {
      if (e.button === 0) { // Left click only
        setIsRotating(true)
        rotationStart.current = {
          x: e.clientX,
          bearing: map.current.getBearing()
        }
        e.preventDefault()
      }
    }

    const handleMouseMove = (e) => {
      if (!isRotating) return

      const deltaX = e.clientX - rotationStart.current.x
      const newBearing = rotationStart.current.bearing - deltaX * 0.5

      map.current.setBearing(newBearing)
    }

    const handleMouseUp = () => {
      setIsRotating(false)
    }

    // Add touch support for mobile
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        setIsRotating(true)
        rotationStart.current = {
          x: e.touches[0].clientX,
          bearing: map.current.getBearing()
        }
        e.preventDefault()
      }
    }

    const handleTouchMove = (e) => {
      if (!isRotating || e.touches.length !== 1) return

      const deltaX = e.touches[0].clientX - rotationStart.current.x
      const newBearing = rotationStart.current.bearing - deltaX * 0.5

      map.current.setBearing(newBearing)
    }

    const handleTouchEnd = () => {
      setIsRotating(false)
    }

    // Attach event listeners
    const container = mapContainer.current
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove)
    container.addEventListener('touchend', handleTouchEnd)

    // Disable default map interactions
    map.current.dragPan.disable()
    map.current.scrollZoom.disable()
    map.current.boxZoom.disable()
    map.current.doubleClickZoom.disable()
    map.current.touchZoomRotate.disable()
    map.current.keyboard.disable()

    return () => {
      // Cleanup event listeners
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, currentPosition])

  // Position camera at street level (2m above terrain)
  const positionCamera = async (lng, lat) => {
    if (!map.current) return

    try {
      // Get terrain elevation at this point
      const elevation = map.current.queryTerrainElevation([lng, lat]) || 0

      // Set camera position 2 meters above terrain
      const camera = map.current.getFreeCameraOptions()

      // Position: 2 meters above ground at the given coordinates
      const position = mapboxgl.MercatorCoordinate.fromLngLat(
        [lng, lat],
        elevation + 2
      )

      // Look slightly ahead along the route
      const lookAheadDistance = 0.0002 // degrees
      const lookAtPoint = [lng + lookAheadDistance, lat]

      camera.position = position
      camera.lookAtPoint(lookAtPoint)

      map.current.setFreeCameraOptions(camera)

      setViewPosition({ lng, lat, elevation: elevation + 2 })
    } catch (err) {
      console.error('Failed to position camera:', err)
    }
  }

  // Update athlete markers in 3D space
  useEffect(() => {
    if (!map.current || !isOpen || !athletePositions.length) return

    athletePositions.forEach(athlete => {
      let marker = athleteMarkers.current.get(athlete.id)

      if (!marker) {
        // Create 3D marker for athlete
        const el = document.createElement('div')
        el.className = 'athlete-marker-3d'
        el.innerHTML = `
          <div class="athlete-pole"></div>
          <div class="athlete-flag">
            <div class="athlete-number">${athlete.position}</div>
            <div class="athlete-name">${athlete.name}</div>
          </div>
        `

        marker = new mapboxgl.Marker(el)
          .setLngLat([athlete.lng, athlete.lat])
          .addTo(map.current)

        athleteMarkers.current.set(athlete.id, marker)
      } else {
        // Update position
        marker.setLngLat([athlete.lng, athlete.lat])

        // Update display info
        const flagEl = marker.getElement().querySelector('.athlete-flag')
        if (flagEl) {
          flagEl.innerHTML = `
            <div class="athlete-number">${athlete.position}</div>
            <div class="athlete-name">${athlete.name}</div>
          `
        }
      }

      // Color code by position
      const el = marker.getElement()
      el.classList.remove('gold', 'silver', 'bronze')
      if (athlete.position === 1) el.classList.add('gold')
      else if (athlete.position === 2) el.classList.add('silver')
      else if (athlete.position === 3) el.classList.add('bronze')
    })

    // Remove markers for athletes no longer in the list
    athleteMarkers.current.forEach((marker, id) => {
      if (!athletePositions.find(a => a.id === id)) {
        marker.remove()
        athleteMarkers.current.delete(id)
      }
    })
  }, [athletePositions, isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        // Remove all markers
        athleteMarkers.current.forEach(marker => marker.remove())
        athleteMarkers.current.clear()

        // Remove map
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="street-level-view">
      <div className="street-level-header">
        <div className="view-info">
          <h3>Street Level View</h3>
          {viewPosition && (
            <p className="position-info">
              Elevation: {Math.round(viewPosition.elevation)}m |
              Lat: {viewPosition.lat.toFixed(5)} |
              Lng: {viewPosition.lng.toFixed(5)}
            </p>
          )}
        </div>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="rotation-hint">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
          <path d="M12 2v4m0 0a8 8 0 018 8h4m-4 0l3-3m-3 3l3 3"/>
        </svg>
        Drag to rotate 360°
      </div>

      <div className="street-level-map" ref={mapContainer}></div>

      <div className="compass">
        <div className="compass-arrow"></div>
        <div className="compass-label">N</div>
      </div>
    </div>
  )
}