import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import './Map.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const MapComponent = forwardRef(({ routeData }: { routeData?: any }, ref) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const athleteMarker = useRef(null) // For single athlete mode (backward compatibility)
  const athleteMarkers = useRef(new window.Map()) // Map<athleteId, marker> for multiple athletes

  const pendingRouteData = useRef(null)

  const addRouteToMap = (mapInstance, data) => {
    if (!mapInstance || !data) return

    // Remove existing route layer/source if present
    if (mapInstance.getLayer('route-line')) {
      mapInstance.removeLayer('route-line')
    }
    if (mapInstance.getSource('route')) {
      mapInstance.removeSource('route')
    }

    mapInstance.addSource('route', {
      type: 'geojson',
      data: data
    })

    mapInstance.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#ffff00',
        'line-width': 3
      }
    })

    // Calculate bounds and zoom to extent
    const coordinates = data.features[0].geometry.coordinates[0]
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

    mapInstance.fitBounds(bounds, {
      padding: 50
    })
  }

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [0, 0],
      zoom: 2,
      projection: 'globe',
      terrain: { source: 'mapbox-dem', exaggeration: 1.5 }
    })

    map.current.on('load', () => {
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14
      })
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // If route data arrived before the map was ready, add it now
      if (pendingRouteData.current) {
        addRouteToMap(map.current, pendingRouteData.current)
        pendingRouteData.current = null
      }
    })

    return () => {
      if (athleteMarker.current) {
        athleteMarker.current.remove()
      }
      // Clean up all athlete markers
      athleteMarkers.current.forEach(marker => marker.remove())
      athleteMarkers.current.clear()

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add route data to map when available
  useEffect(() => {
    if (!map.current || !routeData) return

    if (map.current.isStyleLoaded()) {
      addRouteToMap(map.current, routeData)
    } else {
      // Map not ready yet — queue for when load fires
      pendingRouteData.current = routeData
    }
  }, [routeData])

  // Helper function to get marker color by position
  const getMarkerColor = (position) => {
    if (position === 1) return '#FFD700' // Gold
    if (position === 2) return '#C0C0C0' // Silver
    if (position === 3) return '#CD7F32' // Bronze
    return '#ff0000' // Default red
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateAthletePosition(lng, lat) {
      if (!map.current) return

      if (!athleteMarker.current) {
        // Create marker on first update
        const el = document.createElement('div')
        el.className = 'athlete-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#ff0000'
        el.style.border = '3px solid white'
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'

        athleteMarker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current)
      } else {
        // Update existing marker
        athleteMarker.current.setLngLat([lng, lat])
      }

      // Center map on athlete
      map.current.easeTo({
        center: [lng, lat],
        duration: 1000
      })
    },

    removeAthleteMarker() {
      if (athleteMarker.current) {
        athleteMarker.current.remove()
        athleteMarker.current = null
      }
    },

    /**
     * Update positions for multiple athletes
     * @param {Array} athletes - Array of {id, name, position, lng, lat}
     */
    updateAthletePositions(athletes) {
      if (!map.current) return

      athletes.forEach(athlete => {
        const existingMarker = athleteMarkers.current.get(athlete.id)

        if (!existingMarker) {
          // Create new marker
          const el = document.createElement('div')
          el.className = 'athlete-marker'
          el.style.width = '20px'
          el.style.height = '20px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = getMarkerColor(athlete.position)
          el.style.border = '3px solid white'
          el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'
          el.style.cursor = 'pointer'
          el.title = `${athlete.name} (#${athlete.position})`

          const marker = new mapboxgl.Marker(el)
            .setLngLat([athlete.lng, athlete.lat])
            .addTo(map.current)

          athleteMarkers.current.set(athlete.id, marker)
        } else {
          // Update existing marker position and color
          existingMarker.setLngLat([athlete.lng, athlete.lat])
          const el = existingMarker.getElement()
          el.style.backgroundColor = getMarkerColor(athlete.position)
          el.title = `${athlete.name} (#${athlete.position})`
        }
      })
    },

    /**
     * Remove a specific athlete marker
     * @param {number} athleteId - Athlete ID to remove
     */
    removeAthleteMarkerById(athleteId) {
      const marker = athleteMarkers.current.get(athleteId)
      if (marker) {
        marker.remove()
        athleteMarkers.current.delete(athleteId)
      }
    },

    /**
     * Clear all athlete markers (for multi-athlete mode)
     */
    clearAllAthleteMarkers() {
      athleteMarkers.current.forEach(marker => marker.remove())
      athleteMarkers.current.clear()
    },

    /**
     * Fit map to show all athletes
     */
    fitToAthletes() {
      if (!map.current || athleteMarkers.current.size === 0) return

      const bounds = new mapboxgl.LngLatBounds()

      athleteMarkers.current.forEach(marker => {
        bounds.extend(marker.getLngLat())
      })

      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15
      })
    }
  }))

  return <div ref={mapContainer} className="map-container" />
})

MapComponent.displayName = 'Map'

export default MapComponent
